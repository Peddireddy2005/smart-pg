const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const sanitizeRequest = require("./middleware/sanitize");

const logger = require("./config/logger");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const { apiLimiter } = require("./middleware/rateLimiter");
const { razorpayWebhook } = require("./controllers/paymentController");

const app = express();
app.set("trust proxy", 1); // correct client IPs / rate limiting behind a reverse proxy (Render, Nginx, etc.)

// --- Razorpay webhook -------------------------------------------------------
// Registered BEFORE the global JSON parser below, with its own raw body
// parser, so the HMAC signature can be verified against the exact bytes
// Razorpay sent. Any other request simply falls through to the next
// matching middleware/route as usual.
app.post(
  "/api/payments/webhook",
  express.raw({ type: "application/json" }),
  razorpayWebhook
);

// --- Core security & utility middleware -------------------------------------
app.use(helmet());
app.use(compression());

const allowedOrigins = (process.env.CLIENT_URLS || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      logger.warn(`[CORS] Blocked origin: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(sanitizeRequest); // strips keys starting with `$` or containing `.` to prevent NoSQL injection

if (process.env.NODE_ENV !== "test") {
  app.use(
    morgan(process.env.NODE_ENV === "production" ? "combined" : "dev", {
      stream: { write: (msg) => logger.info(msg.trim()) },
    })
  );
}

app.use("/api", apiLimiter);

// --- Health check (used by uptime monitors / container orchestrators) ------
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// --- Routes ------------------------------------------------------------------
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/pg", require("./routes/pgRoutes"));
app.use("/api/rooms", require("./routes/roomRoutes"));
app.use("/api/payments", require("./routes/paymentRoutes"));
app.use("/api/complaints", require("./routes/complaintRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/reviews", require("./routes/reviewRoutes"));
app.use("/api/upload", require("./routes/uploadRoutes"));

app.get("/", (req, res) => res.send("Smart PG Server Running ✅"));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
