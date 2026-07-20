const InventoryItem = require("../models/InventoryItem");
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

const createItem = asyncHandler(async (req, res) => {
  const { pgId } = req.params;
  await assertPGOwnership(pgId, req.user._id);
  const item = await InventoryItem.create({ ...req.body, pg: pgId, owner: req.user._id });
  await logActivity({ owner: req.user._id, actor: req.user._id, action: "Inventory Item Added", entityType: "InventoryItem", entityId: item._id, details: item.name });
  res.status(201).json(item);
});

const getPGInventory = asyncHandler(async (req, res) => {
  const items = await InventoryItem.find({ pg: req.params.pgId }).populate("room", "roomNumber").sort({ createdAt: -1 });
  res.json(items);
});

const getOwnerInventory = asyncHandler(async (req, res) => {
  const pgs = await PG.find({ owner: req.user._id });
  const items = await InventoryItem.find({ pg: { $in: pgs.map((p) => p._id) } })
    .populate("pg", "name")
    .populate("room", "roomNumber")
    .sort({ createdAt: -1 });
  res.json(items);
});

const updateItem = asyncHandler(async (req, res) => {
  const item = await InventoryItem.findById(req.params.id);
  if (!item) throw new AppError("Item not found", 404);
  if (item.owner.toString() !== req.user._id.toString()) throw new AppError("Not authorized", 403);

  const { name, category, quantity, condition, room } = req.body;
  Object.assign(item, {
    ...(name !== undefined && { name }),
    ...(category !== undefined && { category }),
    ...(quantity !== undefined && { quantity }),
    ...(condition !== undefined && { condition }),
    ...(room !== undefined && { room: room || null }),
  });
  await item.save();
  res.json(item);
});

// Log a repair against an item (spec §22 — "Repair History").
const addRepairRecord = asyncHandler(async (req, res) => {
  const { note, cost, date } = req.body;
  const item = await InventoryItem.findById(req.params.id);
  if (!item) throw new AppError("Item not found", 404);
  if (item.owner.toString() !== req.user._id.toString()) throw new AppError("Not authorized", 403);

  item.repairHistory.push({ note, cost: cost || 0, date: date || new Date() });
  item.condition = "Needs Repair";
  await item.save();
  res.json(item);
});

const deleteItem = asyncHandler(async (req, res) => {
  const item = await InventoryItem.findById(req.params.id);
  if (!item) throw new AppError("Item not found", 404);
  if (item.owner.toString() !== req.user._id.toString()) throw new AppError("Not authorized", 403);
  await item.deleteOne();
  res.json({ message: "Item deleted" });
});

module.exports = { createItem, getPGInventory, getOwnerInventory, updateItem, addRepairRecord, deleteItem };
