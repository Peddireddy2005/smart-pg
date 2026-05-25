const express = require("express");
const protect = require("../middleware/authMiddleware");
const ownerOnly = require("../middleware/ownerMiddleware");
const router = express.Router();

const {
    signup,
    login
} = require("../controllers/authController");

router.post("/signup", signup);

router.post("/login", login);

router.get("/profile", protect, (req, res) => {

    res.json({
        message: "Profile Access Granted",
        user: req.user
    });

});

router.post("/test-owner", protect, ownerOnly, (req, res) => {

    res.json({
        message: "Owner Access Granted",
        user: req.user
    });

});

module.exports = router;