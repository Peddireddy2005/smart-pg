const Payment = require("../models/Payment");

const User = require("../models/User");

const Room = require("../models/Room");

const createPayment = async (req, res) => {

    try {

        const {
            residentId,
            amount,
            month,
            year
        } = req.body;

        // check resident exists
        const resident = await User.findById(residentId);

        if (!resident) {

            return res.status(404).json({
                message: "Resident not found"
            });

        }

        // resident must have room
        if (!resident.assignedRoom) {

            return res.status(400).json({
                message: "Resident has no room"
            });

        }

        // duplicate monthly payment check
        const existingPayment = await Payment.findOne({

            resident: residentId,
            month,
            year

        });

        if (existingPayment) {

            return res.status(400).json({
                message:
                    "Payment already exists for this month"
            });

        }

        // create payment
        const payment = await Payment.create({

            resident: resident._id,

            room: resident.assignedRoom,

            pg: resident.assignedPG,

            amount,

            month,

            year

        });

        res.status(201).json({
            message: "Payment created successfully",
            payment
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }

};

const payRent = async (req, res) => {

    try {

        const payment = await Payment.findById(
            req.params.id
        );

        if (!payment) {

            return res.status(404).json({
                message: "Payment not found"
            });

        }

        // resident can pay only own payment
        if (
            payment.resident.toString() !==
            req.user._id.toString()
        ) {

            return res.status(403).json({
                message:
                    "You can only pay your own rent"
            });

        }

        // already paid check
        if (payment.status === "paid") {

            return res.status(400).json({
                message: "Rent already paid"
            });

        }

        payment.status = "paid";

        payment.paidAt = new Date();

        await payment.save();

        res.status(200).json({
            message: "Rent paid successfully",
            payment
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }

};

const getMyPayments = async (req, res) => {

    try {

        const payments = await Payment.find({

            resident: req.user._id

        })
        .populate("room", "roomNumber")
        .populate("pg", "name");

        res.status(200).json(payments);

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }

};

const getPGPayments = async (req, res) => {

    try {

        const payments = await Payment.find({

            pg: req.params.pgId

        })
        .populate("resident", "name email")
        .populate("room", "roomNumber");

        res.status(200).json(payments);

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }

};

module.exports = {

    createPayment,

    payRent,

    getMyPayments,

    getPGPayments

};