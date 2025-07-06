// routes/videos.js
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const verifyToken = require("../middlewares/auth");
const Video = require("../models/video");
const User = require("../models/user");
const upload = require("../middlewares/upload");
const auth = require("../middlewares/auth");

function formatVideo(video, protocol, host) {
  const videoUrl = video.url?.startsWith("http")
    ? video.url
    : `${protocol}://${host}/${video.url?.replace(/^\/+/g, "")}`;

  const uploader = video.uploadedBy || {};
  const uploaderPhoto = uploader.profilePhoto
    ? uploader.profilePhoto.startsWith("http")
      ? uploader.profilePhoto
      : `${protocol}://${host}/${uploader.profilePhoto.replace(/^\/+/g, "")}`
    : null;

  return {
    _id: video._id,
    title: video.title,
    description: video.description,
    category: video.category,
    url: videoUrl,
    createdAt: video.createdAt,
    uploadedBy: uploader && uploader._id
      ? {
          _id: uploader._id,
          name: uploader.name,
          email: uploader.email,
          branch: uploader.branch,
          year: uploader.year,
          profilePhoto: uploaderPhoto,
        }
      : null,
    likes: video.likes || [],
    dislikes: video.dislikes || [],
    views: video.views || 0
  };
}

router.post("/toggle-dislike/:id", verifyToken, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ message: "Video not found" });

    const userId = req.user._id.toString();
    let disliked;

    if (video.likes.includes(userId)) {
      video.likes.pull(userId);
    }

    if (video.dislikes?.includes(userId)) {
      video.dislikes.pull(userId);
      disliked = false;
    } else {
      video.dislikes = video.dislikes || [];
      video.dislikes.push(userId);
      disliked = true;
    }

    await video.save();

    res.json({
      message: "Dislike status updated",
      totalDislikes: video.dislikes.length,
      totalLikes: video.likes.length,
      disliked: disliked
    });
  } catch (err) {
    res.status(500).json({ message: "Error toggling dislike", error: err.message });
  }
});

router.post("/upload", verifyToken, upload.single("video"), async (req, res) => {
  try {
    const { title, description, category } = req.body;
    const uploadedBy = req.user._id; // ✅ from token

    if (!title || !description || !category) {
      return res.status(400).json({ message: "All fields are required." });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Video file is required." });
    }

    const newVideo = new Video({
      title: title.trim(),
      description: description.trim(),
      category: category.trim(),
      uploadedBy, // ✅ trusted user
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

router.get("/", async (req, res) => {
  try {
    let videos = await Video.find()
      .populate("uploadedBy", "name profilePhoto email branch year")
      .sort({ createdAt: -1 })
      .lean();

    const host = req.get("host");
    const protocol = req.protocol;

    videos = videos.map((video) => formatVideo(video, protocol, host));

    res.status(200).json(videos);
  } catch (err) {
    console.error("❌ Fetch error:", err.message);
    res.status(500).json({ error: "Server error: " + err.message });
  }
});

router.get("/user/:id", async (req, res) => {
  try {
    const { id } = req.params;

    let videos = await Video.find({ uploadedBy: id })
      .populate("uploadedBy", "name profilePhoto email branch year")
      .sort({ createdAt: -1 })
      .lean();

    if (!videos || videos.length === 0) {
      return res.status(404).json({ message: "No videos found for this user." });
    }

    const host = req.get("host");
    const protocol = req.protocol;

    videos = videos.map((video) => formatVideo(video, protocol, host));

    res.status(200).json(videos);
  } catch (err) {
    console.error("❌ User video fetch error:", err.message);
    res.status(500).json({ error: "Server error: " + err.message });
  }
});

router.get("/my", auth, async (req, res) => {
  try {
    const userId = req.user._id;

    let videos = await Video.find({ uploadedBy: userId })
      .populate("uploadedBy", "name profilePhoto email branch year")
      .sort({ createdAt: -1 })
      .lean();

    const host = req.get("host");
    const protocol = req.protocol;

    videos = videos.map((video) => formatVideo(video, protocol, host));

    res.status(200).json(videos);
  } catch (err) {
    console.error("❌ My video fetch error:", err.message);
    res.status(500).json({ error: "Server error: " + err.message });
  }
});

router.post("/toggle-like/:id", verifyToken, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ message: "Video not found" });

    const userId = req.user._id.toString();
    let liked;

    if (video.dislikes.includes(userId)) {
      video.dislikes.pull(userId);
    }

    if (video.likes.includes(userId)) {
      video.likes.pull(userId);
      liked = false;
    } else {
      video.likes.push(userId);
      liked = true;
    }

    await video.save();

    res.json({
      message: "Like status updated",
      totalLikes: video.likes.length,
      totalDislikes: video.dislikes.length,
      liked: liked
    });
  } catch (err) {
    res.status(500).json({ message: "Error toggling like", error: err.message });
  }
});

router.post("/view/:id", verifyToken, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ error: "Video not found" });

    const userId = req.user._id;

    if (!video.viewedBy.includes(userId)) {
      video.views += 1;
      video.viewedBy.push(userId);
      await video.save();
    }

    res.json({ updatedViews: video.views });
  } catch (err) {
    res.status(500).json({ error: "Server error: " + err.message });
  }
});


router.delete("/:id", auth, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ message: "Video not found" });

    if (video.uploadedBy.toString() !== req.user._id) {
      return res.status(403).json({ message: "Forbidden: You can only delete your own videos." });
    }

    const relativeVideoPath = video.url.replace(/^\/+/g, "");
    const videoPath = path.resolve(__dirname, "..", relativeVideoPath);

    if (fs.existsSync(videoPath)) {
      fs.unlinkSync(videoPath);
    }

    await Video.findByIdAndDelete(req.params.id);

    res.json({ message: "✅ Video deleted successfully" });
  } catch (err) {
    console.error("❌ Delete error:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});





module.exports = router;