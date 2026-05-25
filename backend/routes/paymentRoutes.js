const express = require("express");

const router = express.Router();

const {
    createPayment,
    payRent,
    getMyPayments,
    getPGPayments
} = require("../controllers/paymentController");

const protect = require("../middleware/authMiddleware");

const ownerOnly = require("../middleware/ownerMiddleware");

router.post(
    "/create",
    protect,
    ownerOnly,
    createPayment
);

router.post(
    "/pay/:id",
    protect,
    payRent
);

router.get(
    "/my-payments",
    protect,
    getMyPayments
);

router.get(
    "/pg/:pgId",
    protect,
    ownerOnly,
    getPGPayments
);

module.exports = router;