const PG = require("../models/PG");
const Room = require("../models/Room");
const Payment = require("../models/Payment");
const Complaint = require("../models/Complaint");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const logger = require("../config/logger");
const { uploadBuffer, deleteImage } = require("../config/cloudinary");

const createPG = asyncHandler(async (req, res) => {
  logger.info(`[CREATE PG] ${req.user.email} ${req.body.name}`);
  const pg = await PG.create({ ...req.body, owner: req.user._id });
  logger.info(`[CREATE PG] Created: ${pg._id} ${pg.name}`);
  res.status(201).json(pg);
});

const getAllPGs = asyncHandler(async (req, res) => {
  const { city, locality, search, minRent, maxRent } = req.query;
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Number(req.query.limit) || 12);

  const filter = { isActive: true };
  if (city) filter.city = new RegExp(city, "i");
  if (locality) filter.locality = new RegExp(locality, "i");
  if (search) {
    filter.$or = [
      { name: new RegExp(search, "i") },
      { city: new RegExp(search, "i") },
      { locality: new RegExp(search, "i") },
    ];
  }
  if (minRent || maxRent) {
    filter["rentRange.min"] = {};
    if (minRent) filter["rentRange.min"].$gte = Number(minRent);
    if (maxRent) filter["rentRange.min"].$lte = Number(maxRent);
  }

  const [pgs, total] = await Promise.all([
    PG.find(filter)
      .populate("owner", "name email phone")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    PG.countDocuments(filter),
  ]);

  const pgData = await Promise.all(
    pgs.map(async (pg) => {
      const rooms = await Room.find({ pg: pg._id });
      const vacantBeds = rooms.reduce((sum, room) => sum + (room.capacity - room.occupancy), 0);
      return { ...pg.toObject(), totalRooms: rooms.length, vacantBeds };
    })
  );

  res.json({
    pgs: pgData,
    page,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    total,
  });
});

const getCities = asyncHandler(async (req, res) => {
  const cities = await PG.distinct("city", { isActive: true });
  res.json(cities.sort());
});

const getOwnerPGs = asyncHandler(async (req, res) => {
  const pgs = await PG.find({ owner: req.user._id });

  const pgData = await Promise.all(
    pgs.map(async (pg) => {
      const rooms = await Room.find({ pg: pg._id });
      const totalResidents = rooms.reduce((sum, room) => sum + room.occupancy, 0);
      const vacantBeds = rooms.reduce((sum, room) => sum + (room.capacity - room.occupancy), 0);
      return { ...pg.toObject(), totalRooms: rooms.length, totalResidents, vacantBeds };
    })
  );

  res.json(pgData);
});

const getPGById = asyncHandler(async (req, res) => {
  const pg = await PG.findById(req.params.id).populate("owner", "name email phone");
  if (!pg) throw new AppError("PG not found", 404);
  res.json(pg);
});

const assertOwnership = (pg, userId) => {
  if (pg.owner.toString() !== userId.toString()) {
    throw new AppError("Not authorized", 403);
  }
};

const updatePG = asyncHandler(async (req, res) => {
  const pg = await PG.findById(req.params.id);
  if (!pg) throw new AppError("PG not found", 404);
  assertOwnership(pg, req.user._id);

  // Prevent clients from overwriting protected fields directly via this endpoint.
  const { owner, images, ratingsAverage, ratingsCount, ...safeUpdates } = req.body;
  const updated = await PG.findByIdAndUpdate(req.params.id, safeUpdates, { new: true, runValidators: true });
  logger.info(`[UPDATE PG] ${pg.name}`);
  res.json(updated);
});

const deletePG = asyncHandler(async (req, res) => {
  const pg = await PG.findById(req.params.id);
  if (!pg) throw new AppError("PG not found", 404);
  assertOwnership(pg, req.user._id);

  await Promise.all((pg.images || []).map((img) => deleteImage(img.publicId)));
  await pg.deleteOne();
  logger.info(`[DELETE PG] ${pg.name}`);
  res.json({ message: "PG deleted" });
});

const uploadPGImages = asyncHandler(async (req, res) => {
  const pg = await PG.findById(req.params.id);
  if (!pg) throw new AppError("PG not found", 404);
  assertOwnership(pg, req.user._id);

  if (!req.files || req.files.length === 0) throw new AppError("No images uploaded", 400);
  if ((pg.images?.length || 0) + req.files.length > 8) {
    throw new AppError("A PG can have at most 8 images", 400);
  }

  const uploaded = await Promise.all(req.files.map((f) => uploadBuffer(f.buffer, "smart-pg/pgs")));
  pg.images.push(...uploaded.map((u) => ({ url: u.url, publicId: u.publicId })));
  await pg.save();

  res.json(pg);
});

const deletePGImage = asyncHandler(async (req, res) => {
  const pg = await PG.findById(req.params.id);
  if (!pg) throw new AppError("PG not found", 404);
  assertOwnership(pg, req.user._id);

  const image = pg.images.find((img) => img._id.toString() === req.params.imageId);
  if (!image) throw new AppError("Image not found", 404);

  await deleteImage(image.publicId);
  pg.images = pg.images.filter((img) => img._id.toString() !== req.params.imageId);
  await pg.save();

  res.json(pg);
});

const getOwnerStats = asyncHandler(async (req, res) => {
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
  res.json(stats);
});

// Last 6 months of collected vs pending rent for the owner's PGs — powers the analytics chart.
const getOwnerRevenueTrend = asyncHandler(async (req, res) => {
  const pgs = await PG.find({ owner: req.user._id });
  const pgIds = pgs.map((p) => p._id);

  const now = new Date();
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ month: d.getMonth() + 1, year: d.getFullYear() });
  }

  const trend = await Promise.all(
    months.map(async ({ month, year }) => {
      const payments = await Payment.find({ pg: { $in: pgIds }, month, year });
      const collected = payments.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0);
      const pending = payments.filter((p) => p.status === "pending").reduce((s, p) => s + p.amount, 0);
      return { month, year, collected, pending };
    })
  );

  res.json(trend);
});

module.exports = {
  createPG, getAllPGs, getCities, getOwnerPGs, getPGById, updatePG, deletePG,
  uploadPGImages, deletePGImage, getOwnerStats, getOwnerRevenueTrend,
};
