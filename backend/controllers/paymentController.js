const Payment = require("../models/Payment");
const Room = require("../models/Room");
const PG = require("../models/PG");

const generateMonthlyRents = async (req, res) => {
  const { pgId } = req.params;
  const { month, year } = req.body;
  console.log("[GENERATE RENTS] PG:", pgId, "Period:", month, "/", year);
  try {
    const rooms = await Room.find({ pg: pgId }).populate("residents");
    const payments = [];
    for (const room of rooms) {
      for (const resident of room.residents) {
        const exists = await Payment.findOne({ resident: resident._id, room: room._id, month, year });
        if (!exists) {
          payments.push({ resident: resident._id, room: room._id, pg: pgId, amount: room.rent, month, year });
          console.log("[GENERATE RENTS] New record:", resident.email, "₹" + room.rent);
        }
      }
    }
    if (payments.length > 0) await Payment.insertMany(payments);
    console.log("[GENERATE RENTS] Created:", payments.length, "records");
    res.json({ message: "Monthly rents generated", count: payments.length });
  } catch (err) {
    console.error("[GENERATE RENTS] Error:", err.message);
    res.status(500).json({ message: err.message });
  }
};

const payRent = async (req, res) => {
  console.log("[PAY RENT] Payment:", req.params.id, "By:", req.user.email);
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ message: "Payment not found" });
    if (payment.resident.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not authorized" });
    if (payment.status === "paid") return res.status(400).json({ message: "Already paid" });

    payment.status = "paid";
    payment.paidAt = new Date();
    await payment.save();
    console.log("[PAY RENT] Marked paid:", payment._id, "₹" + payment.amount);
    res.json(payment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getMyPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ resident: req.user._id })
      .populate("room", "roomNumber")
      .populate("pg", "name address")
      .sort({ year: -1, month: -1 });
    console.log("[MY PAYMENTS]", req.user.email, "Count:", payments.length);
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getPGPayments = async (req, res) => {
  try {
    const { month, year } = req.query;
    const filter = { pg: req.params.pgId };
    if (month) filter.month = Number(month);
    if (year) filter.year = Number(year);

    const payments = await Payment.find(filter)
      .populate("resident", "name email phone photoUrl")
      .populate("room", "roomNumber")
      .sort({ year: -1, month: -1 });
    console.log("[PG PAYMENTS] Count:", payments.length);
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getOwnerPaymentSummary = async (req, res) => {
  try {
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

    console.log("[OWNER PAYMENT SUMMARY] Paid: ₹" + totalPaid, "Pending: ₹" + totalPending);
    res.json({ payments, totalPaid, totalPending, month, year });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { generateMonthlyRents, payRent, getMyPayments, getPGPayments, getOwnerPaymentSummary };