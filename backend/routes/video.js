const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const Video = require("../models/Video"); // ✅ FIXED
const User = require("../models/User");   // ✅ FIXED

const upload = require("../middlewares/upload");
const auth = require("../middlewares/auth");



/* =========================
   Helper: Format Video
========================= */
function formatVideo(video) {

  const uploader = video.uploadedBy || {};

  return {

    _id: video._id,
    title: video.title,
    description: video.description,
    category: video.category,
    url: video.url,
    createdAt: video.createdAt,

    uploadedBy: uploader && uploader._id
      ? {
          _id: uploader._id,
          name: uploader.name,
          email: uploader.email,
          branch: uploader.branch,
          year: uploader.year,
          profilePhoto: uploader.profilePhoto || null,
        }
      : null,

    likes: video.likes || [],
    dislikes: video.dislikes || [],
    views: video.views || 0,

  };

}


/* =========================
   UPLOAD VIDEO
========================= */
router.post("/upload", auth, upload.single("video"), async (req, res) => {

  try {

    const { title, description, category } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json({
        message: "All fields are required"
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: "Video file is required"
      });
    }

    const userId = req.user.userId || req.user._id;

    const newVideo = new Video({

      title: title.trim(),
      description: description.trim(),
      category: category.trim(),

      uploadedBy: userId,

      url: req.file.path,

      public_id: req.file.filename || null

    });

    await newVideo.save();

    res.status(201).json({

      message: "Video uploaded successfully",
      video: newVideo

    });

  } catch (err) {

    console.error("Upload Error:", err.message);

    res.status(500).json({

      message: "Upload failed",
      error: err.message

    });

  }

});


/* =========================
   GET ALL VIDEOS
========================= */
router.get("/", async (req, res) => {

  try {

    const videos = await Video.find()
      .populate("uploadedBy", "name profilePhoto email branch year")
      .sort({ createdAt: -1 })
      .lean();

    res.json(videos.map(formatVideo));

  } catch (err) {

    res.status(500).json({
      message: err.message
    });

  }

});


/* =========================
   GET USER VIDEOS
========================= */
router.get("/user/:id", async (req, res) => {

  try {

    const videos = await Video.find({

      uploadedBy: req.params.id

    })
      .populate("uploadedBy", "name profilePhoto email branch year")
      .sort({ createdAt: -1 })
      .lean();

    res.json(videos.map(formatVideo));

  } catch (err) {

    res.status(500).json({
      message: err.message
    });

  }

});


/* =========================
   GET MY VIDEOS
========================= */
router.get("/my", auth, async (req, res) => {

  try {

    const userId = req.user.userId || req.user._id;

    const videos = await Video.find({

      uploadedBy: userId

    })
      .populate("uploadedBy", "name profilePhoto email branch year")
      .sort({ createdAt: -1 })
      .lean();

    res.json(videos.map(formatVideo));

  } catch (err) {

    res.status(500).json({
      message: err.message
    });

  }

});


/* =========================
   TOGGLE LIKE
========================= */
router.post("/toggle-like/:id", auth, async (req, res) => {

  const video = await Video.findById(req.params.id);

  if (!video) {
    return res.status(404).json({
      message: "Video not found"
    });
  }

  const userId = (req.user.userId || req.user._id).toString();

  if (video.likes.includes(userId)) {

    video.likes.pull(userId);

  } else {

    video.dislikes.pull(userId);
    video.likes.push(userId);

  }

  await video.save();

  res.json({

    totalLikes: video.likes.length,
    totalDislikes: video.dislikes.length

  });

});


/* =========================
   TOGGLE DISLIKE
========================= */
router.post("/toggle-dislike/:id", auth, async (req, res) => {

  const video = await Video.findById(req.params.id);

  if (!video) {
    return res.status(404).json({
      message: "Video not found"
    });
  }

  const userId = (req.user.userId || req.user._id).toString();

  if (video.dislikes.includes(userId)) {

    video.dislikes.pull(userId);

  } else {

    video.likes.pull(userId);
    video.dislikes.push(userId);

  }

  await video.save();

  res.json({

    totalLikes: video.likes.length,
    totalDislikes: video.dislikes.length

  });

});


/* =========================
   VIEW COUNT
========================= */
router.post("/view/:id", auth, async (req, res) => {

  const video = await Video.findById(req.params.id);

  if (!video) {
    return res.status(404).json({
      message: "Video not found"
    });
  }

  const userId = req.user.userId || req.user._id;

  if (!video.viewedBy.includes(userId)) {

    video.views += 1;
    video.viewedBy.push(userId);

    await video.save();

  }

  res.json({

    views: video.views

  });

});


/* =========================
   DELETE VIDEO
========================= */
router.delete("/:id", auth, async (req, res) => {

  const video = await Video.findById(req.params.id);

  if (!video) {
    return res.status(404).json({
      message: "Video not found"
    });
  }

  const userId = req.user.userId || req.user._id;

  if (video.uploadedBy.toString() !== userId.toString()) {

    return res.status(403).json({
      message: "Unauthorized"
    });

  }

  if (video.public_id) {

    await cloudinary.uploader.destroy(
      video.public_id,
      { resource_type: "video" }
    );

  }

  await video.deleteOne();

  res.json({

    message: "Video deleted successfully"

  });

});


module.exports = router;