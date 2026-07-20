const express = require("express");
const router = express.Router();
const { getPGReviews, upsertReview, deleteReview, replyToReview } = require("../controllers/reviewController");
const { protect } = require("../middleware/authMiddleware");
const { ownerOnly } = require("../middleware/ownerMiddleware");
const validate = require("../middleware/validate");
const { reviewValidator } = require("../utils/validators");

router.get("/pg/:pgId", getPGReviews);
router.put("/pg/:pgId", protect, reviewValidator, validate, upsertReview);
router.delete("/:id", protect, deleteReview);
router.put("/:id/reply", protect, ownerOnly, replyToReview);

module.exports = router;
