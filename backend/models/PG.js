const mongoose = require("mongoose");

const pgSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    locality: { type: String, default: "" },
    description: { type: String, default: "" },
    amenities: [{ type: String }],
    rentRange: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 0 },
    },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    contactPhone: { type: String, default: "" },
    rules: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PG", pgSchema);