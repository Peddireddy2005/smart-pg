const Room = require("../models/Room");
const PG = require("../models/PG");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const logger = require("../config/logger");
const { notify } = require("../utils/notify");
const { logActivity } = require("../utils/activityLog");

const recalcRentRange = async (pgId) => {
  const allRooms = await Room.find({ pg: pgId });
  if (allRooms.length === 0) return;
  const rents = allRooms.map((r) => r.rent);
  await PG.findByIdAndUpdate(pgId, { rentRange: { min: Math.min(...rents), max: Math.max(...rents) } });
};

const createRoom = asyncHandler(async (req, res) => {
  const { pgId } = req.params;
  const pg = await PG.findById(pgId);
  if (!pg) throw new AppError("PG not found", 404);
  if (pg.owner.toString() !== req.user._id.toString()) throw new AppError("Not authorized", 403);

  const room = await Room.create({ ...req.body, pg: pgId, occupancy: 0 });
  logger.info(`[CREATE ROOM] ${room.roomNumber}`);

  await recalcRentRange(pgId);
  await logActivity({ owner: req.user._id, actor: req.user._id, action: "Room Created", entityType: "Room", entityId: room._id, details: `${pg.name} — Room ${room.roomNumber}` });
  res.status(201).json(room);
});

const updateRoom = asyncHandler(async (req, res) => {
  const room = await Room.findById(req.params.roomId).populate("pg");
  if (!room) throw new AppError("Room not found", 404);
  if (room.pg.owner.toString() !== req.user._id.toString()) throw new AppError("Not authorized", 403);

  const { roomNumber, capacity, rent, floor, type, status } = req.body;
  if (capacity !== undefined && Number(capacity) < room.occupancy) {
    throw new AppError(`Capacity can't be less than current occupancy (${room.occupancy})`, 400);
  }

  Object.assign(room, {
    ...(roomNumber !== undefined && { roomNumber }),
    ...(capacity !== undefined && { capacity }),
    ...(rent !== undefined && { rent }),
    ...(floor !== undefined && { floor }),
    ...(type !== undefined && { type }),
    ...(status !== undefined && { status }),
  });
  await room.save();
  await recalcRentRange(room.pg._id);

  logger.info(`[UPDATE ROOM] ${room.roomNumber}`);
  res.json(room);
});

const getRoomsByPG = asyncHandler(async (req, res) => {
  const rooms = await Room.find({ pg: req.params.pgId })
    .populate("residents", "name email phone photoUrl isVerified invitedByOwner");
  res.json(rooms);
});

const allocateResident = asyncHandler(async (req, res) => {
  const { residentEmail, residentName } = req.body;
  let resident = await User.findOne({ email: residentEmail.toLowerCase() });

  if (!resident) {
    if (!residentName) {
      throw new AppError("Resident not found. Please provide their name to add them as a guest.", 400);
    }
    resident = await User.create({
      name: residentName,
      email: residentEmail.toLowerCase(),
      password: "",
      role: "resident",
      isVerified: false,
      invitedByOwner: true,
    });
    logger.info(`[ALLOCATE] Guest account created: ${resident._id}`);
  } else if (resident.role !== "resident") {
    throw new AppError("This email belongs to an owner account", 400);
  }

  if (resident.assignedRoom) throw new AppError("Resident is already assigned to a room", 400);

  const room = await Room.findById(req.params.roomId).populate("pg");
  if (!room) throw new AppError("Room not found", 404);
  if (room.occupancy >= room.capacity) throw new AppError("Room is full", 400);

  room.residents.push(resident._id);
  room.occupancy += 1;
  if (room.occupancy >= room.capacity) room.status = "occupied";
  await room.save();

  await User.findByIdAndUpdate(resident._id, {
    assignedPG: room.pg._id,
    assignedRoom: room._id,
    moveInDate: new Date(),
  });

  await notify({
    user: resident._id,
    title: "Room Assigned",
    message: `You've been assigned to Room ${room.roomNumber} at ${room.pg.name}.`,
    type: "allocation",
    link: "/resident/room",
  });

  await logActivity({ owner: req.user._id, actor: req.user._id, action: "Resident Added", entityType: "Room", entityId: room._id, details: `${resident.email} -> Room ${room.roomNumber}` });

  logger.info(`[ALLOCATE] Done. Room: ${room.roomNumber} Resident: ${resident.email}`);
  const populated = await Room.findById(room._id)
    .populate("residents", "name email phone photoUrl isVerified invitedByOwner");
  res.json(populated);
});

const removeResident = asyncHandler(async (req, res) => {
  const { residentId } = req.body;
  const room = await Room.findById(req.params.roomId);
  if (!room) throw new AppError("Room not found", 404);

  room.residents = room.residents.filter((r) => r.toString() !== residentId);
  room.occupancy = Math.max(0, room.occupancy - 1);
  if (room.occupancy < room.capacity) room.status = "available";
  await room.save();

  await User.findByIdAndUpdate(residentId, { assignedPG: null, assignedRoom: null, moveOutDate: new Date() });

  await logActivity({ owner: req.user._id, actor: req.user._id, action: "Resident Removed", entityType: "Room", entityId: room._id, details: `Room ${room.roomNumber}` });

  const populated = await Room.findById(room._id)
    .populate("residents", "name email phone photoUrl isVerified invitedByOwner");
  res.json(populated);
});

const getMyRoom = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user.assignedRoom) throw new AppError("No room assigned", 404);

  const room = await Room.findById(user.assignedRoom)
    .populate("residents", "name email phone photoUrl isVerified")
    .populate("pg", "name address city amenities contactPhone rules");

  res.json(room);
});

const getResidentProfile = asyncHandler(async (req, res) => {
  const resident = await User.findById(req.params.residentId)
    .select("-password")
    .populate("assignedPG", "name city")
    .populate("assignedRoom", "roomNumber");

  if (!resident) throw new AppError("Resident not found", 404);
  if (resident.role !== "resident") throw new AppError("Not a resident", 400);

  const ownerPGs = await PG.find({ owner: req.user._id });
  const ownerPGIds = ownerPGs.map((p) => p._id.toString());
  if (resident.assignedPG && !ownerPGIds.includes(resident.assignedPG._id?.toString())) {
    throw new AppError("This resident is not in your PG", 403);
  }

  res.json(resident);
});

const deleteRoom = asyncHandler(async (req, res) => {
  const room = await Room.findById(req.params.roomId);
  if (!room) throw new AppError("Room not found", 404);
  if (room.occupancy > 0) throw new AppError("Remove residents first", 400);

  const pgId = room.pg;
  await room.deleteOne();
  await recalcRentRange(pgId);

  await logActivity({ owner: req.user._id, actor: req.user._id, action: "Room Deleted", entityType: "Room", entityId: room._id, details: `Room ${room.roomNumber}` });
  res.json({ message: "Room deleted" });
});

module.exports = {
  createRoom, updateRoom, getRoomsByPG, allocateResident, removeResident,
  getMyRoom, getResidentProfile, deleteRoom,
};
