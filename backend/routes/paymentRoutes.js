const express = require("express");
const router = express.Router();
const {
  generateMonthlyRents, getPaymentOptions, createRazorpayOrder, verifyRazorpayPayment,
  submitUpiPayment, submitCashPayment, getOwnerPaymentRequests, approvePaymentRequest, rejectPaymentRequest,
  recordOfflinePayment, getMyPayments, getPGPayments, getOwnerPaymentSummary,
  getPaymentSettings, updatePaymentSettings, getInvoice,
} = require("../controllers/paymentController");
const { protect } = require("../middleware/authMiddleware");
const { ownerOnly } = require("../middleware/ownerMiddleware");
const validate = require("../middleware/validate");
const { generateRentValidator } = require("../utils/validators");
const upload = require("../middleware/uploadMiddleware");

router.post("/generate/:pgId", protect, ownerOnly, generateRentValidator, validate, generateMonthlyRents);

// Owner payment settings (enabled methods + UPI ID/QR)
router.get("/settings", protect, ownerOnly, getPaymentSettings);
router.put("/settings", protect, ownerOnly, updatePaymentSettings);

// Owner: approval queue for UPI/cash claims
router.get("/owner/requests", protect, ownerOnly, getOwnerPaymentRequests);
router.put("/:id/approve", protect, ownerOnly, approvePaymentRequest);
router.put("/:id/reject", protect, ownerOnly, rejectPaymentRequest);

// Resident: method picker + the three payment flows
router.get("/:id/options", protect, getPaymentOptions);
router.post("/:id/create-order", protect, createRazorpayOrder);
router.post("/:id/verify", protect, verifyRazorpayPayment);
router.post("/:id/submit-upi", protect, upload.single("screenshot"), submitUpiPayment);
router.post("/:id/submit-cash", protect, submitCashPayment);

router.put("/:id/record-offline", protect, ownerOnly, recordOfflinePayment);
router.get("/:id/invoice", protect, getInvoice);

router.get("/my", protect, getMyPayments);
router.get("/owner/summary", protect, ownerOnly, getOwnerPaymentSummary);
router.get("/pg/:pgId", protect, ownerOnly, getPGPayments);

module.exports = router;
