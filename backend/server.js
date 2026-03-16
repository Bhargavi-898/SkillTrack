require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");
const noteRoutes=require("./routes/notes");

const app = express();

/* =======================
   Create HTTP Server
======================= */
const server = http.createServer(app);

/* =======================
   Socket.IO Setup
======================= */
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// When user connects
io.on("connection", (socket) => {

  console.log("🔌 User connected:", socket.id);

  // Join video room
  socket.on("joinVideo", (videoId) => {
    socket.join(videoId);
    console.log(`User joined video room: ${videoId}`);
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected");
  });

});

// Make io available in routes
app.set("io", io);


/* =======================
   Middleware
======================= */
app.use(cors({
  origin: "*",
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
app.use("/api/notes",noteRoutes);

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

    // IMPORTANT: use server.listen NOT app.listen
    server.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });

  } catch (err) {

    console.error("❌ Failed to start server:", err.message);
    process.exit(1);

  }

}

startServer();