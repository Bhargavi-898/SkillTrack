const express = require("express");
const router = express.Router();
const Video = require("../models/video");
const User = require("../models/user");
const upload = require("../middlewares/upload");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const verifyToken = require("../middlewares/auth");

// Add a comment to a video
router.post("/:id/comments", verifyToken, async (req, res) => {
  try {
    const { text } = req.body;
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ error: "Video not found" });

    video.comments.push({ user: req.user.id, text });
    await video.save();
    res.status(201).json({ message: "Comment added successfully" });
  } catch (err) {
    res.status(500).json({ error: "Server error while adding comment" });
  }
});

// Get all comments for a video (with user info)
router.get("/:id/comments", async (req, res) => {
  try {
    const video = await Video.findById(req.params.id).populate("comments.user", "name profilePhoto");
    if (!video) return res.status(404).json({ error: "Video not found" });

    res.json(video.comments);
  } catch (err) {
    res.status(500).json({ error: "Server error while fetching comments" });
  }
});

// ✅ Upload video
router.post("/upload", upload.single("video"), async (req, res) => {
  try {
    const { title, description, category, uploadedBy } = req.body;

    if (!title || !description || !category || !uploadedBy) {
      return res.status(400).json({ message: "All fields are required." });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Video file is required." });
    }

    if (!mongoose.Types.ObjectId.isValid(uploadedBy)) {
      return res.status(400).json({ message: "Invalid uploader ID." });
    }

    const user = await User.findById(uploadedBy);
    if (!user) {
      return res.status(404).json({ message: "Uploader not found." });
    }

    const newVideo = new Video({
      title: title.trim(),
      description: description.trim(),
      category: category.trim(),
      uploadedBy: new mongoose.Types.ObjectId(uploadedBy),
      url: `/uploads/videos/${req.file.filename}`,
    });

    await newVideo.save();

    res.status(201).json({
      message: "✅ Video uploaded successfully",
      video: {
        ...newVideo._doc,
        url: `http://localhost:3000/uploads/videos/${req.file.filename}`,
      },
    });
  } catch (err) {
    console.error("❌ Upload Error:", err.message);
    res.status(500).json({ message: "Upload failed", error: err.message });
  }
});

// ✅ Get all videos
router.get("/", async (req, res) => {
  try {
    const { search } = req.query;
    const query = search ? { title: { $regex: search, $options: "i" } } : {};

    const videos = await Video.find(query)
      .sort({ createdAt: -1 })
      .populate("uploadedBy", "name branch year email profilePhoto");

    const enriched = videos.map((video) => ({
      ...video._doc,
      url: `${req.protocol}://${req.get("host")}${video.url}`,
    }));

    res.json(enriched);
  } catch (err) {
    console.error("❌ Fetch Error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Get videos by user
router.get("/user/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID." });
    }

    const videos = await Video.find({ uploadedBy: id })
      .sort({ createdAt: -1 })
      .populate("uploadedBy", "name email branch year profilePhoto");

    const host = req.get("host");
    const protocol = req.protocol;

    const formatted = videos.map((video) => ({
      ...video._doc,
      url: `${protocol}://${host}/${video.url.replace(/^\/+/, "")}`,
      uploadedBy: {
        ...video.uploadedBy._doc,
        profilePhoto: `${protocol}://${host}/${video.uploadedBy.profilePhoto.replace(/^\/+/, "")}`,
      },
    }));

    res.json(formatted);
  } catch (err) {
    console.error("❌ User Video Fetch Error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Like / Unlike a video
router.post("/toggle-like/:id", verifyToken, async (req, res) => {
  try {
    const { userId } = req.body;
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ message: "Video not found." });

    const index = video.likes.indexOf(userId);
    if (index === -1) {
      video.likes.push(userId);
      await video.save();
      res.json({ message: "Liked", likes: video.likes.length });
    } else {
      video.likes.splice(index, 1);
      await video.save();
      res.json({ message: "Unliked", likes: video.likes.length });
    }
  } catch (err) {
    console.error("❌ Like error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Comment on a video
router.post("/:id/comment", async (req, res) => {
  try {
    const { userId, text } = req.body;

    if (!text || !userId) {
      return res.status(400).json({ message: "User and text required." });
    }

    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ message: "Video not found." });

    video.comments.push({ user: userId, text });
    await video.save();

    res.status(201).json({ message: "Comment added", comments: video.comments });
  } catch (err) {
    console.error("❌ Comment error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Add review
router.post("/:id/review", async (req, res) => {
  try {
    const { userId, rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be 1-5." });
    }

    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ message: "Video not found." });

    video.reviews.push({ user: userId, rating, comment });
    await video.save();

    res.status(201).json({ message: "Review submitted", reviews: video.reviews });
  } catch (err) {
    console.error("❌ Review error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Delete video
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const video = await Video.findById(id);
    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    const filePath = path.join(__dirname, "..", video.url);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await Video.findByIdAndDelete(id);
    res.json({ message: "✅ Video deleted successfully" });
  } catch (err) {
    console.error("❌ Delete Error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
