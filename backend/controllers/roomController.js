const Room = require("../models/Room");
const PG = require("../models/PG");
const User = require("../models/User");

const createRoom = async (req, res) => {
  console.log("[CREATE ROOM] PG ID:", req.params.pgId, "| Data:", req.body, "| By:", req.user.email);
  const { roomNumber, capacity, rent } = req.body;
  const { pgId } = req.params;
  try {
    const pg = await PG.findById(pgId);
    if (!pg) {
      console.warn("[CREATE ROOM] PG not found:", pgId);
      return res.status(404).json({ message: "PG not found" });
    }
    if (pg.owner.toString() !== req.user._id.toString()) {
      console.warn("[CREATE ROOM] Unauthorized by:", req.user.email);
      return res.status(403).json({ message: "Not authorized" });
    }

    const room = await Room.create({ roomNumber, capacity, rent, pg: pgId });
    console.log("[CREATE ROOM] Room created:", room._id, "Room No:", roomNumber, "Rent:", rent);

    const allRooms = await Room.find({ pg: pgId });
    const rents = allRooms.map((r) => r.rent);
    const newRange = { min: Math.min(...rents), max: Math.max(...rents) };
    await PG.findByIdAndUpdate(pgId, { rentRange: newRange });
    console.log("[CREATE ROOM] Updated PG rent range:", newRange);

    res.status(201).json(room);
  } catch (err) {
    console.error("[CREATE ROOM] ERROR:", err.message);
    res.status(500).json({ message: err.message });
  }
};

const getRoomsByPG = async (req, res) => {
  console.log("[GET ROOMS] PG ID:", req.params.pgId);
  try {
    const rooms = await Room.find({ pg: req.params.pgId }).populate("residents", "name email");
    console.log(`[GET ROOMS] Found ${rooms.length} rooms for PG:`, req.params.pgId);
    res.json(rooms);
  } catch (err) {
    console.error("[GET ROOMS] ERROR:", err.message);
    res.status(500).json({ message: err.message });
  }
};

const allocateResident = async (req, res) => {
  console.log("[ALLOCATE] Room ID:", req.params.roomId, "| Resident Email:", req.body.residentEmail);
  const { residentEmail } = req.body;
  try {
    console.log("[ALLOCATE] Looking up resident by email:", residentEmail);
    const resident = await User.findOne({ email: residentEmail, role: "resident" });
    if (!resident) {
      console.warn("[ALLOCATE] No resident found with email:", residentEmail);
      return res.status(404).json({ message: "No resident found with that email" });
    }
    console.log("[ALLOCATE] Resident found:", resident._id, resident.name);

    if (resident.assignedRoom) {
      console.warn("[ALLOCATE] Resident already assigned to room:", resident.assignedRoom);
      return res.status(400).json({ message: "Resident is already assigned to a room" });
    }

    const room = await Room.findById(req.params.roomId).populate("pg");
    if (!room) {
      console.warn("[ALLOCATE] Room not found:", req.params.roomId);
      return res.status(404).json({ message: "Room not found" });
    }
    console.log("[ALLOCATE] Room found:", room.roomNumber, "| Occupancy:", room.occupancy, "/", room.capacity);

    if (room.occupancy >= room.capacity) {
      console.warn("[ALLOCATE] Room is full:", room.roomNumber);
      return res.status(400).json({ message: "Room is full" });
    }

    room.residents.push(resident._id);
    room.occupancy += 1;
    await room.save();
    console.log("[ALLOCATE] Resident added to room. New occupancy:", room.occupancy);

    await User.findByIdAndUpdate(resident._id, {
      assignedPG: room.pg._id,
      assignedRoom: room._id,
    });
    console.log("[ALLOCATE] User assignedPG and assignedRoom updated for:", resident.email);

    const populated = await Room.findById(room._id).populate("residents", "name email");
    res.json(populated);
  } catch (err) {
    console.error("[ALLOCATE] ERROR:", err.message);
    res.status(500).json({ message: err.message });
  }
};

const removeResident = async (req, res) => {
  console.log("[REMOVE RESIDENT] Room ID:", req.params.roomId, "| Resident ID:", req.body.residentId);
  const { residentId } = req.body;
  try {
    const room = await Room.findById(req.params.roomId);
    if (!room) {
      console.warn("[REMOVE RESIDENT] Room not found:", req.params.roomId);
      return res.status(404).json({ message: "Room not found" });
    }

    const before = room.residents.length;
    room.residents = room.residents.filter((r) => r.toString() !== residentId);
    room.occupancy = Math.max(0, room.occupancy - 1);
    await room.save();
    console.log(`[REMOVE RESIDENT] Residents before: ${before}, after: ${room.residents.length}. Occupancy: ${room.occupancy}`);

    await User.findByIdAndUpdate(residentId, { assignedPG: null, assignedRoom: null });
    console.log("[REMOVE RESIDENT] Cleared assignedPG and assignedRoom for resident:", residentId);

    const populated = await Room.findById(room._id).populate("residents", "name email");
    res.json(populated);
  } catch (err) {
    console.error("[REMOVE RESIDENT] ERROR:", err.message);
    res.status(500).json({ message: err.message });
  }
};

const getMyRoom = async (req, res) => {
  console.log("[MY ROOM] Fetching room for resident:", req.user.email);
  try {
    const user = await User.findById(req.user._id).populate("assignedRoom").populate("assignedPG");
    if (!user.assignedRoom) {
      console.warn("[MY ROOM] No room assigned for:", req.user.email);
      return res.status(404).json({ message: "No room assigned" });
    }
    console.log("[MY ROOM] Assigned room:", user.assignedRoom.roomNumber, "| PG:", user.assignedPG?.name);

    const room = await Room.findById(user.assignedRoom._id).populate("residents", "name email");
    console.log("[MY ROOM] Roommates count:", room.residents.length);
    res.json({ room, pg: user.assignedPG });
  } catch (err) {
    console.error("[MY ROOM] ERROR:", err.message);
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createRoom, getRoomsByPG, allocateResident, removeResident, getMyRoom };