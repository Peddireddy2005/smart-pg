const express = require("express");
const router = express.Router();
const { getReportSummary, downloadReportPDF, downloadReportExcel } = require("../controllers/reportController");
const { protect } = require("../middleware/authMiddleware");
const { ownerOnly } = require("../middleware/ownerMiddleware");

router.get("/summary", protect, ownerOnly, getReportSummary);
router.get("/pdf", protect, ownerOnly, downloadReportPDF);
router.get("/excel", protect, ownerOnly, downloadReportExcel);

module.exports = router;
