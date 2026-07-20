const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    pg: { type: mongoose.Schema.Types.ObjectId, ref: "PG", required: true },
    resident: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: "", maxlength: 1000 },
    photos: [{ type: String }],
    ownerReply: { type: String, default: "" },
  },
  { timestamps: true }
);

reviewSchema.index({ pg: 1, resident: 1 }, { unique: true });

module.exports = mongoose.model("Review", reviewSchema);
