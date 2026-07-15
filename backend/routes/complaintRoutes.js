const express = require("express");
const router = express.Router();
const { createComplaint, getMyComplaints, getOwnerComplaints, getPGComplaints, updateComplaintStatus } = require("../controllers/complaintController");
const { protect } = require("../middleware/authMiddleware");
const { ownerOnly } = require("../middleware/ownerMiddleware");
const validate = require("../middleware/validate");
const { complaintValidator } = require("../utils/validators");

router.post("/", protect, complaintValidator, validate, createComplaint);
router.get("/my", protect, getMyComplaints);
router.get("/owner/all", protect, ownerOnly, getOwnerComplaints);
router.get("/pg/:pgId", protect, ownerOnly, getPGComplaints);
router.put("/:id/status", protect, ownerOnly, updateComplaintStatus);

module.exports = router;
