const express = require("express");
const router = express.Router();
const {
  createComplaint, getMyComplaints, getOwnerComplaints, getPGComplaints,
  updateComplaintStatus, assignComplaintStaff,
} = require("../controllers/complaintController");
const { protect } = require("../middleware/authMiddleware");
const { ownerOnly } = require("../middleware/ownerMiddleware");
const validate = require("../middleware/validate");
const { complaintValidator } = require("../utils/validators");
const upload = require("../middleware/uploadMiddleware");

router.post("/", protect, upload.array("images", 4), complaintValidator, validate, createComplaint);
router.get("/my", protect, getMyComplaints);
router.get("/owner/all", protect, ownerOnly, getOwnerComplaints);
router.get("/pg/:pgId", protect, ownerOnly, getPGComplaints);
router.put("/:id/status", protect, ownerOnly, updateComplaintStatus);
router.put("/:id/assign", protect, ownerOnly, assignComplaintStaff);

module.exports = router;
