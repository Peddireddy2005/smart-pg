const express = require("express");
const router = express.Router();
const {
  inviteVisitor, getMyVisitors, getOwnerVisitors, approveVisitor, logVisitorEvent,
} = require("../controllers/visitorController");
const { protect } = require("../middleware/authMiddleware");
const { ownerOnly } = require("../middleware/ownerMiddleware");
const validate = require("../middleware/validate");
const { visitorValidator } = require("../utils/validators");

router.post("/", protect, visitorValidator, validate, inviteVisitor);
router.get("/my", protect, getMyVisitors);
router.get("/owner/all", protect, ownerOnly, getOwnerVisitors);
router.put("/:id/approve", protect, ownerOnly, approveVisitor);
router.post("/:token/event", protect, ownerOnly, logVisitorEvent);

module.exports = router;
