require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");

const app = express();

/* =======================
   Middleware
======================= */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* =======================
   Static folder for uploads
======================= */
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* =======================
   MongoDB Connection
======================= */
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ MONGO_URI not found in .env file");
  process.exit(1);
}

mongoose.connect(MONGO_URI)
.then(() => console.log("✅ MongoDB connected successfully"))
.catch(err => {
  console.error("❌ MongoDB connection failed:", err.message);
  process.exit(1);
});

/* =======================
   Routes
======================= */
const userRoutes = require("./routes/user");
const videoRoutes = require("./routes/video");

app.use("/api/users", userRoutes);
app.use("/api/videos", videoRoutes);

/* =======================
   Test Route
======================= */
app.get("/", (req, res) => {
  res.send("🚀 SkillTrack Backend Running Successfully");
});

/* =======================
   Error Handler
======================= */
app.use((err, req, res, next) => {
  console.error(err.stack);

  res.status(500).json({
    success: false,
    message: err.message || "Server Error"
  });
});

/* =======================
   Start Server
======================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});