const express = require("express");
const router = express.Router();
const { getOwnerActivityLogs } = require("../controllers/activityLogController");
const { protect } = require("../middleware/authMiddleware");
const { ownerOnly } = require("../middleware/ownerMiddleware");

router.get("/", protect, ownerOnly, getOwnerActivityLogs);

module.exports = router;
