const Complaint = require("../models/Complaint");

const User = require("../models/User");

const PG = require("../models/PG");

const createComplaint = async (req, res) => {

    try {

        const { title, description } = req.body;

        // resident must have room
        if (!req.user.assignedRoom) {

            return res.status(400).json({
                message:
                    "Resident is not allocated to any room"
            });

        }

        const complaint = await Complaint.create({

            resident: req.user._id,

            room: req.user.assignedRoom,

            pg: req.user.assignedPG,

            title,

            description

        });

        res.status(201).json({
            message: "Complaint created successfully",
            complaint
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }

};

const getMyComplaints = async (req, res) => {

    try {

        const complaints = await Complaint.find({

            resident: req.user._id

        })
        .populate("room", "roomNumber")
        .populate("pg", "name");

        res.status(200).json(complaints);

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }

};

const getPGComplaints = async (req, res) => {

    try {

        const pg = await PG.findById(
            req.params.pgId
        );

        if (!pg) {

            return res.status(404).json({
                message: "PG not found"
            });

        }

        // ownership validation
        if (
            pg.owner.toString() !==
            req.user._id.toString()
        ) {

            return res.status(403).json({
                message:
                    "You do not own this PG"
            });

        }

        const complaints = await Complaint.find({

            pg: req.params.pgId

        })
        .populate("resident", "name email")
        .populate("room", "roomNumber");

        res.status(200).json(complaints);

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }

};

const updateComplaintStatus = async (req, res) => {

    try {

        const { status } = req.body;

        const complaint = await Complaint.findById(
            req.params.id
        ).populate("pg");

        if (!complaint) {

            return res.status(404).json({
                message: "Complaint not found"
            });

        }

        // ownership validation
        if (
            complaint.pg.owner.toString() !==
            req.user._id.toString()
        ) {

            return res.status(403).json({
                message:
                    "You do not own this complaint"
            });

        }

        // status validation
        const validStatuses = [
            "pending",
            "in-progress",
            "resolved"
        ];

        if (!validStatuses.includes(status)) {

            return res.status(400).json({
                message: "Invalid status"
            });

        }

        complaint.status = status;

        await complaint.save();

        res.status(200).json({
            message:
                "Complaint status updated",
            complaint
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }

};

module.exports = {

    createComplaint,

    getMyComplaints,

    getPGComplaints,

    updateComplaintStatus

};