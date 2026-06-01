const Payment = require("../models/Payment");
const Room = require("../models/Room");

const generateMonthlyRents = async (req, res) => {
  console.log("[GENERATE RENTS] PG ID:", req.params.pgId, "| Month/Year:", req.body);
  const { pgId } = req.params;
  const { month, year } = req.body;
  try {
    const rooms = await Room.find({ pg: pgId }).populate("residents");
    console.log(`[GENERATE RENTS] Found ${rooms.length} rooms`);

    const payments = [];
    for (const room of rooms) {
      console.log(`[GENERATE RENTS] Room ${room.roomNumber}: ${room.residents.length} residents`);
      for (const resident of room.residents) {
        const exists = await Payment.findOne({
          resident: resident._id, room: room._id, month, year,
        });
        if (exists) {
          console.log(`[GENERATE RENTS] Skipping — already exists for ${resident.email} Room ${room.roomNumber} ${month}/${year}`);
        } else {
          console.log(`[GENERATE RENTS] Creating payment for ${resident.email} — ₹${room.rent}`);
          payments.push({
            resident: resident._id, room: room._id, pg: pgId,
            amount: room.rent, month, year,
          });
        }
      }
    }

    await Payment.insertMany(payments);
    console.log(`[GENERATE RENTS] Created ${payments.length} new payment records`);
    res.json({ message: "Monthly rents generated", count: payments.length });
  } catch (err) {
    console.error("[GENERATE RENTS] ERROR:", err.message);
    res.status(500).json({ message: err.message });
  }
};

const payRent = async (req, res) => {
  console.log("[PAY RENT] Payment ID:", req.params.id, "| By resident:", req.user.email);
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      console.warn("[PAY RENT] Payment not found:", req.params.id);
      return res.status(404).json({ message: "Payment not found" });
    }
    if (payment.resident.toString() !== req.user._id.toString()) {
      console.warn("[PAY RENT] Unauthorized — payment belongs to another resident");
      return res.status(403).json({ message: "Not authorized" });
    }

    payment.status = "paid";
    payment.paidAt = new Date();
    await payment.save();
    console.log("[PAY RENT] Payment marked as paid:", payment._id, "| Amount:", payment.amount, "| PaidAt:", payment.paidAt);
    res.json(payment);
  } catch (err) {
    console.error("[PAY RENT] ERROR:", err.message);
    res.status(500).json({ message: err.message });
  }
};

const getMyPayments = async (req, res) => {
  console.log("[MY PAYMENTS] Fetching for resident:", req.user.email);
  try {
    const payments = await Payment.find({ resident: req.user._id })
      .populate("room", "roomNumber")
      .populate("pg", "name address")
      .sort({ year: -1, month: -1 });
    console.log(`[MY PAYMENTS] Found ${payments.length} records for:`, req.user.email);
    res.json(payments);
  } catch (err) {
    console.error("[MY PAYMENTS] ERROR:", err.message);
    res.status(500).json({ message: err.message });
  }
};

const getPGPayments = async (req, res) => {
  console.log("[PG PAYMENTS] PG ID:", req.params.pgId, "| Query:", req.query);
  try {
    const { month, year } = req.query;
    const filter = { pg: req.params.pgId };
    if (month) filter.month = Number(month);
    if (year) filter.year = Number(year);

    const payments = await Payment.find(filter)
      .populate("resident", "name email")
      .populate("room", "roomNumber")
      .sort({ year: -1, month: -1 });
    console.log(`[PG PAYMENTS] Found ${payments.length} records`);
    res.json(payments);
  } catch (err) {
    console.error("[PG PAYMENTS] ERROR:", err.message);
    res.status(500).json({ message: err.message });
  }
};

const getOwnerPaymentSummary = async (req, res) => {
  console.log("[OWNER PAYMENT SUMMARY] Owner:", req.user.email, "| Query:", req.query);
  try {
    const PG = require("../models/PG");
    const now = new Date();
    const month = Number(req.query.month) || now.getMonth() + 1;
    const year = Number(req.query.year) || now.getFullYear();
    console.log("[OWNER PAYMENT SUMMARY] Period:", month, "/", year);

    const pgs = await PG.find({ owner: req.user._id });
    const pgIds = pgs.map((p) => p._id);
    console.log("[OWNER PAYMENT SUMMARY] PG count:", pgs.length);

    const payments = await Payment.find({ pg: { $in: pgIds }, month, year })
      .populate("resident", "name email")
      .populate("room", "roomNumber")
      .populate("pg", "name");

    const totalPaid = payments.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0);
    const totalPending = payments.filter((p) => p.status === "pending").reduce((s, p) => s + p.amount, 0);
    console.log(`[OWNER PAYMENT SUMMARY] Total records: ${payments.length} | Paid: ₹${totalPaid} | Pending: ₹${totalPending}`);

    res.json({ payments, totalPaid, totalPending, month, year });
  } catch (err) {
    console.error("[OWNER PAYMENT SUMMARY] ERROR:", err.message);
    res.status(500).json({ message: err.message });
  }
};

module.exports = { generateMonthlyRents, payRent, getMyPayments, getPGPayments, getOwnerPaymentSummary };