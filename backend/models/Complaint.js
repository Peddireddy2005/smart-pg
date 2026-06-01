const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "in-progress", "resolved"],
      default: "pending",
    },
    resident: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    pg: { type: mongoose.Schema.Types.ObjectId, ref: "PG", required: true },
    room: { type: mongoose.Schema.Types.ObjectId, ref: "Room" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Complaint", complaintSchema);