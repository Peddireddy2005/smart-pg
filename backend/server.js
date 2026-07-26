const dotenv = require("dotenv");
dotenv.config();

const { initSentry, Sentry, isConfigured } = require("./config/sentry");
initSentry();

const app = require("./app");
const connectDB = require("./config/db");
const logger = require("./config/logger");
const { initCronJobs } = require("./utils/cron");

connectDB();

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => logger.info(`[SERVER] Running on port ${PORT}`));

initCronJobs();

process.on("unhandledRejection", (err) => {
  logger.error(`[UNHANDLED REJECTION] ${err.message}`);
  if (isConfigured()) Sentry.captureException(err);
});

process.on("uncaughtException", (err) => {
  logger.error(`[UNCAUGHT EXCEPTION] ${err.message}`);
  if (isConfigured()) Sentry.captureException(err);
});

process.on("SIGTERM", () => {
  logger.info("[SERVER] SIGTERM received, shutting down gracefully");
  server.close(() => process.exit(0));
});