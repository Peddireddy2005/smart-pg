const mongoose = require("mongoose");

const pgSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true
    },

    address: {
        type: String,
        required: true
    },

    description: {
        type: String
    },

    amenities: {
        type: [String]
    },

    rentRange: {
        type: Number
    },

    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }

}, {
    timestamps: true
});

const PG = mongoose.model("PG", pgSchema);

module.exports = PG;