const User = require("../models/User");
const PG = require("../models/PG");
const Room = require("../models/Room");
const Payment = require("../models/Payment");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");

// Platform-level admin panel (spec §27, explicitly marked "Future"). Kept
// intentionally minimal: read-only visibility + basic account controls.
const getPlatformStats = asyncHandler(async (req, res) => {
  const [totalOwners, totalResidents, totalPGs, totalRooms] = await Promise.all([
    User.countDocuments({ role: "owner" }),
    User.countDocuments({ role: "resident" }),
    PG.countDocuments(),
    Room.countDocuments(),
  ]);
  const payments = await Payment.find({ status: "paid" });
  const totalRevenue = payments.reduce((s, p) => s + p.amount, 0);

  res.json({ totalOwners, totalResidents, totalPGs, totalRooms, totalRevenue });
});

const getAllOwners = asyncHandler(async (req, res) => {
  const owners = await User.find({ role: "owner" }).select("-password").sort({ createdAt: -1 });
  res.json(owners);
});

const getAllPGsAdmin = asyncHandler(async (req, res) => {
  const pgs = await PG.find().populate("owner", "name email").sort({ createdAt: -1 });
  res.json(pgs);
});

const setAccountActive = asyncHandler(async (req, res) => {
  const { isActive } = req.body;
  const user = await User.findByIdAndUpdate(req.params.id, { isActive }, { new: true }).select("-password");
  if (!user) throw new AppError("User not found", 404);
  res.json(user);
});

module.exports = { getPlatformStats, getAllOwners, getAllPGsAdmin, setAccountActive };
