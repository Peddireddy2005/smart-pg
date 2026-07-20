const Expense = require("../models/Expense");
const PG = require("../models/PG");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const { logActivity } = require("../utils/activityLog");

const assertPGOwnership = async (pgId, userId) => {
  const pg = await PG.findById(pgId);
  if (!pg) throw new AppError("PG not found", 404);
  if (pg.owner.toString() !== userId.toString()) throw new AppError("Not authorized", 403);
  return pg;
};

const createExpense = asyncHandler(async (req, res) => {
  const { pgId } = req.params;
  await assertPGOwnership(pgId, req.user._id);
  const expense = await Expense.create({ ...req.body, pg: pgId, owner: req.user._id });
  await logActivity({ owner: req.user._id, actor: req.user._id, action: "Expense Recorded", entityType: "Expense", entityId: expense._id, details: `${expense.category} — ₹${expense.amount}` });
  res.status(201).json(expense);
});

const getPGExpenses = asyncHandler(async (req, res) => {
  const expenses = await Expense.find({ pg: req.params.pgId }).sort({ date: -1 });
  res.json(expenses);
});

const getOwnerExpenses = asyncHandler(async (req, res) => {
  const pgs = await PG.find({ owner: req.user._id });
  const pgIds = pgs.map((p) => p._id);
  const filter = { pg: { $in: pgIds } };
  if (req.query.month && req.query.year) {
    const start = new Date(Number(req.query.year), Number(req.query.month) - 1, 1);
    const end = new Date(Number(req.query.year), Number(req.query.month), 1);
    filter.date = { $gte: start, $lt: end };
  }
  const expenses = await Expense.find(filter).populate("pg", "name").sort({ date: -1 });
  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const byCategory = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {});
  res.json({ expenses, total, byCategory });
});

const updateExpense = asyncHandler(async (req, res) => {
  const expense = await Expense.findById(req.params.id);
  if (!expense) throw new AppError("Expense not found", 404);
  if (expense.owner.toString() !== req.user._id.toString()) throw new AppError("Not authorized", 403);

  const { category, amount, date, note } = req.body;
  Object.assign(expense, {
    ...(category !== undefined && { category }),
    ...(amount !== undefined && { amount }),
    ...(date !== undefined && { date }),
    ...(note !== undefined && { note }),
  });
  await expense.save();
  res.json(expense);
});

const deleteExpense = asyncHandler(async (req, res) => {
  const expense = await Expense.findById(req.params.id);
  if (!expense) throw new AppError("Expense not found", 404);
  if (expense.owner.toString() !== req.user._id.toString()) throw new AppError("Not authorized", 403);
  await expense.deleteOne();
  res.json({ message: "Expense deleted" });
});

module.exports = { createExpense, getPGExpenses, getOwnerExpenses, updateExpense, deleteExpense };
