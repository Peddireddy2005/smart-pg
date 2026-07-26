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
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Number(req.query.limit) || 20);

  const filter = { pg: req.params.pgId };
  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .populate("resident", "name photoUrl")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Review.countDocuments(filter),
  ]);

  res.json({ reviews, page, totalPages: Math.max(1, Math.ceil(total / limit)), total });
});

const upsertReview = asyncHandler(async (req, res) => {
  const { rating, comment, photos } = req.body;
  const pg = await PG.findById(req.params.pgId);
  if (!pg) throw new AppError("PG not found", 404);

  const review = await Review.findOneAndUpdate(
    { pg: req.params.pgId, resident: req.user._id },
    { rating, comment, ...(photos !== undefined && { photos }) },
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

const replyToReview = asyncHandler(async (req, res) => {
  const { reply } = req.body;
  const review = await Review.findById(req.params.id).populate("pg");
  if (!review) throw new AppError("Review not found", 404);
  if (review.pg.owner.toString() !== req.user._id.toString()) throw new AppError("Not authorized", 403);

  review.ownerReply = reply;
  await review.save();
  res.json(review);
});

module.exports = { getPGReviews, upsertReview, deleteReview, replyToReview };