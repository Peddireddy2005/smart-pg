const mongoose = require("mongoose");

const inventoryItemSchema = new mongoose.Schema(
  {
    pg: { type: mongoose.Schema.Types.ObjectId, ref: "PG", required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ["Beds", "Mattress", "Fan", "AC", "Table", "Chair", "Cupboard", "Other"],
      default: "Other",
    },
    quantity: { type: Number, default: 1, min: 0 },
    condition: { type: String, enum: ["New", "Good", "Fair", "Needs Repair", "Damaged"], default: "Good" },
    room: { type: mongoose.Schema.Types.ObjectId, ref: "Room", default: null },
    repairHistory: [
      {
        date: { type: Date, default: Date.now },
        note: { type: String, default: "" },
        cost: { type: Number, default: 0 },
      },
    ],
  },
  { timestamps: true }
);

inventoryItemSchema.index({ pg: 1 });

module.exports = mongoose.model("InventoryItem", inventoryItemSchema);
