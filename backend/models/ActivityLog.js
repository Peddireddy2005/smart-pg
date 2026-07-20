const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    action: { type: String, required: true }, // e.g. "PG Created", "Resident Added"
    entityType: { type: String, default: "" }, // "PG", "Room", "Payment", ...
    entityId: { type: mongoose.Schema.Types.ObjectId },
    details: { type: String, default: "" },
  },
  { timestamps: true }
);

activityLogSchema.index({ owner: 1, createdAt: -1 });

module.exports = mongoose.model("ActivityLog", activityLogSchema);
