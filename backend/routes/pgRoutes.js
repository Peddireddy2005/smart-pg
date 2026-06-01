const express = require("express");
const router = express.Router();
const { createPG, getAllPGs, getOwnerPGs, getPGById, updatePG, deletePG, getOwnerStats } = require("../controllers/pgController");
const { protect } = require("../middleware/authMiddleware");
const { ownerOnly } = require("../middleware/ownerMiddleware");

router.get("/", getAllPGs);
router.get("/owner", protect, ownerOnly, getOwnerPGs);
router.get("/owner/stats", protect, ownerOnly, getOwnerStats);
router.get("/:id", getPGById);
router.post("/", protect, ownerOnly, createPG);
router.put("/:id", protect, ownerOnly, updatePG);
router.delete("/:id", protect, ownerOnly, deletePG);

module.exports = router;