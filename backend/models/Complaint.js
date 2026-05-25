const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema({

    resident: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    room: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Room",
        required: true
    },

    pg: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PG",
        required: true
    },

    title: {
        type: String,
        required: true
    },

    description: {
        type: String,
        required: true
    },

    status: {
        type: String,
        enum: [
            "pending",
            "in-progress",
            "resolved"
        ],
        default: "pending"
    }

}, {
    timestamps: true
});

const Complaint = mongoose.model(
    "Complaint",
    complaintSchema
);

module.exports = Complaint;