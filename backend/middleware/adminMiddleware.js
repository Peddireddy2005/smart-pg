const logger = require("../config/logger");

// Platform-level admin panel guard (see spec section 27, marked "Future").
const adminOnly = (req, res, next) => {
  if (req.user?.role === "admin") {
    return next();
  }
  logger.warn(`[ADMIN] Access denied for: ${req.user?.email} | Role: ${req.user?.role}`);
  res.status(403).json({ message: "Access denied: Admins only" });
};

module.exports = { adminOnly };
