const crypto = require("crypto");
const QRCode = require("qrcode");
const PDFDocument = require("pdfkit");
const Payment = require("../models/Payment");
const Room = require("../models/Room");
const PG = require("../models/PG");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const logger = require("../config/logger");
const { getRazorpay } = require("../config/razorpay");
const { notify } = require("../utils/notify");
const { logActivity } = require("../utils/activityLog");
const { uploadBuffer } = require("../config/cloudinary");

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const CONVENIENCE_FEE = Number(process.env.RAZORPAY_CONVENIENCE_FEE) || 20;

const generateMonthlyRents = asyncHandler(async (req, res) => {
  const { pgId } = req.params;
  const { month, year } = req.body;
  logger.info(`[GENERATE RENTS] PG: ${pgId} Period: ${month}/${year}`);

  const pg = await PG.findById(pgId);
  if (!pg) throw new AppError("PG not found", 404);
  if (pg.owner.toString() !== req.user._id.toString()) throw new AppError("Not authorized", 403);

  const rooms = await Room.find({ pg: pgId }).populate("residents");
  const payments = [];
  const dueDate = new Date(year, month - 1, 5);

  for (const room of rooms) {
    for (const resident of room.residents) {
      const exists = await Payment.findOne({ resident: resident._id, room: room._id, month, year });
      if (!exists) {
        payments.push({
          resident: resident._id, room: room._id, pg: pgId,
          amount: room.rent, month, year, dueDate,
        });
      }
    }
  }

  if (payments.length > 0) {
    const created = await Payment.insertMany(payments);
    await Promise.all(
      created.map((p) =>
        notify({
          user: p.resident,
          title: "Rent Due",
          message: `Your rent of ₹${p.amount.toLocaleString()} for ${MONTHS[month - 1]} ${year} is due.`,
          type: "payment",
          link: "/resident/payments",
        })
      )
    );
  }

  await logActivity({ owner: req.user._id, actor: req.user._id, action: "Rent Generated", entityType: "Payment", details: `${MONTHS[month - 1]} ${year} — ${payments.length} records` });

  logger.info(`[GENERATE RENTS] Created: ${payments.length} records`);
  res.json({ message: "Monthly rents generated", count: payments.length });
});

// --- Resident: payment method picker ---------------------------------------

// Returns which methods this owner accepts, the convenience fee, and (if UPI
// is enabled) the owner's UPI ID + an auto-generated QR code.
const getPaymentOptions = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id).populate({ path: "pg", populate: { path: "owner", select: "name businessName upiId paymentMethodsEnabled" } });
  if (!payment) throw new AppError("Payment record not found", 404);
  if (payment.resident.toString() !== req.user._id.toString()) throw new AppError("Not authorized", 403);
  if (payment.status === "paid") throw new AppError("This rent has already been paid", 400);

  const owner = payment.pg.owner;
  const enabled = owner.paymentMethodsEnabled || { razorpay: true, upi: true, cash: true };

  let upi = null;
  if (enabled.upi && owner.upiId) {
    const payeeName = encodeURIComponent(owner.businessName || owner.name || "Smart PG");
    const upiLink = `upi://pay?pa=${encodeURIComponent(owner.upiId)}&pn=${payeeName}&am=${payment.amount}&cu=INR`;
    const qrDataUrl = await QRCode.toDataURL(upiLink);
    upi = { upiId: owner.upiId, ownerName: owner.businessName || owner.name, qrDataUrl, upiLink };
  }

  res.json({
    amount: payment.amount,
    convenienceFee: enabled.razorpay ? CONVENIENCE_FEE : 0,
    methods: {
      razorpay: Boolean(enabled.razorpay),
      upi: Boolean(enabled.upi && owner.upiId),
      cash: Boolean(enabled.cash),
    },
    upi,
  });
});

// --- Method 1: Smart PG / Razorpay (automatic verification) ---------------

const createRazorpayOrder = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id);
  if (!payment) throw new AppError("Payment record not found", 404);
  if (payment.resident.toString() !== req.user._id.toString()) throw new AppError("Not authorized", 403);
  if (payment.status === "paid") throw new AppError("This rent has already been paid", 400);

  const razorpay = getRazorpay();
  const totalAmount = payment.amount + CONVENIENCE_FEE;
  const order = await razorpay.orders.create({
    amount: Math.round(totalAmount * 100),
    currency: "INR",
    receipt: `rent_${payment._id}`,
    notes: { paymentId: payment._id.toString(), month: payment.month, year: payment.year },
  });

  payment.razorpayOrderId = order.id;
  payment.convenienceFee = CONVENIENCE_FEE;
  await payment.save();

  res.json({
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: process.env.RAZORPAY_KEY_ID,
    paymentId: payment._id,
    convenienceFee: CONVENIENCE_FEE,
  });
});

const verifyRazorpayPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    throw new AppError("Missing payment verification details", 400);
  }

  const payment = await Payment.findById(req.params.id).populate("pg").populate("room");
  if (!payment) throw new AppError("Payment record not found", 404);
  if (payment.resident.toString() !== req.user._id.toString()) throw new AppError("Not authorized", 403);
  if (payment.razorpayOrderId !== razorpay_order_id) throw new AppError("Order mismatch", 400);

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    logger.warn(`[PAYMENT VERIFY] Signature mismatch for payment ${payment._id}`);
    payment.status = "failed";
    await payment.save();
    throw new AppError("Payment verification failed", 400);
  }

  payment.status = "paid";
  payment.paidAt = new Date();
  payment.razorpayPaymentId = razorpay_payment_id;
  payment.razorpaySignature = razorpay_signature;
  payment.paymentMethod = "razorpay";
  payment.verifiedBy = "automatic";
  await payment.save();

  const resident = await User.findById(req.user._id);
  notify({
    user: payment.pg.owner,
    title: "Rent Received",
    message: `${resident.name} paid ₹${payment.amount.toLocaleString()} for ${MONTHS[payment.month - 1]} ${payment.year} via Smart PG.`,
    type: "payment",
    link: "/owner/payments",
  });
  await logActivity({ owner: payment.pg.owner, actor: req.user._id, action: "Payment Received", entityType: "Payment", entityId: payment._id, details: `₹${payment.amount} via Razorpay (auto-verified)` });

  logger.info(`[PAYMENT VERIFY] Confirmed paid: ${payment._id}`);
  res.json(payment);
});

const razorpayWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers["x-razorpay-signature"];
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!secret) {
    logger.warn("[WEBHOOK] RAZORPAY_WEBHOOK_SECRET not set — ignoring webhook");
    return res.status(200).json({ received: true });
  }

  const expected = crypto.createHmac("sha256", secret).update(req.body).digest("hex");
  if (expected !== signature) {
    logger.warn("[WEBHOOK] Invalid signature");
    return res.status(400).json({ message: "Invalid signature" });
  }

  const payload = JSON.parse(req.body.toString());
  if (payload.event === "payment.captured") {
    const orderId = payload.payload?.payment?.entity?.order_id;
    const paymentId = payload.payload?.payment?.entity?.id;
    const payment = await Payment.findOne({ razorpayOrderId: orderId });
    if (payment && payment.status !== "paid") {
      payment.status = "paid";
      payment.paidAt = new Date();
      payment.razorpayPaymentId = paymentId;
      payment.paymentMethod = "razorpay";
      payment.verifiedBy = "automatic";
      await payment.save();
      logger.info(`[WEBHOOK] Marked paid via webhook: ${payment._id}`);
    }
  }

  res.status(200).json({ received: true });
});

// --- Method 2: Direct UPI (resident uploads proof, owner approves) --------

const submitUpiPayment = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id).populate("pg");
  if (!payment) throw new AppError("Payment record not found", 404);
  if (payment.resident.toString() !== req.user._id.toString()) throw new AppError("Not authorized", 403);
  if (payment.status === "paid") throw new AppError("This rent has already been paid", 400);
  if (!req.file) throw new AppError("A payment screenshot is required", 400);

  const { url, publicId } = await uploadBuffer(req.file.buffer, "smart-pg/payment-proofs");

  payment.status = "pending_approval";
  payment.paymentMethod = "upi";
  payment.upiScreenshotUrl = url;
  payment.upiScreenshotPublicId = publicId;
  payment.upiTransactionId = req.body.transactionId || "";
  payment.note = req.body.notes || "";
  await payment.save();

  const resident = await User.findById(req.user._id);
  await notify({
    user: payment.pg.owner,
    title: "UPI Payment Awaiting Approval",
    message: `${resident.name} submitted a UPI payment of ₹${payment.amount.toLocaleString()} for ${MONTHS[payment.month - 1]} ${payment.year}.`,
    type: "payment",
    link: "/owner/payments",
  });

  logger.info(`[UPI SUBMIT] ${payment._id} by ${resident.email}`);
  res.json(payment);
});

// --- Method 3: Cash (resident claims, owner approves) ----------------------

const submitCashPayment = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id).populate("pg");
  if (!payment) throw new AppError("Payment record not found", 404);
  if (payment.resident.toString() !== req.user._id.toString()) throw new AppError("Not authorized", 403);
  if (payment.status === "paid") throw new AppError("This rent has already been paid", 400);

  const { amount, date, notes } = req.body;

  payment.status = "pending_approval";
  payment.paymentMethod = "cash";
  payment.cashAmount = amount ? Number(amount) : payment.amount;
  payment.cashPaymentDate = date ? new Date(date) : new Date();
  payment.cashNote = notes || "";
  await payment.save();

  const resident = await User.findById(req.user._id);
  await notify({
    user: payment.pg.owner,
    title: "Cash Payment Awaiting Approval",
    message: `${resident.name} claims they paid ₹${payment.cashAmount.toLocaleString()} cash for ${MONTHS[payment.month - 1]} ${payment.year}.`,
    type: "payment",
    link: "/owner/payments",
  });

  logger.info(`[CASH SUBMIT] ${payment._id} by ${resident.email}`);
  res.json(payment);
});

// --- Owner: approve / reject a pending UPI or cash request -----------------

const getOwnerPaymentRequests = asyncHandler(async (req, res) => {
  const pgs = await PG.find({ owner: req.user._id });
  const pgIds = pgs.map((p) => p._id);
  const requests = await Payment.find({ pg: { $in: pgIds }, status: "pending_approval" })
    .populate("resident", "name email phone photoUrl")
    .populate("room", "roomNumber")
    .populate("pg", "name")
    .sort({ updatedAt: -1 });
  res.json(requests);
});

const approvePaymentRequest = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id).populate("pg").populate("resident", "name email");
  if (!payment) throw new AppError("Payment record not found", 404);
  if (payment.pg.owner.toString() !== req.user._id.toString()) throw new AppError("Not authorized", 403);
  if (payment.status !== "pending_approval") throw new AppError("This payment is not awaiting approval", 400);

  payment.status = "paid";
  payment.paidAt = new Date();
  payment.verifiedBy = "owner";
  payment.approvedBy = req.user._id;
  await payment.save();

  await notify({
    user: payment.resident._id,
    title: "Payment Approved",
    message: `Your ${payment.paymentMethod === "cash" ? "cash" : "UPI"} payment of ₹${payment.amount.toLocaleString()} was approved.`,
    type: "payment",
    link: "/resident/payments",
  });
  await logActivity({ owner: req.user._id, actor: req.user._id, action: "Payment Approved", entityType: "Payment", entityId: payment._id, details: `₹${payment.amount} via ${payment.paymentMethod}` });

  res.json(payment);
});

const rejectPaymentRequest = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const payment = await Payment.findById(req.params.id).populate("pg").populate("resident", "name email");
  if (!payment) throw new AppError("Payment record not found", 404);
  if (payment.pg.owner.toString() !== req.user._id.toString()) throw new AppError("Not authorized", 403);
  if (payment.status !== "pending_approval") throw new AppError("This payment is not awaiting approval", 400);

  payment.status = "rejected";
  payment.rejectionReason = reason || "";
  await payment.save();

  await notify({
    user: payment.resident._id,
    title: "Payment Rejected",
    message: `Your ${payment.paymentMethod === "cash" ? "cash" : "UPI"} payment claim was rejected.${reason ? ` Reason: ${reason}` : ""} Please retry.`,
    type: "payment",
    link: "/resident/payments",
  });
  await logActivity({ owner: req.user._id, actor: req.user._id, action: "Payment Rejected", entityType: "Payment", entityId: payment._id, details: reason || "" });

  res.json(payment);
});

// Owner directly marking something as paid outside the resident-initiated
// flow (e.g. cash handed over before this feature existed).
const recordOfflinePayment = asyncHandler(async (req, res) => {
  const { method, note } = req.body;
  const payment = await Payment.findById(req.params.id).populate("pg");
  if (!payment) throw new AppError("Payment record not found", 404);
  if (payment.pg.owner.toString() !== req.user._id.toString()) throw new AppError("Not authorized", 403);
  if (payment.status === "paid") throw new AppError("Already marked as paid", 400);

  payment.status = "paid";
  payment.paidAt = new Date();
  payment.paymentMethod = method && ["cash", "upi", "bank_transfer"].includes(method) ? method : "cash";
  payment.verifiedBy = "owner";
  payment.note = note || payment.note;
  payment.recordedBy = req.user._id;
  await payment.save();

  await logActivity({ owner: req.user._id, actor: req.user._id, action: "Payment Received", entityType: "Payment", entityId: payment._id, details: `₹${payment.amount} via ${payment.paymentMethod} (recorded by owner)` });

  logger.info(`[OFFLINE PAYMENT] Recorded by ${req.user.email} for ${payment._id}`);
  res.json(payment);
});

const getMyPayments = asyncHandler(async (req, res) => {
  const payments = await Payment.find({ resident: req.user._id })
    .populate("room", "roomNumber")
    .populate("pg", "name address")
    .sort({ year: -1, month: -1 });
  res.json(payments);
});

const getPGPayments = asyncHandler(async (req, res) => {
  const { month, year } = req.query;
  const filter = { pg: req.params.pgId };
  if (month) filter.month = Number(month);
  if (year) filter.year = Number(year);

  const payments = await Payment.find(filter)
    .populate("resident", "name email phone photoUrl")
    .populate("room", "roomNumber")
    .sort({ year: -1, month: -1 });
  res.json(payments);
});

const getOwnerPaymentSummary = asyncHandler(async (req, res) => {
  const now = new Date();
  const month = Number(req.query.month) || now.getMonth() + 1;
  const year = Number(req.query.year) || now.getFullYear();

  const pgs = await PG.find({ owner: req.user._id });
  const pgIds = pgs.map((p) => p._id);

  const payments = await Payment.find({ pg: { $in: pgIds }, month, year })
    .populate("resident", "name email photoUrl")
    .populate("room", "roomNumber")
    .populate("pg", "name");

  const totalPaid = payments.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0);
  const totalPending = payments.filter((p) => p.status === "pending" || p.status === "pending_approval").reduce((s, p) => s + p.amount, 0);

  res.json({ payments, totalPaid, totalPending, month, year });
});

// --- Owner: payment settings (spec: "Owner Payment Settings") --------------

const getPaymentSettings = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("upiId businessName paymentMethodsEnabled");
  let qrDataUrl = null;
  if (user.upiId) {
    const upiLink = `upi://pay?pa=${encodeURIComponent(user.upiId)}&pn=${encodeURIComponent(user.businessName || req.user.name)}&cu=INR`;
    qrDataUrl = await QRCode.toDataURL(upiLink);
  }
  res.json({ upiId: user.upiId, paymentMethodsEnabled: user.paymentMethodsEnabled, qrDataUrl });
});

const updatePaymentSettings = asyncHandler(async (req, res) => {
  const { upiId, razorpay, upi, cash } = req.body;
  const update = {};
  if (upiId !== undefined) update.upiId = upiId;
  if (razorpay !== undefined || upi !== undefined || cash !== undefined) {
    const current = await User.findById(req.user._id).select("paymentMethodsEnabled");
    update.paymentMethodsEnabled = {
      razorpay: razorpay !== undefined ? razorpay : current.paymentMethodsEnabled?.razorpay ?? true,
      upi: upi !== undefined ? upi : current.paymentMethodsEnabled?.upi ?? true,
      cash: cash !== undefined ? cash : current.paymentMethodsEnabled?.cash ?? true,
    };
  }
  const user = await User.findByIdAndUpdate(req.user._id, update, { new: true }).select("upiId businessName paymentMethodsEnabled");
  res.json(user);
});

const getInvoice = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id)
    .populate("pg", "name address city")
    .populate("room", "roomNumber")
    .populate("resident", "name email")
    .populate("approvedBy", "name");

  if (!payment) throw new AppError("Payment record not found", 404);

  const isResident = payment.resident._id.toString() === req.user._id.toString();
  const pg = await PG.findById(payment.pg._id);
  const isOwner = pg.owner.toString() === req.user._id.toString();
  if (!isResident && !isOwner) throw new AppError("Not authorized", 403);
  if (payment.status !== "paid") throw new AppError("Invoice is only available for paid rent", 400);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=receipt_${payment._id}.pdf`);

  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(res);

  doc.fontSize(20).fillColor("#ff7a09").text("Smart PG", { align: "left" });
  doc.fontSize(10).fillColor("#000").text("Rent Payment Receipt").moveDown(1.5);

  doc.fontSize(11);
  doc.text(`Receipt #: ${payment._id}`);
  doc.text(`Date Paid: ${payment.paidAt ? new Date(payment.paidAt).toLocaleDateString() : "-"}`);
  doc.text(`PG: ${payment.pg.name}`);
  doc.text(`Room: ${payment.room.roomNumber}`);
  doc.text(`Resident: ${payment.resident.name} (${payment.resident.email})`);
  doc.text(`Period: ${MONTHS[payment.month - 1]} ${payment.year}`);
  doc.text(`Payment Method: ${payment.paymentMethod || "-"}`);
  doc.text(`Verified: ${payment.verifiedBy === "automatic" ? "Automatically (Razorpay)" : payment.approvedBy ? `By owner (${payment.approvedBy.name})` : "By owner"}`);
  if (payment.upiTransactionId) doc.text(`UPI Transaction ID: ${payment.upiTransactionId}`);
  doc.moveDown(1);

  doc.fontSize(14).fillColor("#16a34a").text(`Amount Paid: Rs. ${payment.amount.toLocaleString()}`, { underline: true });
  doc.moveDown(2);
  doc.fontSize(9).fillColor("#888").text("This is a system-generated receipt and does not require a signature.");

  doc.end();
});

module.exports = {
  generateMonthlyRents,
  getPaymentOptions,
  createRazorpayOrder,
  verifyRazorpayPayment,
  razorpayWebhook,
  submitUpiPayment,
  submitCashPayment,
  getOwnerPaymentRequests,
  approvePaymentRequest,
  rejectPaymentRequest,
  recordOfflinePayment,
  getMyPayments,
  getPGPayments,
  getOwnerPaymentSummary,
  getPaymentSettings,
  updatePaymentSettings,
  getInvoice,
};
