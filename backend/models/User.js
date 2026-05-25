const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },

    email: {
        type: String,
        required: true,
        unique: true
    },

    password: {
        type: String,
        required: true
    },

    role: {
        type: String,
        enum: ["owner", "resident"],
        default: "resident"
    },

    assignedRoom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Room",
    default: null
    },

    assignedPG: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PG",
    default: null
 }
});

const User = mongoose.model("User", userSchema);

module.exports = User;