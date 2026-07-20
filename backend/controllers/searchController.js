const PG = require("../models/PG");
const User = require("../models/User");
const Room = require("../models/Room");
const Complaint = require("../models/Complaint");
const Payment = require("../models/Payment");
const asyncHandler = require("../utils/asyncHandler");

// Global search across a PG owner's data: residents, PGs, rooms, complaints, payments.
// See spec §25 — global search bar.
const ownerSearch = asyncHandler(async (req, res) => {
  const q = (req.query.q || "").trim();
  if (!q) return res.json({ pgs: [], residents: [], rooms: [], complaints: [], payments: [] });

  const rx = new RegExp(q, "i");
  const pgs = await PG.find({ owner: req.user._id, $or: [{ name: rx }, { city: rx }, { locality: rx }] }).limit(8);
  const pgIds = (await PG.find({ owner: req.user._id })).map((p) => p._id);

  const [residents, rooms, complaints, payments] = await Promise.all([
    User.find({ role: "resident", assignedPG: { $in: pgIds }, $or: [{ name: rx }, { email: rx }, { phone: rx }] })
      .select("name email phone assignedPG assignedRoom photoUrl")
      .limit(8),
    Room.find({ pg: { $in: pgIds }, roomNumber: rx }).populate("pg", "name").limit(8),
    Complaint.find({ pg: { $in: pgIds }, title: rx }).populate("resident", "name").limit(8),
    Payment.find({ pg: { $in: pgIds } })
      .populate({ path: "resident", match: { $or: [{ name: rx }, { email: rx }] }, select: "name email" })
      .populate("room", "roomNumber")
      .limit(20)
      .then((results) => results.filter((p) => p.resident).slice(0, 8)),
  ]);

  res.json({ pgs, residents, rooms, complaints, payments });
});

module.exports = { ownerSearch };
