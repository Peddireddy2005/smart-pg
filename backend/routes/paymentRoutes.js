const express = require("express");
const router = express.Router();
const {
  generateMonthlyRents, createRazorpayOrder, verifyRazorpayPayment,
  recordOfflinePayment, getMyPayments, getPGPayments, getOwnerPaymentSummary, getInvoice,
} = require("../controllers/paymentController");
const { protect } = require("../middleware/authMiddleware");
const { ownerOnly } = require("../middleware/ownerMiddleware");
const validate = require("../middleware/validate");
const { generateRentValidator } = require("../utils/validators");

// NOTE: POST /api/payments/webhook is registered directly in server.js
// (before the global JSON body parser) so Razorpay's signature can be
// verified against the raw request bytes.

router.post("/generate/:pgId", protect, ownerOnly, generateRentValidator, validate, generateMonthlyRents);

router.post("/:id/create-order", protect, createRazorpayOrder);
router.post("/:id/verify", protect, verifyRazorpayPayment);
router.put("/:id/record-offline", protect, ownerOnly, recordOfflinePayment);
router.get("/:id/invoice", protect, getInvoice);

router.get("/my", protect, getMyPayments);
router.get("/owner/summary", protect, ownerOnly, getOwnerPaymentSummary);
router.get("/pg/:pgId", protect, ownerOnly, getPGPayments);

module.exports = router;
