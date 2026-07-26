const Complaint = require("../models/Complaint");
const User = require("../models/User");
const PG = require("../models/PG");
const Staff = require("../models/Staff");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const logger = require("../config/logger");
const { notify } = require("../utils/notify");
const { uploadBuffer } = require("../config/cloudinary");
const { logActivity } = require("../utils/activityLog");

const createComplaint = asyncHandler(async (req, res) => {
  const { title, description, priority, category } = req.body;
  const user = await User.findById(req.user._id);
  if (!user.assignedPG) throw new AppError("You are not assigned to any PG", 400);

  let images = [];
  if (req.files?.length) {
    const uploaded = await Promise.all(req.files.map((f) => uploadBuffer(f.buffer, "smart-pg/complaints")));
    images = uploaded.map((u) => ({ url: u.url, publicId: u.publicId }));
  }

  const complaint = await Complaint.create({
    title, description, priority, category, images,
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
    .populate("pg", "name").populate("room", "roomNumber")
    .populate("assignedStaff", "name role phone")
    .sort({ createdAt: -1 });
  res.json(complaints);
});

const getOwnerComplaints = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Number(req.query.limit) || 40);

  const pgs = await PG.find({ owner: req.user._id });
  const pgIds = pgs.map((p) => p._id);
  const filter = { pg: { $in: pgIds } };
  if (req.query.status && req.query.status !== "all") filter.status = req.query.status;

  const [complaints, total] = await Promise.all([
    Complaint.find(filter)
      .populate("resident", "name email photoUrl")
      .populate("room", "roomNumber")
      .populate("pg", "name")
      .populate("assignedStaff", "name role phone")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Complaint.countDocuments(filter),
  ]);

  res.json({ complaints, page, totalPages: Math.max(1, Math.ceil(total / limit)), total });
});

const getPGComplaints = asyncHandler(async (req, res) => {
  const complaints = await Complaint.find({ pg: req.params.pgId })
    .populate("resident", "name email photoUrl")
    .populate("room", "roomNumber")
    .populate("assignedStaff", "name role phone")
    .sort({ createdAt: -1 });
  res.json(complaints);
});

const updateComplaintStatus = asyncHandler(async (req, res) => {
  const { status, ownerNote, assignedStaff } = req.body;
  const update = {};
  if (status !== undefined) update.status = status;
  if (ownerNote !== undefined) update.ownerNote = ownerNote;
  if (assignedStaff !== undefined) update.assignedStaff = assignedStaff || null;

  const complaint = await Complaint.findByIdAndUpdate(req.params.id, update, { new: true })
    .populate("resident", "name email photoUrl")
    .populate("room", "roomNumber")
    .populate("pg", "name")
    .populate("assignedStaff", "name role phone");
  if (!complaint) throw new AppError("Complaint not found", 404);

  if (status !== undefined) {
    await notify({
      user: complaint.resident._id,
      title: "Complaint Updated",
      message: `Your complaint "${complaint.title}" is now ${status}.`,
      type: "complaint",
      link: "/resident/complaints",
    });
  }

  const pg = await PG.findById(complaint.pg._id);
  await logActivity({ owner: pg.owner, actor: req.user._id, action: "Complaint Updated", entityType: "Complaint", entityId: complaint._id, details: `${complaint.title} -> ${status || complaint.status}` });

  logger.info(`[UPDATE COMPLAINT] ${req.params.id} -> ${status}`);
  res.json(complaint);
});

const assignComplaintStaff = asyncHandler(async (req, res) => {
  const { staffId } = req.body;
  const complaint = await Complaint.findById(req.params.id).populate("pg").populate("resident", "name email");
  if (!complaint) throw new AppError("Complaint not found", 404);
  if (complaint.pg.owner.toString() !== req.user._id.toString()) throw new AppError("Not authorized", 403);

  if (staffId) {
    const staff = await Staff.findById(staffId);
    if (!staff) throw new AppError("Staff member not found", 404);
    complaint.assignedStaff = staffId;
    complaint.status = "in-progress";
  } else {
    complaint.assignedStaff = null;
  }
  await complaint.save();

  await logActivity({ owner: req.user._id, actor: req.user._id, action: "Complaint Assigned", entityType: "Complaint", entityId: complaint._id, details: complaint.title });

  const populated = await Complaint.findById(complaint._id)
    .populate("resident", "name email photoUrl")
    .populate("room", "roomNumber")
    .populate("pg", "name")
    .populate("assignedStaff", "name role phone");
  res.json(populated);
});

module.exports = {
  createComplaint, getMyComplaints, getOwnerComplaints, getPGComplaints,
  updateComplaintStatus, assignComplaintStaff,
};