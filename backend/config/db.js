const mongoose = require("mongoose");

const connectDB = async () => {
  console.log("[DB] Attempting MongoDB connection...");
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`[DB] MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("[DB] Connection FAILED:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;