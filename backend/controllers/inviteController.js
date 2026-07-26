const mongoose = require("mongoose");
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
const { chargeResidentOnJoin } = require("../utils/chargeOnJoin");

const INVITE_EXPIRE_HOURS = 72;

// Owner: generate a QR-joinable invite link + short code for a specific room (spec §7).
const createInvite = asyncHandler(async (req, res) => {
  const room = await Room.findById(req.params.roomId).populate("pg");
  if (!room || !room.pg) throw new AppError("Room not found", 404);
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

  logger.info(`[INVITE] Created for room ${room.roomNumber}: ${invite.token} (code ${invite.code})`);
  res.status(201).json({ token: invite.token, code: invite.code, joinUrl, qrDataUrl, expiresAt: invite.expiresAt });
});

// Public: fetch invite details (room/PG name) before the resident logs in — via QR link token.
const getInvite = asyncHandler(async (req, res) => {
  const invite = await Invite.findOne({ token: req.params.token })
    .populate("pg", "name city address")
    .populate("room", "roomNumber rent capacity occupancy type");
  if (!invite) throw new AppError("Invite not found", 404);
  if (invite.usedBy) throw new AppError("This invite has already been used", 400);
  if (invite.expiresAt < new Date()) throw new AppError("This invite link has expired", 400);
  res.json(invite);
});

// Same lookup, but by the short human-typeable code instead of the QR token.
const getInviteByCode = asyncHandler(async (req, res) => {
  const invite = await Invite.findOne({ code: req.params.code.toUpperCase() })
    .populate("pg", "name city address")
    .populate("room", "roomNumber rent capacity occupancy type");
  if (!invite) throw new AppError("Invalid or expired code", 404);
  if (invite.usedBy) throw new AppError("This invite has already been used", 400);
  if (invite.expiresAt < new Date()) throw new AppError("This invite code has expired", 400);
  res.json(invite);
});

// Resident (already authenticated via OTP/signup): claim the invite and get auto-assigned.
// Used by both the QR flow and the "enter code" flow — both resolve to a token first.
// Wrapped in a transaction — the invite consumption, room update, resident
// update, and rent/deposit charge either all commit together or none do.
const claimInvite = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  let resultResident;
  let resultRoom;
  let resultInvite;

  try {
    await session.withTransaction(async () => {
      const invite = await Invite.findOne({ token: req.params.token }).populate("room").session(session);
      if (!invite) throw new AppError("Invite not found", 404);
      if (invite.usedBy) throw new AppError("This invite has already been used", 400);
      if (invite.expiresAt < new Date()) throw new AppError("This invite link has expired", 400);

      const resident = await User.findById(req.user._id).session(session);
      if (resident.role !== "resident") throw new AppError("Only residents can join via invite", 400);
      if (resident.assignedRoom) throw new AppError("You are already assigned to a room", 400);

      // Personal details must be filled in before joining a room — not just ID
      // proof. Checked first since it's the more basic requirement.
      if (!resident.phone || !resident.emergencyContact || !resident.emergencyPhone) {
        throw new AppError("Please complete your personal details (phone, emergency contact) in My Profile before joining a PG", 400);
      }
      if (!resident.idProofType || !resident.idProofUrl) {
        throw new AppError("Please complete your ID verification in My Profile before joining a PG", 400);
      }

      const room = await Room.findById(invite.room._id).populate("pg").session(session);
      if (room.occupancy >= room.capacity) throw new AppError("Room is already full", 400);

      room.residents.push(resident._id);
      room.occupancy += 1;
      if (room.occupancy >= room.capacity) room.status = "occupied";
      await room.save({ session });

      resident.assignedPG = room.pg._id;
      resident.assignedRoom = room._id;
      resident.moveInDate = new Date();
      await resident.save({ session });

      invite.usedBy = resident._id;
      await invite.save({ session });

      await chargeResidentOnJoin({ resident, room, pg: room.pg, ownerId: room.pg.owner, session });

      resultResident = resident;
      resultRoom = room;
      resultInvite = invite;
    });
  } finally {
    session.endSession();
  }

  await notify({
    user: resultInvite.createdBy,
    title: "Resident Joined via Invite",
    message: `${resultResident.name} joined Room ${resultRoom.roomNumber} at ${resultRoom.pg.name} via invite.`,
    type: "allocation",
    link: "/owner/dashboard",
  });
  await logActivity({ owner: resultInvite.createdBy, actor: resultResident._id, action: "Resident Auto-Assigned (Invite)", entityType: "Room", entityId: resultRoom._id, details: `${resultResident.email} -> Room ${resultRoom.roomNumber}` });

  const populatedRoom = await Room.findById(resultRoom._id).populate("residents", "name email phone photoUrl");
  res.json({ message: "Joined successfully", room: populatedRoom });
});

module.exports = { createInvite, getInvite, getInviteByCode, claimInvite };