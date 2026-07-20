const mongoose = require("mongoose");
const crypto = require("crypto");

const visitorSchema = new mongoose.Schema(
  {
    pg: { type: mongoose.Schema.Types.ObjectId, ref: "PG", required: true },
    resident: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, default: "" },
    purpose: { type: String, default: "" },
    qrToken: { type: String, unique: true, index: true },
    status: { type: String, enum: ["pending", "approved", "rejected", "entered", "exited"], default: "pending" },
    entryTime: { type: Date },
    exitTime: { type: Date },
  },
  { timestamps: true }
);

visitorSchema.pre("validate", function (next) {
  if (!this.qrToken) this.qrToken = crypto.randomBytes(16).toString("hex");
  next();
});

visitorSchema.index({ pg: 1, status: 1 });

module.exports = mongoose.model("Visitor", visitorSchema);
