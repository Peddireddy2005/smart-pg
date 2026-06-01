const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  let token;
  console.log("[AUTH] protect middleware triggered for:", req.method, req.url);

  if (req.headers.authorization?.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      console.log("[AUTH] Token found, verifying...");

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("[AUTH] Token valid. User ID:", decoded.id);

      req.user = await User.findById(decoded.id).select("-password");
      if (!req.user) {
        console.warn("[AUTH] Token valid but user not found in DB:", decoded.id);
        return res.status(401).json({ message: "User not found" });
      }
      console.log("[AUTH] User authenticated:", req.user.email, "| Role:", req.user.role);
      next();
    } catch (err) {
      console.error("[AUTH] Token verification FAILED:", err.message);
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  } else {
    console.warn("[AUTH] No Bearer token in Authorization header");
    return res.status(401).json({ message: "No token provided" });
  }
};

module.exports = { protect };