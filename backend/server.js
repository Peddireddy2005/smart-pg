const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

const app = express();

app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://smart-pg-lake.vercel.app",
  ],
  credentials: true,
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Log every request
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/pg", require("./routes/pgRoutes"));
app.use("/api/rooms", require("./routes/roomRoutes"));
app.use("/api/payments", require("./routes/paymentRoutes"));
app.use("/api/complaints", require("./routes/complaintRoutes"));

app.get("/", (req, res) => res.send("Smart PG Server Running ✅"));

// Global error handler
app.use((err, req, res, next) => {
  console.error("[GLOBAL ERROR]", err.message);
  res.status(500).json({ message: "Internal server error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`[SERVER] Running on port ${PORT}`));