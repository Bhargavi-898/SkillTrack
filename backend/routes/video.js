const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const Video = require("../models/Video"); // ✅ FIXED
const User = require("../models/User");   // ✅ FIXED

const upload = require("../middlewares/upload");
const auth = require("../middlewares/auth");
const Notification = require("../models/Notification");

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

  try {

    const video = await Video.findById(req.params.id);

    if (!video) {
      return res.status(404).json({
        message: "Video not found"
      });
    }

    const userId = (req.user.userId || req.user._id).toString();

    let liked = false;

    // If already liked → remove like
    if (video.likes.includes(userId)) {

      video.likes.pull(userId);
      liked = false;

    } else {

      // Add like and remove dislike
      video.dislikes.pull(userId);
      video.likes.push(userId);
      liked = true;

      // ✅ Create notification ONLY if liking (not unliking)
      // and not liking own video
      if (video.uploadedBy.toString() !== userId) {

        await Notification.create({

          receiver: video.uploadedBy,
          sender: userId,
          video: video._id,
          type: "like",
          message: "Someone liked your video"

        });

        console.log("✅ Notification created");

      }

    }

    await video.save();

    // ✅ Return liked status for frontend
    res.json({

      liked: liked,
      totalLikes: video.likes.length,
      totalDislikes: video.dislikes.length

    });

  } catch (err) {

    console.error("Toggle like error:", err.message);

    res.status(500).json({
      message: "Server error"
    });

  }

});
router.get("/:id/comments", async (req, res) => {

  try {

    const video = await Video.findById(req.params.id)
      .populate("reviews.user", "name");

    if (!video) {
      return res.status(404).json({
        message: "Video not found"
      });
    }

    res.status(200).json(video.reviews);

  } catch (error) {

    console.error("Fetch comments error:", error);

    res.status(500).json({
      message: "Failed to fetch comments"
    });

  }

});
/* =========================
   TOGGLE DISLIKE
========================= */
router.post("/toggle-dislike/:id", auth, async (req, res) => {
  try {

    const video = await Video.findById(req.params.id);

    if (!video) {
      return res.status(404).json({
        message: "Video not found"
      });
    }

    const userId = (req.user.userId || req.user._id).toString();

    let disliked = false;

    if (video.dislikes.includes(userId)) {

      video.dislikes.pull(userId);

    } else {

      video.likes.pull(userId);
      video.dislikes.push(userId);
      disliked = true;

      // 🔔 Create notification when newly disliked
      if (video.uploadedBy.toString() !== userId) {

        await Notification.create({

          receiver: video.uploadedBy,
          sender: userId,
          video: video._id,
          type: "dislike",
          message: "Someone disliked your video"

        });

        console.log("✅ Dislike notification created");

      }

    }

    await video.save();

    res.json({
      disliked,
      totalLikes: video.likes.length,
      totalDislikes: video.dislikes.length
    });

  } catch (err) {

    console.error("Dislike error:", err);

    res.status(500).json({
      message: "Server error"
    });

  }
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

router.post("/:id/comment", auth, async (req, res) => {
  try {

    const videoId = req.params.id;
    const userId = req.user.userId || req.user._id;
    const { text } = req.body;

    if (!text || text.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Comment text is required"
      });
    }

    // 🔍 Find video + uploader
    const video = await Video.findById(videoId).populate("uploadedBy", "name");

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found"
      });
    }

    // 🔍 Find commenting user
    const user = await User.findById(userId).select("name");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // ✅ Create comment
    const newReview = {
      user: userId,
      rating: 5,
      comment: text.trim(),
      createdAt: new Date()
    };

    video.reviews.push(newReview);

    await video.save();

    const io = req.app.get("io");

    // 🔥 Real-time comment display
    io.emit("newComment", {
      videoId: videoId,
      username: user.name,
      text: text.trim(),
      createdAt: newReview.createdAt
    });

    // 🔔 Send notification ONLY to video owner
    // 🔔 Save notification for video owner
if (video.uploadedBy._id.toString() !== userId.toString()) {

  await Notification.create({
    receiver: video.uploadedBy._id,
    sender: userId,
    video: videoId,
    type: "comment",
    message: `${user.name} commented on your video`
  });

  console.log("✅ Comment notification created");

}

    res.status(201).json({
      success: true,
      message: "Comment added successfully"
    });

  } catch (error) {

    console.error("Comment error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to add comment"
    });

  }
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