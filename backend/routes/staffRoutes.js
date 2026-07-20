const express = require("express");
const router = express.Router();
const {
  createStaff, getPGStaff, getOwnerStaff, updateStaff, deleteStaff, markAttendance,
} = require("../controllers/staffController");
const { protect } = require("../middleware/authMiddleware");
const { ownerOnly } = require("../middleware/ownerMiddleware");
const validate = require("../middleware/validate");
const { staffValidator } = require("../utils/validators");

router.post("/pg/:pgId", protect, ownerOnly, staffValidator, validate, createStaff);
router.get("/pg/:pgId", protect, ownerOnly, getPGStaff);
router.get("/owner/all", protect, ownerOnly, getOwnerStaff);
router.put("/:id", protect, ownerOnly, updateStaff);
router.put("/:id/attendance", protect, ownerOnly, markAttendance);
router.delete("/:id", protect, ownerOnly, deleteStaff);

module.exports = router;
