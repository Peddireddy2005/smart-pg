const QRCode = require("qrcode");
const Invite = require("../models/Invite");
const Room = require("../models/Room");
const PG = require("../models/PG");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const logger = require("../config/logger");
const { notify } = require("../utils/notify");
const { logActivity } = require("../utils/activityLog");

const INVITE_EXPIRE_HOURS = 72;

// Owner: generate a QR-joinable invite link for a specific room (spec §7).
const createInvite = asyncHandler(async (req, res) => {
  const room = await Room.findById(req.params.roomId).populate("pg");
  if (!room) throw new AppError("Room not found", 404);
  if (room.pg.owner.toString() !== req.user._id.toString()) throw new AppError("Not authorized", 403);
  if (room.occupancy >= room.capacity) throw new AppError("Room is already full", 400);

  const invite = await Invite.create({
    pg: room.pg._id,
    room: room._id,
    createdBy: req.user._id,
    expiresAt: new Date(Date.now() + INVITE_EXPIRE_HOURS * 60 * 60 * 1000),
  });

  const joinUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/join/${invite.token}`;
  const qrDataUrl = await QRCode.toDataURL(joinUrl);

  logger.info(`[INVITE] Created for room ${room.roomNumber}: ${invite.token}`);
  res.status(201).json({ token: invite.token, joinUrl, qrDataUrl, expiresAt: invite.expiresAt });
});

// Public: fetch invite details (room/PG name) before the resident logs in.
const getInvite = asyncHandler(async (req, res) => {
  const invite = await Invite.findOne({ token: req.params.token })
    .populate("pg", "name city address")
    .populate("room", "roomNumber rent capacity occupancy type");
  if (!invite) throw new AppError("Invite not found", 404);
  if (invite.usedBy) throw new AppError("This invite has already been used", 400);
  if (invite.expiresAt < new Date()) throw new AppError("This invite link has expired", 400);
  res.json(invite);
});

// Resident (already authenticated via OTP/signup): claim the invite and get auto-assigned.
const claimInvite = asyncHandler(async (req, res) => {
  const invite = await Invite.findOne({ token: req.params.token }).populate("room");
  if (!invite) throw new AppError("Invite not found", 404);
  if (invite.usedBy) throw new AppError("This invite has already been used", 400);
  if (invite.expiresAt < new Date()) throw new AppError("This invite link has expired", 400);

  const resident = await User.findById(req.user._id);
  if (resident.role !== "resident") throw new AppError("Only residents can join via invite", 400);
  if (resident.assignedRoom) throw new AppError("You are already assigned to a room", 400);

  const room = await Room.findById(invite.room._id).populate("pg");
  if (room.occupancy >= room.capacity) throw new AppError("Room is already full", 400);

  room.residents.push(resident._id);
  room.occupancy += 1;
  if (room.occupancy >= room.capacity) room.status = "occupied";
  await room.save();

  resident.assignedPG = room.pg._id;
  resident.assignedRoom = room._id;
  resident.moveInDate = new Date();
  await resident.save();

  invite.usedBy = resident._id;
  await invite.save();

  await notify({
    user: invite.createdBy,
    title: "Resident Joined via QR",
    message: `${resident.name} joined Room ${room.roomNumber} at ${room.pg.name} via QR invite.`,
    type: "allocation",
    link: "/owner/dashboard",
  });
  await logActivity({ owner: invite.createdBy, actor: resident._id, action: "Resident Auto-Assigned (QR)", entityType: "Room", entityId: room._id, details: `${resident.email} -> Room ${room.roomNumber}` });

  const populatedRoom = await Room.findById(room._id).populate("residents", "name email phone photoUrl");
  res.json({ message: "Joined successfully", room: populatedRoom });
});

module.exports = { createInvite, getInvite, claimInvite };
