const express = require("express");
const router = express.Router();
const {
  createRoom, updateRoom, getRoomsByPG, allocateResident, vacateResident,
  getMyRoom, getResidentProfile, deleteRoom,
  submitVacateNotice, cancelVacateNotice, getOwnerVacateRequests, getOwnerVacatedResidents,
} = require("../controllers/roomController");
const { protect } = require("../middleware/authMiddleware");
const { ownerOnly } = require("../middleware/ownerMiddleware");
const validate = require("../middleware/validate");
const { roomValidator, allocateValidator } = require("../utils/validators");

router.get("/my", protect, getMyRoom);

// Resident vacate notice
router.post("/vacate-notice", protect, submitVacateNotice);
router.delete("/vacate-notice", protect, cancelVacateNotice);

// Owner views
router.get("/owner/vacate-requests", protect, ownerOnly, getOwnerVacateRequests);
router.get("/owner/vacated", protect, ownerOnly, getOwnerVacatedResidents);

router.post("/:pgId", protect, ownerOnly, roomValidator, validate, createRoom);
router.get("/:pgId", getRoomsByPG);
router.put("/:roomId", protect, ownerOnly, updateRoom);
router.post("/:roomId/allocate", protect, ownerOnly, allocateValidator, validate, allocateResident);
router.post("/:roomId/vacate", protect, ownerOnly, vacateResident);
router.get("/resident/:residentId/profile", protect, ownerOnly, getResidentProfile);
router.delete("/:roomId", protect, ownerOnly, deleteRoom);

module.exports = router;