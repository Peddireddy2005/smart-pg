const express = require("express");
const router = express.Router();
const {
  createAnnouncement, getPGAnnouncements, getMyAnnouncements, getOwnerAnnouncements, deleteAnnouncement,
} = require("../controllers/announcementController");
const { protect } = require("../middleware/authMiddleware");
const { ownerOnly } = require("../middleware/ownerMiddleware");
const validate = require("../middleware/validate");
const { announcementValidator } = require("../utils/validators");

router.post("/pg/:pgId", protect, ownerOnly, announcementValidator, validate, createAnnouncement);
router.get("/pg/:pgId", protect, ownerOnly, getPGAnnouncements);
router.get("/my", protect, getMyAnnouncements);
router.get("/owner/all", protect, ownerOnly, getOwnerAnnouncements);
router.delete("/:id", protect, ownerOnly, deleteAnnouncement);

module.exports = router;
