const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema(
  {
    roomNumber: { type: String, required: true },
    capacity: { type: Number, required: true, min: 1 },
    occupancy: { type: Number, default: 0, min: 0 },
    rent: { type: Number, required: true, min: 0 },
    pg: { type: mongoose.Schema.Types.ObjectId, ref: "PG", required: true },
    residents: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    floor: { type: String, default: "" },
    type: { type: String, enum: ["Single", "Double", "Triple", "Dormitory", ""], default: "" },
  },
  { timestamps: true }
);

roomSchema.index({ pg: 1 });

module.exports = mongoose.model("Room", roomSchema);
