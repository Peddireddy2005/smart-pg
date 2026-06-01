const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema(
  {
    roomNumber: { type: String, required: true },
    capacity: { type: Number, required: true },
    occupancy: { type: Number, default: 0 },
    rent: { type: Number, required: true },
    pg: { type: mongoose.Schema.Types.ObjectId, ref: "PG", required: true },
    residents: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Room", roomSchema);