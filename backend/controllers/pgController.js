const PG = require("../models/PG");
const Room = require("../models/Room");
const Payment = require("../models/Payment");
const Complaint = require("../models/Complaint");

const createPG = async (req, res) => {
  console.log("[CREATE PG]", req.user.email, req.body.name);
  try {
    const pg = await PG.create({ ...req.body, owner: req.user._id });
    console.log("[CREATE PG] Created:", pg._id, pg.name);
    res.status(201).json(pg);
  } catch (err) {
    console.error("[CREATE PG] Error:", err.message);
    res.status(500).json({ message: err.message });
  }
};

const getAllPGs = async (req, res) => {
  try {
    const { city, locality, search } = req.query;
    const filter = {};
    if (city) filter.city = new RegExp(city, "i");
    if (locality) filter.locality = new RegExp(locality, "i");
    if (search) filter.$or = [
      { name: new RegExp(search, "i") },
      { city: new RegExp(search, "i") },
      { locality: new RegExp(search, "i") },
    ];

    const pgs = await PG.find(filter).populate("owner", "name email phone");
    const pgData = await Promise.all(pgs.map(async (pg) => {
      const rooms = await Room.find({ pg: pg._id });
      const availableRooms = rooms.filter((r) => r.occupancy < r.capacity).length;
      return { ...pg.toObject(), totalRooms: rooms.length, availableRooms };
    }));

    console.log("[GET ALL PGs] Returning:", pgData.length);
    res.json(pgData);
  } catch (err) {
    console.error("[GET ALL PGs] Error:", err.message);
    res.status(500).json({ message: err.message });
  }
};

const getOwnerPGs = async (req, res) => {
  try {
    const pgs = await PG.find({ owner: req.user._id });
    const pgData = await Promise.all(pgs.map(async (pg) => {
      const rooms = await Room.find({ pg: pg._id });
      const totalResidents = rooms.reduce((sum, r) => sum + r.occupancy, 0);
      const availableRooms = rooms.filter((r) => r.occupancy < r.capacity).length;
      return { ...pg.toObject(), totalRooms: rooms.length, totalResidents, availableRooms };
    }));
    console.log("[OWNER PGs]", req.user.email, "has", pgData.length, "PGs");
    res.json(pgData);
  } catch (err) {
    console.error("[OWNER PGs] Error:", err.message);
    res.status(500).json({ message: err.message });
  }
};

const getPGById = async (req, res) => {
  try {
    const pg = await PG.findById(req.params.id).populate("owner", "name email phone");
    if (!pg) return res.status(404).json({ message: "PG not found" });
    res.json(pg);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updatePG = async (req, res) => {
  try {
    const pg = await PG.findById(req.params.id);
    if (!pg) return res.status(404).json({ message: "PG not found" });
    if (pg.owner.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not authorized" });
    const updated = await PG.findByIdAndUpdate(req.params.id, req.body, { new: true });
    console.log("[UPDATE PG]", pg.name);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deletePG = async (req, res) => {
  try {
    const pg = await PG.findById(req.params.id);
    if (!pg) return res.status(404).json({ message: "PG not found" });
    if (pg.owner.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not authorized" });
    await pg.deleteOne();
    console.log("[DELETE PG]", pg.name);
    res.json({ message: "PG deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getOwnerStats = async (req, res) => {
  try {
    const pgs = await PG.find({ owner: req.user._id });
    const pgIds = pgs.map((p) => p._id);
    const rooms = await Room.find({ pg: { $in: pgIds } });
    const totalResidents = rooms.reduce((sum, r) => sum + r.occupancy, 0);
    const now = new Date();
    const pendingPayments = await Payment.countDocuments({
      pg: { $in: pgIds }, status: "pending",
      month: now.getMonth() + 1, year: now.getFullYear(),
    });
    const openComplaints = await Complaint.countDocuments({
      pg: { $in: pgIds }, status: { $in: ["pending", "in-progress"] },
    });
    const stats = { totalPGs: pgs.length, totalRooms: rooms.length, totalResidents, pendingPayments, openComplaints };
    console.log("[OWNER STATS]", req.user.email, stats);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createPG, getAllPGs, getOwnerPGs, getPGById, updatePG, deletePG, getOwnerStats };