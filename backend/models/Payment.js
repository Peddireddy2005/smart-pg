const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    resident: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    room: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
    pg: { type: mongoose.Schema.Types.ObjectId, ref: "PG", required: true },
    amount: { type: Number, required: true },
    month: { type: Number, required: true },
    year: { type: Number, required: true },
    status: { type: String, enum: ["paid", "pending"], default: "pending" },
    paidAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);