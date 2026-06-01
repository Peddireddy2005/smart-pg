const Complaint = require("../models/Complaint");
const User = require("../models/User");

const createComplaint = async (req, res) => {
  console.log("[CREATE COMPLAINT] By:", req.user.email, "| Data:", req.body);
  const { title, description } = req.body;
  try {
    const user = await User.findById(req.user._id);
    console.log("[CREATE COMPLAINT] User assignedPG:", user.assignedPG, "| assignedRoom:", user.assignedRoom);

    if (!user.assignedPG) {
      console.warn("[CREATE COMPLAINT] User has no assigned PG:", req.user.email);
      return res.status(400).json({ message: "You are not assigned to any PG" });
    }

    const complaint = await Complaint.create({
      title, description,
      pg: user.assignedPG,
      room: user.assignedRoom,
      resident: req.user._id,
    });
    console.log("[CREATE COMPLAINT] Created:", complaint._id, "| Title:", title);
    res.status(201).json(complaint);
  } catch (err) {
    console.error("[CREATE COMPLAINT] ERROR:", err.message);
    res.status(500).json({ message: err.message });
  }
};

const getMyComplaints = async (req, res) => {
  console.log("[MY COMPLAINTS] Fetching for:", req.user.email);
  try {
    const complaints = await Complaint.find({ resident: req.user._id })
      .populate("pg", "name")
      .populate("room", "roomNumber")
      .sort({ createdAt: -1 });
    console.log(`[MY COMPLAINTS] Found ${complaints.length} complaints`);
    res.json(complaints);
  } catch (err) {
    console.error("[MY COMPLAINTS] ERROR:", err.message);
    res.status(500).json({ message: err.message });
  }
};

const getPGComplaints = async (req, res) => {
  console.log("[PG COMPLAINTS] PG ID:", req.params.pgId);
  try {
    const complaints = await Complaint.find({ pg: req.params.pgId })
      .populate("resident", "name email")
      .populate("room", "roomNumber")
      .sort({ createdAt: -1 });
    console.log(`[PG COMPLAINTS] Found ${complaints.length} complaints`);
    res.json(complaints);
  } catch (err) {
    console.error("[PG COMPLAINTS] ERROR:", err.message);
    res.status(500).json({ message: err.message });
  }
};

const getOwnerComplaints = async (req, res) => {
  console.log("[OWNER COMPLAINTS] Owner:", req.user.email);
  try {
    const PG = require("../models/PG");
    const pgs = await PG.find({ owner: req.user._id });
    const pgIds = pgs.map((p) => p._id);
    console.log("[OWNER COMPLAINTS] Fetching complaints across PG IDs:", pgIds);

    const complaints = await Complaint.find({ pg: { $in: pgIds } })
      .populate("resident", "name email")
      .populate("room", "roomNumber")
      .populate("pg", "name")
      .sort({ createdAt: -1 });
    console.log(`[OWNER COMPLAINTS] Found ${complaints.length} total complaints`);
    res.json(complaints);
  } catch (err) {
    console.error("[OWNER COMPLAINTS] ERROR:", err.message);
    res.status(500).json({ message: err.message });
  }
};

const updateComplaintStatus = async (req, res) => {
  console.log("[UPDATE COMPLAINT STATUS] ID:", req.params.id, "| New status:", req.body.status);
  const { status } = req.body;
  try {
    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id, { status }, { new: true }
    ).populate("resident", "name email").populate("room", "roomNumber").populate("pg", "name");

    if (!complaint) {
      console.warn("[UPDATE COMPLAINT STATUS] Not found:", req.params.id);
      return res.status(404).json({ message: "Complaint not found" });
    }
    console.log("[UPDATE COMPLAINT STATUS] Updated to:", status, "| Complaint:", complaint.title);
    res.json(complaint);
  } catch (err) {
    console.error("[UPDATE COMPLAINT STATUS] ERROR:", err.message);
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createComplaint, getMyComplaints, getPGComplaints, getOwnerComplaints, updateComplaintStatus };