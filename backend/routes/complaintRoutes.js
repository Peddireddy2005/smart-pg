const express = require("express");

const router = express.Router();

const {
    createComplaint,
    getMyComplaints,
    getPGComplaints,
    updateComplaintStatus
} = require("../controllers/complaintController");

const protect = require("../middleware/authMiddleware");

const ownerOnly = require("../middleware/ownerMiddleware");

router.post(
    "/",
    protect,
    createComplaint
);

router.get(
    "/my-complaints",
    protect,
    getMyComplaints
);

router.get(
    "/pg/:pgId",
    protect,
    ownerOnly,
    getPGComplaints
);

router.put(
    "/:id",
    protect,
    ownerOnly,
    updateComplaintStatus
);

module.exports = router;