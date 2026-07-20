const mongoose = require("mongoose");

const staffSchema = new mongoose.Schema(
  {
    pg: { type: mongoose.Schema.Types.ObjectId, ref: "PG", required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true },
    role: {
      type: String,
      enum: ["Cleaner", "Cook", "Security", "Electrician", "Plumber", "Other"],
      default: "Other",
    },
    phone: { type: String, default: "" },
    salary: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    attendance: [
      {
        date: { type: Date, required: true },
        present: { type: Boolean, default: true },
      },
    ],
  },
  { timestamps: true }
);

staffSchema.index({ pg: 1 });

module.exports = mongoose.model("Staff", staffSchema);
