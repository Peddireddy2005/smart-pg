const Staff = require("../models/Staff");
const PG = require("../models/PG");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const { logActivity } = require("../utils/activityLog");

const assertPGOwnership = async (pgId, userId) => {
  const pg = await PG.findById(pgId);
  if (!pg) throw new AppError("PG not found", 404);
  if (pg.owner.toString() !== userId.toString()) throw new AppError("Not authorized", 403);
  return pg;
};

const createStaff = asyncHandler(async (req, res) => {
  const { pgId } = req.params;
  await assertPGOwnership(pgId, req.user._id);
  const staff = await Staff.create({ ...req.body, pg: pgId, owner: req.user._id });
  await logActivity({ owner: req.user._id, actor: req.user._id, action: "Staff Added", entityType: "Staff", entityId: staff._id, details: `${staff.name} (${staff.role})` });
  res.status(201).json(staff);
});

const getPGStaff = asyncHandler(async (req, res) => {
  const staff = await Staff.find({ pg: req.params.pgId }).sort({ createdAt: -1 });
  res.json(staff);
});

const getOwnerStaff = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Number(req.query.limit) || 40);

  const pgs = await PG.find({ owner: req.user._id });
  const pgIds = pgs.map((p) => p._id);
  const filter = { pg: { $in: pgIds } };

  const [staff, total] = await Promise.all([
    Staff.find(filter).populate("pg", "name").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Staff.countDocuments(filter),
  ]);

  res.json({ staff, page, totalPages: Math.max(1, Math.ceil(total / limit)), total });
});

const updateStaff = asyncHandler(async (req, res) => {
  const staff = await Staff.findById(req.params.id);
  if (!staff) throw new AppError("Staff member not found", 404);
  if (staff.owner.toString() !== req.user._id.toString()) throw new AppError("Not authorized", 403);

  const { name, role, phone, salary, isActive } = req.body;
  Object.assign(staff, {
    ...(name !== undefined && { name }),
    ...(role !== undefined && { role }),
    ...(phone !== undefined && { phone }),
    ...(salary !== undefined && { salary }),
    ...(isActive !== undefined && { isActive }),
  });
  await staff.save();
  res.json(staff);
});

const deleteStaff = asyncHandler(async (req, res) => {
  const staff = await Staff.findById(req.params.id);
  if (!staff) throw new AppError("Staff member not found", 404);
  if (staff.owner.toString() !== req.user._id.toString()) throw new AppError("Not authorized", 403);
  await staff.deleteOne();
  await logActivity({ owner: req.user._id, actor: req.user._id, action: "Staff Removed", entityType: "Staff", entityId: staff._id, details: staff.name });
  res.json({ message: "Staff member removed" });
});

const markAttendance = asyncHandler(async (req, res) => {
  const { present = true, date } = req.body;
  const staff = await Staff.findById(req.params.id);
  if (!staff) throw new AppError("Staff member not found", 404);
  if (staff.owner.toString() !== req.user._id.toString()) throw new AppError("Not authorized", 403);

  const day = date ? new Date(date) : new Date();
  day.setHours(0, 0, 0, 0);

  const existing = staff.attendance.find((a) => new Date(a.date).toDateString() === day.toDateString());
  if (existing) {
    existing.present = present;
  } else {
    staff.attendance.push({ date: day, present });
  }
  await staff.save();
  res.json(staff);
});

module.exports = { createStaff, getPGStaff, getOwnerStaff, updateStaff, deleteStaff, markAttendance };