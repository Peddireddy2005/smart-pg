const express = require("express");
const router = express.Router();
const { createInvite, getInvite, claimInvite } = require("../controllers/inviteController");
const { protect } = require("../middleware/authMiddleware");
const { ownerOnly } = require("../middleware/ownerMiddleware");

router.post("/room/:roomId", protect, ownerOnly, createInvite);
router.get("/:token", getInvite);
router.post("/:token/claim", protect, claimInvite);

module.exports = router;
