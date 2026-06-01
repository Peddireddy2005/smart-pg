const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  let token;
  console.log(`[AUTH] ${req.method} ${req.url}`);

  if (req.headers.authorization?.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        console.warn("[AUTH] Token valid but user not found:", decoded.id);
        return res.status(401).json({ message: "User not found" });
      }
      console.log("[AUTH] Authenticated:", req.user.email, "| Role:", req.user.role);
      next();
    } catch (err) {
      console.error("[AUTH] Token error:", err.message);
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  } else {
    console.warn("[AUTH] No token provided for:", req.url);
    return res.status(401).json({ message: "No token provided" });
  }
};

module.exports = { protect };