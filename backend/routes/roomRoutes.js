const express = require("express");
const router = express.Router();
const {
  createRoom, updateRoom, getRoomsByPG, allocateResident, removeResident,
  getMyRoom, getResidentProfile, deleteRoom,
} = require("../controllers/roomController");
const { protect } = require("../middleware/authMiddleware");
const { ownerOnly } = require("../middleware/ownerMiddleware");
const validate = require("../middleware/validate");
const { roomValidator, allocateValidator } = require("../utils/validators");

router.get("/my", protect, getMyRoom);
router.post("/:pgId", protect, ownerOnly, roomValidator, validate, createRoom);
router.get("/:pgId", getRoomsByPG);
router.put("/:roomId", protect, ownerOnly, updateRoom);
router.post("/:roomId/allocate", protect, ownerOnly, allocateValidator, validate, allocateResident);
router.post("/:roomId/remove", protect, ownerOnly, removeResident);
router.get("/resident/:residentId/profile", protect, ownerOnly, getResidentProfile);
router.delete("/:roomId", protect, ownerOnly, deleteRoom);

module.exports = router;
