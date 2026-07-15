const Review = require("../models/Review");
const PG = require("../models/PG");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");

const recalcPGRatings = async (pgId) => {
  const reviews = await Review.find({ pg: pgId });
  const ratingsCount = reviews.length;
  const ratingsAverage = ratingsCount
    ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / ratingsCount) * 10) / 10
    : 0;
  await PG.findByIdAndUpdate(pgId, { ratingsAverage, ratingsCount });
};

const getPGReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ pg: req.params.pgId })
    .populate("resident", "name photoUrl")
    .sort({ createdAt: -1 });
  res.json(reviews);
});

// Creates the resident's review, or updates it if they've already reviewed this PG.
const upsertReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  const pg = await PG.findById(req.params.pgId);
  if (!pg) throw new AppError("PG not found", 404);

  const review = await Review.findOneAndUpdate(
    { pg: req.params.pgId, resident: req.user._id },
    { rating, comment },
    { new: true, upsert: true, runValidators: true }
  );

  await recalcPGRatings(req.params.pgId);
  res.status(201).json(review);
});

const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw new AppError("Review not found", 404);
  if (review.resident.toString() !== req.user._id.toString()) throw new AppError("Not authorized", 403);

  const pgId = review.pg;
  await review.deleteOne();
  await recalcPGRatings(pgId);

  res.json({ message: "Review deleted" });
});

module.exports = { getPGReviews, upsertReview, deleteReview };
