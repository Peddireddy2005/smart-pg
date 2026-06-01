const PG = require("../models/PG");
const Room = require("../models/Room");

const createPG = async (req, res) => {
  console.log("[CREATE PG] Request by owner:", req.user.email, "| Data:", req.body);
  const { name, address, city, locality, description, amenities, rentRange } = req.body;
  try {
    const pg = await PG.create({
      name, address, city, locality, description, amenities,
      rentRange: rentRange || { min: 0, max: 0 },
      owner: req.user._id,
    });
    console.log("[CREATE PG] PG created:", pg._id, pg.name);
    res.status(201).json(pg);
  } catch (err) {
    console.error("[CREATE PG] ERROR:", err.message);
    res.status(500).json({ message: err.message });
  }
};

const getAllPGs = async (req, res) => {
  console.log("[GET ALL PGs] Query params:", req.query);
  try {
    const { city, locality } = req.query;
    const filter = {};
    if (city) filter.city = new RegExp(city, "i");
    if (locality) filter.locality = new RegExp(locality, "i");

    const pgs = await PG.find(filter).populate("owner", "name email");
    console.log(`[GET ALL PGs] Found ${pgs.length} PGs`);

    const pgData = await Promise.all(
      pgs.map(async (pg) => {
        const rooms = await Room.find({ pg: pg._id });
        const availableRooms = rooms.filter((r) => r.occupancy < r.capacity).length;
        console.log(`[GET ALL PGs] PG: ${pg.name} | Rooms: ${rooms.length} | Available: ${availableRooms}`);
        return { ...pg.toObject(), totalRooms: rooms.length, availableRooms };
      })
    );
    res.json(pgData);
  } catch (err) {
    console.error("[GET ALL PGs] ERROR:", err.message);
    res.status(500).json({ message: err.message });
  }
};

const getOwnerPGs = async (req, res) => {
  console.log("[GET OWNER PGs] Owner:", req.user.email, req.user._id);
  try {
    const pgs = await PG.find({ owner: req.user._id });
    console.log(`[GET OWNER PGs] Found ${pgs.length} PGs for owner`);

    const pgData = await Promise.all(
      pgs.map(async (pg) => {
        const rooms = await Room.find({ pg: pg._id });
        const totalResidents = rooms.reduce((sum, r) => sum + r.occupancy, 0);
        const availableRooms = rooms.filter((r) => r.occupancy < r.capacity).length;
        console.log(`[GET OWNER PGs] ${pg.name}: ${rooms.length} rooms, ${totalResidents} residents`);
        return { ...pg.toObject(), totalRooms: rooms.length, totalResidents, availableRooms };
      })
    );
    res.json(pgData);
  } catch (err) {
    console.error("[GET OWNER PGs] ERROR:", err.message);
    res.status(500).json({ message: err.message });
  }
};

const getPGById = async (req, res) => {
  console.log("[GET PG BY ID] PG ID:", req.params.id);
  try {
    const pg = await PG.findById(req.params.id).populate("owner", "name email");
    if (!pg) {
      console.warn("[GET PG BY ID] PG not found:", req.params.id);
      return res.status(404).json({ message: "PG not found" });
    }
    console.log("[GET PG BY ID] Found:", pg.name);
    res.json(pg);
  } catch (err) {
    console.error("[GET PG BY ID] ERROR:", err.message);
    res.status(500).json({ message: err.message });
  }
};

const updatePG = async (req, res) => {
  console.log("[UPDATE PG] PG ID:", req.params.id, "| Data:", req.body);
  try {
    const pg = await PG.findById(req.params.id);
    if (!pg) {
      console.warn("[UPDATE PG] PG not found:", req.params.id);
      return res.status(404).json({ message: "PG not found" });
    }
    if (pg.owner.toString() !== req.user._id.toString()) {
      console.warn("[UPDATE PG] Unauthorized attempt by:", req.user.email);
      return res.status(403).json({ message: "Not authorized" });
    }
    const updated = await PG.findByIdAndUpdate(req.params.id, req.body, { new: true });
    console.log("[UPDATE PG] Updated successfully:", updated.name);
    res.json(updated);
  } catch (err) {
    console.error("[UPDATE PG] ERROR:", err.message);
    res.status(500).json({ message: err.message });
  }
};

const deletePG = async (req, res) => {
  console.log("[DELETE PG] PG ID:", req.params.id, "| By:", req.user.email);
  try {
    const pg = await PG.findById(req.params.id);
    if (!pg) {
      console.warn("[DELETE PG] PG not found:", req.params.id);
      return res.status(404).json({ message: "PG not found" });
    }
    if (pg.owner.toString() !== req.user._id.toString()) {
      console.warn("[DELETE PG] Unauthorized delete attempt by:", req.user.email);
      return res.status(403).json({ message: "Not authorized" });
    }
    await pg.deleteOne();
    console.log("[DELETE PG] Deleted:", pg.name);
    res.json({ message: "PG deleted" });
  } catch (err) {
    console.error("[DELETE PG] ERROR:", err.message);
    res.status(500).json({ message: err.message });
  }
};

const getOwnerStats = async (req, res) => {
  console.log("[OWNER STATS] Fetching stats for owner:", req.user.email);
  try {
    const pgs = await PG.find({ owner: req.user._id });
    const pgIds = pgs.map((p) => p._id);
    console.log("[OWNER STATS] PG IDs:", pgIds);

    const rooms = await Room.find({ pg: { $in: pgIds } });
    const totalResidents = rooms.reduce((sum, r) => sum + r.occupancy, 0);

    const Payment = require("../models/Payment");
    const Complaint = require("../models/Complaint");

    const now = new Date();
    const pendingPayments = await Payment.countDocuments({
      pg: { $in: pgIds }, status: "pending",
      month: now.getMonth() + 1, year: now.getFullYear(),
    });
    const openComplaints = await Complaint.countDocuments({
      pg: { $in: pgIds }, status: { $in: ["pending", "in-progress"] },
    });

    const stats = {
      totalPGs: pgs.length,
      totalRooms: rooms.length,
      totalResidents,
      pendingPayments,
      openComplaints,
    };
    console.log("[OWNER STATS] Result:", stats);
    res.json(stats);
  } catch (err) {
    console.error("[OWNER STATS] ERROR:", err.message);
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createPG, getAllPGs, getOwnerPGs, getPGById, updatePG, deletePG, getOwnerStats };