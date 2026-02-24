require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");

const app = express();


/* =======================
   Middleware
======================= */
app.use(cors({
  origin: "*", // change to frontend URL in production
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


/* =======================
   Static folder
======================= */
app.use("/uploads", express.static(path.join(__dirname, "uploads")));


/* =======================
   Routes
======================= */
const userRoutes = require("./routes/user");
const videoRoutes = require("./routes/video");
const notificationRoutes = require("./routes/notification");

app.use("/api/users", userRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api/notifications", notificationRoutes);


/* =======================
   Test Route
======================= */
app.get("/", (req, res) => {

  res.status(200).json({
    success: true,
    message: "🚀 SkillTrack Backend Running Successfully"
  });

});


/* =======================
   404 Handler
======================= */
app.use((req, res) => {

  res.status(404).json({
    success: false,
    message: "Route not found"
  });

});


/* =======================
   Error Handler
======================= */
app.use((err, req, res, next) => {

  console.error("❌ Server Error:", err.stack);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error"
  });

});


/* =======================
   MongoDB + Server Start
======================= */
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;


async function startServer() {

  try {

    if (!MONGO_URI) {
      throw new Error("MONGO_URI not found in .env");
    }

    await mongoose.connect(MONGO_URI);

    console.log("✅ MongoDB connected successfully");

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });

  } catch (err) {

    console.error("❌ Failed to start server:", err.message);
    process.exit(1);

  }

}

startServer();