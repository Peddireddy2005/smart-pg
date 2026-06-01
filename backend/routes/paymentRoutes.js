const express = require("express");
const router = express.Router();
const {
  generateMonthlyRents, payRent, getMyPayments,
  getPGPayments, getOwnerPaymentSummary,
} = require("../controllers/paymentController");
const { protect } = require("../middleware/authMiddleware");
const { ownerOnly } = require("../middleware/ownerMiddleware");

router.post("/generate/:pgId", protect, ownerOnly, generateMonthlyRents);
router.put("/pay/:id", protect, payRent);
router.get("/my", protect, getMyPayments);
router.get("/owner/summary", protect, ownerOnly, getOwnerPaymentSummary);
router.get("/pg/:pgId", protect, ownerOnly, getPGPayments);

module.exports = router;