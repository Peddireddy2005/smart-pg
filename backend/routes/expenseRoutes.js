const express = require("express");
const router = express.Router();
const {
  createExpense, getPGExpenses, getOwnerExpenses, updateExpense, deleteExpense,
} = require("../controllers/expenseController");
const { protect } = require("../middleware/authMiddleware");
const { ownerOnly } = require("../middleware/ownerMiddleware");
const validate = require("../middleware/validate");
const { expenseValidator } = require("../utils/validators");

router.post("/pg/:pgId", protect, ownerOnly, expenseValidator, validate, createExpense);
router.get("/pg/:pgId", protect, ownerOnly, getPGExpenses);
router.get("/owner/all", protect, ownerOnly, getOwnerExpenses);
router.put("/:id", protect, ownerOnly, updateExpense);
router.delete("/:id", protect, ownerOnly, deleteExpense);

module.exports = router;
