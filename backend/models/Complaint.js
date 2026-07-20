const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "in-progress", "resolved", "closed"],
      default: "pending",
    },
    priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
    category: {
      type: String,
      enum: ["Electrical", "Plumbing", "Internet", "Cleaning", "Food", "Others"],
      default: "Others",
    },
    images: [{ url: { type: String }, publicId: { type: String, default: "" } }],
    resident: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    pg: { type: mongoose.Schema.Types.ObjectId, ref: "PG", required: true },
    room: { type: mongoose.Schema.Types.ObjectId, ref: "Room" },
    assignedStaff: { type: mongoose.Schema.Types.ObjectId, ref: "Staff", default: null },
    ownerNote: { type: String, default: "" },
  },
  { timestamps: true }
);

complaintSchema.index({ pg: 1, status: 1 });
complaintSchema.index({ resident: 1 });

module.exports = mongoose.model("Complaint", complaintSchema);
