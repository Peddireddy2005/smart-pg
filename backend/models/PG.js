const mongoose = require("mongoose");

const pgSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    locality: { type: String, default: "" },
    description: { type: String, default: "" },
    amenities: [{ type: String }],
    images: [
      {
        url: { type: String, required: true },
        publicId: { type: String, default: "" },
      },
    ],
    rentRange: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 0 },
    },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    contactPhone: { type: String, default: "" },
    rules: { type: String, default: "" },
    ratingsAverage: { type: Number, default: 0, min: 0, max: 5 },
    ratingsCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    isArchived: { type: Boolean, default: false },

    gender: { type: String, enum: ["Male", "Female", "Co-ed", ""], default: "" },
    sharingTypes: [{ type: String }],
    hasFood: { type: Boolean, default: false },
    hasAC: { type: Boolean, default: false },
    hasParking: { type: Boolean, default: false },
    hasWifi: { type: Boolean, default: false },
    hasLaundry: { type: Boolean, default: false },

    location: {
      lat: { type: Number },
      lng: { type: Number },
    },
  },
  { timestamps: true }
);

pgSchema.index({ city: 1 });
pgSchema.index({ owner: 1 });
pgSchema.index({ name: "text", city: "text", locality: "text" });

module.exports = mongoose.model("PG", pgSchema);
