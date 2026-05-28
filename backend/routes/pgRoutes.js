const express = require("express");

const router = express.Router();

const {
    createPG,
    getAllPGs,
    getSinglePG,
    getMyPGs,
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
router.get("/my-pgs", protect, ownerOnly, (req, res, next) => {
  console.log("MY-PGS ROUTE HIT");
  next();
}, getMyPGs);
router.get("/:pgId/rooms", getRoomsOfPG);
router.get("/:id", (req, res, next) => {
  console.log("ID ROUTE HIT:", req.params.id);
  next();
}, getSinglePG);

module.exports = router;