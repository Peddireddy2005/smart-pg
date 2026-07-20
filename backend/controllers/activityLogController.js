const ActivityLog = require("../models/ActivityLog");
const asyncHandler = require("../utils/asyncHandler");

const getOwnerActivityLogs = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Number(req.query.limit) || 40);

  const filter = { owner: req.user._id };
  const [logs, total] = await Promise.all([
    ActivityLog.find(filter)
      .populate("actor", "name email role")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    ActivityLog.countDocuments(filter),
  ]);

  res.json({ logs, page, totalPages: Math.max(1, Math.ceil(total / limit)), total });
});

module.exports = { getOwnerActivityLogs };
