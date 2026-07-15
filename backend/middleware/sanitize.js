// express-mongo-sanitize reassigns `req.query`, which Express 5 exposes as a
// getter-only property — that throws at runtime. This does the same job
// (stripping keys that start with `$` or contain `.` to prevent NoSQL
// operator injection) by mutating objects in place instead.
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
