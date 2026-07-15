const logger = require("../config/logger");

const ownerOnly = (req, res, next) => {
  if (req.user?.role === "owner") {
    return next();
  }
  logger.warn(`[OWNER] Access denied for: ${req.user?.email} | Role: ${req.user?.role}`);
  res.status(403).json({ message: "Access denied: Owners only" });
};

module.exports = { ownerOnly };
