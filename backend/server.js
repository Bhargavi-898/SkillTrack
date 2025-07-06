require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors());

// Optional: log all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Ensure /uploads/videos directory exists
const videoDir = path.join(__dirname, "uploads/videos");
if (!fs.existsSync(videoDir)) fs.mkdirSync(videoDir, { recursive: true });

// Serve static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Fix for mongoose warnings
mongoose.set("strictQuery", false);

mongoose
  .connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/skilltrack", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Routes
const userRoutes = require("./routes/user");
const videoRoutes = require("./routes/video");

app.use("/api/users", userRoutes);
app.use("/api/videos", videoRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ message: "Server error", error: err.message });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
