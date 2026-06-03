const express = require("express");
const router = express.Router();
const { createRoom, getRoomsByPG, allocateResident, removeResident, getMyRoom, getResidentProfile } = require("../controllers/roomController");
const { protect } = require("../middleware/authMiddleware");
const { ownerOnly } = require("../middleware/ownerMiddleware");

router.get("/my", protect, getMyRoom);
router.post("/:pgId", protect, ownerOnly, createRoom);
router.get("/:pgId", getRoomsByPG);
router.post("/:roomId/allocate", protect, ownerOnly, allocateResident);
router.post("/:roomId/remove", protect, ownerOnly, removeResident);
router.get("/resident/:residentId/profile", protect, ownerOnly, getResidentProfile);
router.delete("/:roomId", protect, ownerOnly, deleteRoom);

module.exports = router;