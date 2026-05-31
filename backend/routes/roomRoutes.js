const express = require("express");

const router = express.Router();

const {
    createRoom,
    getRoomsOfPG,
    getSingleRoom
} = require("../controllers/roomController");

const protect = require("../middleware/authMiddleware");

const ownerOnly = require("../middleware/ownerMiddleware");

const {
    allocateResident,
    removeResident
} = require("../controllers/roomController");

router.post(
    "/",
    protect,
    ownerOnly,
    createRoom
);

router.post(
    "/allocate-room",
    protect,
    ownerOnly,
    allocateResident
);

router.post(
  "/remove-resident",
  protect,
  ownerOnly,
  removeResident
);

router.get("/:id", getSingleRoom);

module.exports = router;