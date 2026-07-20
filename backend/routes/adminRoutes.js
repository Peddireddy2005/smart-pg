const express = require("express");
const router = express.Router();
const { getPlatformStats, getAllOwners, getAllPGsAdmin, setAccountActive } = require("../controllers/adminController");
const { protect } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/adminMiddleware");

router.get("/stats", protect, adminOnly, getPlatformStats);
router.get("/owners", protect, adminOnly, getAllOwners);
router.get("/pgs", protect, adminOnly, getAllPGsAdmin);
router.put("/users/:id/active", protect, adminOnly, setAccountActive);

module.exports = router;
