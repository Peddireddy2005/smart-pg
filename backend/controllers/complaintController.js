const Complaint = require("../models/Complaint");
const User = require("../models/User");
const PG = require("../models/PG");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const logger = require("../config/logger");
const { notify } = require("../utils/notify");
const { sendEmail, templates } = require("../utils/sendEmail");

const createComplaint = asyncHandler(async (req, res) => {
  const { title, description, priority } = req.body;
  const user = await User.findById(req.user._id);
  if (!user.assignedPG) throw new AppError("You are not assigned to any PG", 400);

  const complaint = await Complaint.create({
    title, description, priority,
    pg: user.assignedPG, room: user.assignedRoom, resident: req.user._id,
  });

  const pg = await PG.findById(user.assignedPG);
  if (pg) {
    await notify({
      user: pg.owner,
      title: "New Complaint",
      message: `${user.name} raised a complaint: "${title}"`,
      type: "complaint",
      link: "/owner/complaints",
    });
  }

  logger.info(`[CREATE COMPLAINT] ${req.user.email} ${title}`);
  res.status(201).json(complaint);
});

const getMyComplaints = asyncHandler(async (req, res) => {
  const complaints = await Complaint.find({ resident: req.user._id })
    .populate("pg", "name").populate("room", "roomNumber").sort({ createdAt: -1 });
  res.json(complaints);
});

const getOwnerComplaints = asyncHandler(async (req, res) => {
  const pgs = await PG.find({ owner: req.user._id });
  const pgIds = pgs.map((p) => p._id);
  const complaints = await Complaint.find({ pg: { $in: pgIds } })
    .populate("resident", "name email photoUrl")
    .populate("room", "roomNumber")
    .populate("pg", "name")
    .sort({ createdAt: -1 });
  res.json(complaints);
});

const getPGComplaints = asyncHandler(async (req, res) => {
  const complaints = await Complaint.find({ pg: req.params.pgId })
    .populate("resident", "name email photoUrl")
    .populate("room", "roomNumber")
    .sort({ createdAt: -1 });
  res.json(complaints);
});

const updateComplaintStatus = asyncHandler(async (req, res) => {
  const { status, ownerNote } = req.body;
  const update = { status };
  if (ownerNote !== undefined) update.ownerNote = ownerNote;

  const complaint = await Complaint.findByIdAndUpdate(req.params.id, update, { new: true })
    .populate("resident", "name email photoUrl")
    .populate("room", "roomNumber")
    .populate("pg", "name");
  if (!complaint) throw new AppError("Complaint not found", 404);

  await notify({
    user: complaint.resident._id,
    title: "Complaint Updated",
    message: `Your complaint "${complaint.title}" is now ${status}.`,
    type: "complaint",
    link: "/resident/complaints",
  });
  sendEmail({
    to: complaint.resident.email,
    subject: "Complaint Status Updated",
    html: templates.complaintUpdate(complaint.resident.name, complaint.title, status),
  });

  logger.info(`[UPDATE COMPLAINT] ${req.params.id} -> ${status}`);
  res.json(complaint);
});

module.exports = { createComplaint, getMyComplaints, getOwnerComplaints, getPGComplaints, updateComplaintStatus };
