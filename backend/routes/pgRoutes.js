const express = require("express");

const router = express.Router();

const {
    createPG,
    getAllPGs,
    getSinglePG
} = require("../controllers/pgController");

const { getRoomsOfPG } = require("../controllers/roomController");

const protect = require("../middleware/authMiddleware");

const ownerOnly = require("../middleware/ownerMiddleware");

router.post(
    "/",
    protect,
    ownerOnly,
    createPG
);

router.get("/", getAllPGs);

router.get("/:pgId/rooms", getRoomsOfPG);

router.get("/:id", getSinglePG);

module.exports = router;