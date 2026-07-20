const express = require("express");
const router = express.Router();
const { ownerSearch } = require("../controllers/searchController");
const { protect } = require("../middleware/authMiddleware");
const { ownerOnly } = require("../middleware/ownerMiddleware");

router.get("/", protect, ownerOnly, ownerSearch);

module.exports = router;
