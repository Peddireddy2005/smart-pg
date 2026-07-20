const express = require("express");
const router = express.Router();
const {
  createItem, getPGInventory, getOwnerInventory, updateItem, addRepairRecord, deleteItem,
} = require("../controllers/inventoryController");
const { protect } = require("../middleware/authMiddleware");
const { ownerOnly } = require("../middleware/ownerMiddleware");
const validate = require("../middleware/validate");
const { inventoryValidator } = require("../utils/validators");

router.post("/pg/:pgId", protect, ownerOnly, inventoryValidator, validate, createItem);
router.get("/pg/:pgId", protect, ownerOnly, getPGInventory);
router.get("/owner/all", protect, ownerOnly, getOwnerInventory);
router.put("/:id", protect, ownerOnly, updateItem);
router.put("/:id/repair", protect, ownerOnly, addRepairRecord);
router.delete("/:id", protect, ownerOnly, deleteItem);

module.exports = router;
