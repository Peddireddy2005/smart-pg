const mongoose = require("mongoose");

const announcementSchema = new mongoose.Schema(
  {
    pg: { type: mongoose.Schema.Types.ObjectId, ref: "PG", required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true, maxlength: 150 },
    message: { type: String, required: true, maxlength: 2000 },
    type: {
      type: String,
      enum: ["Water Shutdown", "Rent Reminder", "Holiday", "Cleaning", "General"],
      default: "General",
    },
  },
  { timestamps: true }
);

announcementSchema.index({ pg: 1, createdAt: -1 });

module.exports = mongoose.model("Announcement", announcementSchema);
