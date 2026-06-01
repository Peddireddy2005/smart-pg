const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

const app = express();

app.use(cors({
  origin: ["http://localhost:5173", "https://smart-pg-lake.vercel.app"],
  credentials: true,
}));

app.use(express.json());

// Log every incoming request
app.use((req, res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.url}`, req.body && Object.keys(req.body).length ? req.body : "");
  next();
});

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/pg", require("./routes/pgRoutes"));
app.use("/api/rooms", require("./routes/roomRoutes"));
app.use("/api/payments", require("./routes/paymentRoutes"));
app.use("/api/complaints", require("./routes/complaintRoutes"));

app.get("/", (req, res) => {
  console.log("[SERVER] Health check hit");
  res.send("Server Running");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`[SERVER] Running on port ${PORT}`));