const jwt = require("jsonwebtoken");
const User = require("../models/User");
const logger = require("../config/logger");

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        logger.warn(`[AUTH] Token valid but user not found: ${decoded.id}`);
        return res.status(401).json({ message: "User not found" });
      }
      next();
    } catch (err) {
      logger.warn(`[AUTH] Token error: ${err.message}`);
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  } else {
    return res.status(401).json({ message: "No token provided" });
  }
};

const optionalAuth = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer")) return next();
  try {
    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");
  } catch {
    // ignore invalid token for optional auth
  }
  next();
};

module.exports = { protect, optionalAuth };
