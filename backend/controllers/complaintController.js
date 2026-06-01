const Complaint = require("../models/Complaint");
const User = require("../models/User");
const PG = require("../models/PG");

const createComplaint = async (req, res) => {
  const { title, description } = req.body;
  console.log("[CREATE COMPLAINT]", req.user.email, title);
  try {
    const user = await User.findById(req.user._id);
    if (!user.assignedPG) return res.status(400).json({ message: "You are not assigned to any PG" });

    const complaint = await Complaint.create({
      title, description, pg: user.assignedPG, room: user.assignedRoom, resident: req.user._id,
    });
    console.log("[CREATE COMPLAINT] Created:", complaint._id);
    res.status(201).json(complaint);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getMyComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find({ resident: req.user._id })
      .populate("pg", "name").populate("room", "roomNumber").sort({ createdAt: -1 });
    res.json(complaints);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getOwnerComplaints = async (req, res) => {
  try {
    const pgs = await PG.find({ owner: req.user._id });
    const pgIds = pgs.map((p) => p._id);
    const complaints = await Complaint.find({ pg: { $in: pgIds } })
      .populate("resident", "name email photoUrl")
      .populate("room", "roomNumber")
      .populate("pg", "name")
      .sort({ createdAt: -1 });
    console.log("[OWNER COMPLAINTS] Count:", complaints.length);
    res.json(complaints);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getPGComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find({ pg: req.params.pgId })
      .populate("resident", "name email photoUrl")
      .populate("room", "roomNumber")
      .sort({ createdAt: -1 });
    res.json(complaints);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateComplaintStatus = async (req, res) => {
  const { status, ownerNote } = req.body;
  console.log("[UPDATE COMPLAINT]", req.params.id, "→", status);
  try {
    const update = { status };
    if (ownerNote !== undefined) update.ownerNote = ownerNote;
    const complaint = await Complaint.findByIdAndUpdate(req.params.id, update, { new: true })
      .populate("resident", "name email photoUrl")
      .populate("room", "roomNumber")
      .populate("pg", "name");
    if (!complaint) return res.status(404).json({ message: "Complaint not found" });
    res.json(complaint);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


module.exports = { createComplaint, getMyComplaints, getOwnerComplaints, getPGComplaints, updateComplaintStatus };