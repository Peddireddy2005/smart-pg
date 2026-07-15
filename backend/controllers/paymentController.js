const crypto = require("crypto");
const PDFDocument = require("pdfkit");
const Payment = require("../models/Payment");
const Room = require("../models/Room");
const PG = require("../models/PG");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const logger = require("../config/logger");
const { getRazorpay } = require("../config/razorpay");
const { sendEmail, templates } = require("../utils/sendEmail");
const { notify } = require("../utils/notify");

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const generateMonthlyRents = asyncHandler(async (req, res) => {
  const { pgId } = req.params;
  const { month, year } = req.body;
  logger.info(`[GENERATE RENTS] PG: ${pgId} Period: ${month}/${year}`);

  const pg = await PG.findById(pgId);
  if (!pg) throw new AppError("PG not found", 404);
  if (pg.owner.toString() !== req.user._id.toString()) throw new AppError("Not authorized", 403);

  const rooms = await Room.find({ pg: pgId }).populate("residents");
  const payments = [];
  const dueDate = new Date(year, month - 1, 5); // due on the 5th of the rent month

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

  logger.info(`[GENERATE RENTS] Created: ${payments.length} records`);
  res.json({ message: "Monthly rents generated", count: payments.length });
});

// --- Razorpay online payment flow -----------------------------------------

const createRazorpayOrder = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id);
  if (!payment) throw new AppError("Payment record not found", 404);
  if (payment.resident.toString() !== req.user._id.toString()) throw new AppError("Not authorized", 403);
  if (payment.status === "paid") throw new AppError("This rent has already been paid", 400);

  const razorpay = getRazorpay();
  const order = await razorpay.orders.create({
    amount: Math.round(payment.amount * 100), // paise
    currency: "INR",
    receipt: `rent_${payment._id}`,
    notes: { paymentId: payment._id.toString(), month: payment.month, year: payment.year },
  });

  payment.razorpayOrderId = order.id;
  await payment.save();

  res.json({
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: process.env.RAZORPAY_KEY_ID,
    paymentId: payment._id,
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
  await payment.save();

  const resident = await User.findById(req.user._id);
  sendEmail({
    to: resident.email,
    subject: "Rent Payment Successful",
    html: templates.paymentSuccess(resident.name, payment.amount, MONTHS[payment.month - 1], payment.year),
  });
  notify({
    user: payment.pg.owner,
    title: "Rent Received",
    message: `${resident.name} paid ₹${payment.amount.toLocaleString()} for ${MONTHS[payment.month - 1]} ${payment.year}.`,
    type: "payment",
    link: "/owner/payments",
  });

  logger.info(`[PAYMENT VERIFY] Confirmed paid: ${payment._id}`);
  res.json(payment);
});

// Razorpay server-to-server webhook — the source of truth in case the
// browser closes before the verify call completes. Mounted with a raw body
// parser in server.js so the signature can be checked against the exact bytes.
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
      await payment.save();
      logger.info(`[WEBHOOK] Marked paid via webhook: ${payment._id}`);
    }
  }

  res.status(200).json({ received: true });
});

// --- Manual/offline recording (owner only, e.g. cash or UPI handed in person) ---

const recordOfflinePayment = asyncHandler(async (req, res) => {
  const { method, note } = req.body;
  const payment = await Payment.findById(req.params.id).populate("pg");
  if (!payment) throw new AppError("Payment record not found", 404);
  if (payment.pg.owner.toString() !== req.user._id.toString()) throw new AppError("Not authorized", 403);
  if (payment.status === "paid") throw new AppError("Already marked as paid", 400);

  payment.status = "paid";
  payment.paidAt = new Date();
  payment.paymentMethod = method && ["cash", "upi", "bank_transfer"].includes(method) ? method : "cash";
  payment.note = note || payment.note;
  payment.recordedBy = req.user._id;
  await payment.save();

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
  const totalPending = payments.filter((p) => p.status === "pending").reduce((s, p) => s + p.amount, 0);

  res.json({ payments, totalPaid, totalPending, month, year });
});

// Streams a simple PDF receipt for a paid record.
const getInvoice = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id)
    .populate("pg", "name address city")
    .populate("room", "roomNumber")
    .populate("resident", "name email");

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
  doc.text(`Payment Method: ${payment.paymentMethod || "-"}`).moveDown(1);

  doc.fontSize(14).fillColor("#16a34a").text(`Amount Paid: Rs. ${payment.amount.toLocaleString()}`, { underline: true });
  doc.moveDown(2);
  doc.fontSize(9).fillColor("#888").text("This is a system-generated receipt and does not require a signature.");

  doc.end();
});

module.exports = {
  generateMonthlyRents,
  createRazorpayOrder,
  verifyRazorpayPayment,
  razorpayWebhook,
  recordOfflinePayment,
  getMyPayments,
  getPGPayments,
  getOwnerPaymentSummary,
  getInvoice,
};
