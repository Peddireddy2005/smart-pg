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
    priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
    resident: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    pg: { type: mongoose.Schema.Types.ObjectId, ref: "PG", required: true },
    room: { type: mongoose.Schema.Types.ObjectId, ref: "Room" },
    ownerNote: { type: String, default: "" },
  },
  { timestamps: true }
);

complaintSchema.index({ pg: 1, status: 1 });
complaintSchema.index({ resident: 1 });

module.exports = mongoose.model("Complaint", complaintSchema);
