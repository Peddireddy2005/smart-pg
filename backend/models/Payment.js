const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    resident: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    room: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
    pg: { type: mongoose.Schema.Types.ObjectId, ref: "PG", required: true },
    amount: { type: Number, required: true },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },

    // pending -> resident hasn't acted yet
    // pending_approval -> resident submitted UPI/cash proof, waiting on owner
    // paid / rejected / failed -> terminal states
    status: {
      type: String,
      enum: ["pending", "pending_approval", "paid", "rejected", "failed"],
      default: "pending",
    },
    dueDate: { type: Date },
    paidAt: { type: Date },
    note: { type: String, default: "" },

    type: { type: String, enum: ["rent", "advance", "deposit", "late_fee"], default: "rent" },

    paymentMethod: { type: String, enum: ["razorpay", "upi", "cash", "bank_transfer", ""], default: "" },

    // How the "paid" status was confirmed — shown on the receipt.
    verifiedBy: { type: String, enum: ["automatic", "owner", ""], default: "" },

    // Razorpay (auto-verified)
    razorpayOrderId: { type: String, default: "" },
    razorpayPaymentId: { type: String, default: "" },
    razorpaySignature: { type: String, default: "" },
    convenienceFee: { type: Number, default: 0 },

    // Direct UPI (resident-submitted, owner-approved)
    upiScreenshotUrl: { type: String, default: "" },
    upiScreenshotPublicId: { type: String, default: "" },
    upiTransactionId: { type: String, default: "" },

    // Cash (resident-submitted, owner-approved)
    cashAmount: { type: Number },
    cashPaymentDate: { type: Date },
    cashNote: { type: String, default: "" },

    rejectionReason: { type: String, default: "" },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // owner who directly marked as paid
  },
  { timestamps: true }
);

paymentSchema.index({ resident: 1, month: 1, year: 1 });
paymentSchema.index({ pg: 1, month: 1, year: 1 });
paymentSchema.index({ status: 1 });

module.exports = mongoose.model("Payment", paymentSchema);
