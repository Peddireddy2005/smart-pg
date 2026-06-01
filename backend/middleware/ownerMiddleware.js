const ownerOnly = (req, res, next) => {
  console.log("[OWNER MIDDLEWARE] Checking role for user:", req.user?.email, "| Role:", req.user?.role);
  if (req.user && req.user.role === "owner") {
    console.log("[OWNER MIDDLEWARE] Access granted");
    return next();
  }
  console.warn("[OWNER MIDDLEWARE] Access DENIED — not an owner");
  res.status(403).json({ message: "Access denied: Owners only" });
};

module.exports = { ownerOnly };