const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    resident: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    room: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
    pg: { type: mongoose.Schema.Types.ObjectId, ref: "PG", required: true },
    amount: { type: Number, required: true },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },
    status: { type: String, enum: ["paid", "pending", "failed"], default: "pending" },
    dueDate: { type: Date },
    paidAt: { type: Date },
    note: { type: String, default: "" },

    // Razorpay tracking
    razorpayOrderId: { type: String, default: "" },
    razorpayPaymentId: { type: String, default: "" },
    razorpaySignature: { type: String, default: "" },
    paymentMethod: { type: String, enum: ["razorpay", "cash", "upi", "bank_transfer", ""], default: "" },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // owner who recorded a manual/offline payment
  },
  { timestamps: true }
);

paymentSchema.index({ resident: 1, month: 1, year: 1 });
paymentSchema.index({ pg: 1, month: 1, year: 1 });
paymentSchema.index({ status: 1 });

module.exports = mongoose.model("Payment", paymentSchema);
