const sanitizeInPlace = (obj) => {
  if (!obj || typeof obj !== "object") return;
  for (const key of Object.keys(obj)) {
    if (key.startsWith("$") || key.includes(".")) {
      delete obj[key];
      continue;
    }
    const value = obj[key];
    if (value && typeof value === "object") {
      sanitizeInPlace(value);
    }
  }
};

const sanitizeRequest = (req, res, next) => {
  sanitizeInPlace(req.body);
  sanitizeInPlace(req.params);
  sanitizeInPlace(req.query);
  next();
};

module.exports = sanitizeRequest;
