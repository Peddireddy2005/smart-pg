const Room = require("../models/Room");
const PG = require("../models/PG");
const User = require("../models/User");
const createRoom = async (req, res) => {

    try {

        const {
            roomNumber,
            capacity,
            occupancy,
            rent,
            pgId
        } = req.body;

        if (capacity <= 0) {

            return res.status(400).json({
                message: "Capacity must be greater than 0"
            });

        }

        if (rent <= 0) {

            return res.status(400).json({
                message: "Rent must be greater than 0"
            });

        }

        if (occupancy > capacity) {

            return res.status(400).json({
                message: "Occupancy cannot exceed capacity"
            });

        }

        // check pg exists
        const pg = await PG.findById(pgId);

        if (!pg) {

            return res.status(404).json({
                message: "PG not found"
            });

        }

        // ownership validation
        if (pg.owner.toString() !== req.user._id.toString()) {

            return res.status(403).json({
                message: "You do not own this PG"
            });

        }

        // duplicate room number check
        const existingRoom = await Room.findOne({
            roomNumber,
            pg: pgId
        });

        if (existingRoom) {

            return res.status(400).json({
                message: "Room already exists in this PG"
            });

        }

        // create room
        const room = await Room.create({

            roomNumber,
            capacity,
            occupancy,
            rent,

            pg: pgId

        });

        res.status(201).json({
            message: "Room created successfully",
            room
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }

};

const getRoomsOfPG = async (req, res) => {

    try {

        const rooms = await Room.find({pg: req.params.pgId,}).populate("residents");

        res.status(200).json(rooms);

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }

};

const getSingleRoom = async (req, res) => {

    try {

        const room = await Room.findById(req.params.id)
            .populate("pg");

        if (!room) {

            return res.status(404).json({
                message: "Room not found"
            });

        }

        res.status(200).json(room);

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }

};

const allocateResident = async (req, res) => {
  try {
    const { residentId, roomId } = req.body;

    const resident = await User.findById(residentId);

    if (!resident) {
      return res.status(404).json({
        message: "Resident not found",
      });
    }

    if (resident.role !== "resident") {
      return res.status(400).json({
        message: "User is not a resident",
      });
    }

    const room = await Room.findById(roomId).populate("pg");

    if (!room) {
      return res.status(404).json({
        message: "Room not found",
      });
    }

    if (
      room.pg.owner.toString() !==
      req.user._id.toString()
    ) {
      return res.status(403).json({
        message: "You do not own this PG",
      });
    }

    if (room.occupancy >= room.capacity) {
      return res.status(400).json({
        message: "Room is full",
      });
    }

    if (resident.assignedRoom) {
      return res.status(400).json({
        message: "Resident already allocated",
      });
    }

    // assign room to resident
    resident.assignedRoom = room._id;
    resident.assignedPG = room.pg._id;

    await resident.save();

    if (!room.residents) {
        room.residents = [];
    }

    // IMPORTANT FIX
    room.residents.push(resident._id);

    room.occupancy += 1;

    await room.save();

    res.status(200).json({
      message: "Resident allocated successfully",
      resident,
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const removeResident = async (req, res) => {

    try {

        const { residentId } = req.body;

        const resident = await User.findById(residentId);

        if (!resident) {

            return res.status(404).json({
                message: "Resident not found"
            });

        }

        if (!resident.assignedRoom) {

            return res.status(400).json({
                message: "Resident has no room assigned"
            });

        }

        const room = await Room.findById(
            resident.assignedRoom
        ).populate("pg");

        // ownership validation
        if (
            room.pg.owner.toString() !==
            req.user._id.toString()
        ) {

            return res.status(403).json({
                message: "You do not own this PG"
            });

        }

        // decrease occupancy
        room.occupancy -= 1;
        room.residents = room.residents.filter(
            (id) => id.toString() !== residentId
        );
        await room.save();

        // remove assignment
        resident.assignedRoom = null;

        resident.assignedPG = null;

        await resident.save();

        res.status(200).json({
            message: "Resident removed successfully"
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }

};

module.exports = {
    createRoom,
    getRoomsOfPG,
    getSingleRoom,
    allocateResident,
    removeResident
};