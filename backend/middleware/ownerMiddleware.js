const ownerOnly = (req, res, next) => {
  if (req.user?.role === "owner") {
    console.log("[OWNER] Access granted to:", req.user.email);
    return next();
  }
  console.warn("[OWNER] Access denied for:", req.user?.email, "| Role:", req.user?.role);
  res.status(403).json({ message: "Access denied: Owners only" });
};

module.exports = { ownerOnly };