const Room = require("../models/Room");
const PG = require("../models/PG");
const User = require("../models/User");

const createRoom = async (req, res) => {
  const { pgId } = req.params;
  console.log("[CREATE ROOM] PG:", pgId, "Data:", req.body);
  try {
    const pg = await PG.findById(pgId);
    if (!pg) return res.status(404).json({ message: "PG not found" });
    if (pg.owner.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not authorized" });

    const room = await Room.create({ ...req.body, pg: pgId, occupancy: 0 });
    console.log("[CREATE ROOM] Created:", room.roomNumber);

    // Update rent range
    const allRooms = await Room.find({ pg: pgId });
    const rents = allRooms.map((r) => r.rent);
    await PG.findByIdAndUpdate(pgId, { rentRange: { min: Math.min(...rents), max: Math.max(...rents) } });

    res.status(201).json(room);
  } catch (err) {
    console.error("[CREATE ROOM] Error:", err.message);
    res.status(500).json({ message: err.message });
  }
};

const getRoomsByPG = async (req, res) => {
  try {
    const rooms = await Room.find({ pg: req.params.pgId })
      .populate("residents", "name email phone photoUrl isVerified invitedByOwner");
    console.log("[GET ROOMS] PG:", req.params.pgId, "Count:", rooms.length);
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Allocate by email — supports unregistered residents
const allocateResident = async (req, res) => {
  const { residentEmail, residentName } = req.body;
  console.log("[ALLOCATE] Room:", req.params.roomId, "Email:", residentEmail);
  try {
    let resident = await User.findOne({ email: residentEmail.toLowerCase() });

    if (!resident) {
      // Create a placeholder account for unregistered resident
      if (!residentName) return res.status(400).json({ message: "Resident not found. Please provide their name to add them as a guest." });
      console.log("[ALLOCATE] Creating guest account for:", residentEmail);
      resident = await User.create({
        name: residentName,
        email: residentEmail.toLowerCase(),
        password: "",
        role: "resident",
        isVerified: false,
        invitedByOwner: true,
      });
      console.log("[ALLOCATE] Guest account created:", resident._id);
    } else if (resident.role !== "resident") {
      return res.status(400).json({ message: "This email belongs to an owner account" });
    }

    if (resident.assignedRoom)
      return res.status(400).json({ message: "Resident is already assigned to a room" });

    const room = await Room.findById(req.params.roomId).populate("pg");
    if (!room) return res.status(404).json({ message: "Room not found" });
    if (room.occupancy >= room.capacity)
      return res.status(400).json({ message: "Room is full" });

    room.residents.push(resident._id);
    room.occupancy += 1;
    await room.save();

    await User.findByIdAndUpdate(resident._id, {
      assignedPG: room.pg._id,
      assignedRoom: room._id,
    });

    console.log("[ALLOCATE] Done. Room:", room.roomNumber, "Resident:", resident.email);
    const populated = await Room.findById(room._id)
      .populate("residents", "name email phone photoUrl isVerified invitedByOwner");
    res.json(populated);
  } catch (err) {
    console.error("[ALLOCATE] Error:", err.message);
    res.status(500).json({ message: err.message });
  }
};

const removeResident = async (req, res) => {
  const { residentId } = req.body;
  console.log("[REMOVE RESIDENT] Room:", req.params.roomId, "Resident:", residentId);
  try {
    const room = await Room.findById(req.params.roomId);
    if (!room) return res.status(404).json({ message: "Room not found" });

    room.residents = room.residents.filter((r) => r.toString() !== residentId);
    room.occupancy = Math.max(0, room.occupancy - 1);
    await room.save();

    await User.findByIdAndUpdate(residentId, { assignedPG: null, assignedRoom: null });
    console.log("[REMOVE RESIDENT] Done");

    const populated = await Room.findById(room._id)
      .populate("residents", "name email phone photoUrl isVerified invitedByOwner");
    res.json(populated);
  } catch (err) {
    console.error("[REMOVE RESIDENT] Error:", err.message);
    res.status(500).json({ message: err.message });
  }
};

const getMyRoom = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user.assignedRoom) return res.status(404).json({ message: "No room assigned" });

    const room = await Room.findById(user.assignedRoom)
      .populate("residents", "name email phone photoUrl isVerified")
      .populate("pg", "name address city amenities contactPhone rules");

    console.log("[MY ROOM]", req.user.email, "Room:", room?.roomNumber);
    res.json(room);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Owner view: get full resident profile
const getResidentProfile = async (req, res) => {
  console.log("[RESIDENT PROFILE] Owner:", req.user.email, "Resident:", req.params.residentId);
  try {
    const resident = await User.findById(req.params.residentId)
      .select("-password")
      .populate("assignedPG", "name city")
      .populate("assignedRoom", "roomNumber");

    if (!resident) return res.status(404).json({ message: "Resident not found" });
    if (resident.role !== "resident") return res.status(400).json({ message: "Not a resident" });

    // Verify the resident belongs to one of the owner's PGs
    const PG = require("../models/PG");
    const ownerPGs = await PG.find({ owner: req.user._id });
    const ownerPGIds = ownerPGs.map((p) => p._id.toString());
    if (resident.assignedPG && !ownerPGIds.includes(resident.assignedPG._id?.toString())) {
      return res.status(403).json({ message: "This resident is not in your PG" });
    }

    res.json(resident);
  } catch (err) {
    console.error("[RESIDENT PROFILE] Error:", err.message);
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createRoom, getRoomsByPG, allocateResident, removeResident, getMyRoom, getResidentProfile };