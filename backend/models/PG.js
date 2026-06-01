const mongoose = require("mongoose");

const pgSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    locality: { type: String },
    description: { type: String },
    amenities: [{ type: String }],
    rentRange: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 0 },
    },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PG", pgSchema);