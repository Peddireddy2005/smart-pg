const mongoose = require("mongoose");
const crypto = require("crypto");

// QR-based resident invite: owner generates one per room, resident scans the
// QR (which encodes a link containing this token) to auto-join that room.
const inviteSchema = new mongoose.Schema(
  {
    token: { type: String, unique: true, index: true },
    pg: { type: mongoose.Schema.Types.ObjectId, ref: "PG", required: true },
    room: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    usedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

inviteSchema.pre("validate", function (next) {
  if (!this.token) this.token = crypto.randomBytes(20).toString("hex");
  next();
});

module.exports = mongoose.model("Invite", inviteSchema);
