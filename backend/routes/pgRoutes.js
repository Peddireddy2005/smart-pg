const express = require("express");
const router = express.Router();
const {
  createPG, getAllPGs, getCities, getOwnerPGs, getPGById, updatePG, deletePG,
  uploadPGImages, deletePGImage, getOwnerStats, getOwnerRevenueTrend,
} = require("../controllers/pgController");
const { protect } = require("../middleware/authMiddleware");
const { ownerOnly } = require("../middleware/ownerMiddleware");
const validate = require("../middleware/validate");
const { pgValidator } = require("../utils/validators");
const upload = require("../middleware/uploadMiddleware");

router.get("/", getAllPGs);
router.get("/cities", getCities);
router.get("/owner", protect, ownerOnly, getOwnerPGs);
router.get("/owner/stats", protect, ownerOnly, getOwnerStats);
router.get("/owner/revenue-trend", protect, ownerOnly, getOwnerRevenueTrend);
router.get("/:id", getPGById);
router.post("/", protect, ownerOnly, pgValidator, validate, createPG);
router.put("/:id", protect, ownerOnly, updatePG);
router.delete("/:id", protect, ownerOnly, deletePG);
router.post("/:id/images", protect, ownerOnly, upload.array("images", 8), uploadPGImages);
router.delete("/:id/images/:imageId", protect, ownerOnly, deletePGImage);

module.exports = router;
