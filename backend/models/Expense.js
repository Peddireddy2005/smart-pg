const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
  {
    pg: { type: mongoose.Schema.Types.ObjectId, ref: "PG", required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    category: {
      type: String,
      enum: ["Electricity", "Water", "Maintenance", "Internet", "Salary", "Repairs", "Other"],
      required: true,
    },
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, required: true, default: Date.now },
    note: { type: String, default: "" },
  },
  { timestamps: true }
);

expenseSchema.index({ pg: 1, date: -1 });

module.exports = mongoose.model("Expense", expenseSchema);
