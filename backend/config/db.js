const mongoose = require("mongoose");
const logger = require("./logger");

const connectDB = async () => {
  logger.info("[DB] Connecting to MongoDB...");
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    logger.info(`[DB] Connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error(`[DB] Connection FAILED: ${error.message}`);
    // Retry once after a short delay instead of crashing immediately —
    // useful in containerized environments where Mongo may start slightly later.
    setTimeout(() => {
      logger.info("[DB] Retrying connection...");
      mongoose
        .connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 })
        .catch((err) => {
          logger.error(`[DB] Retry FAILED: ${err.message}`);
          process.exit(1);
        });
    }, 5000);
  }
};

mongoose.connection.on("disconnected", () => {
  logger.warn("[DB] Disconnected from MongoDB");
});

module.exports = connectDB;
