const express = require("express");
const router = express.Router();
const Video = require("../models/video");
const User = require("../models/user");
const upload = require("../middlewares/upload");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const verifyToken = require("../middlewares/auth");



/* =========================================================
   ADD COMMENT (secure version)
========================================================= */
router.post("/:id/comments", verifyToken, async (req, res) => {
  try {

    const { text } = req.body;

    if (!text)
      return res.status(400).json({ message: "Comment text required" });

    const video = await Video.findById(req.params.id);

    if (!video)
      return res.status(404).json({ message: "Video not found" });

    video.comments.push({
      user: req.user.id,
      text
    });

    await video.save();

    res.status(201).json({
      message: "Comment added successfully"
    });

  } catch (err) {

    console.error("Comment error:", err);

    res.status(500).json({
      message: "Server error"
    });
  }
});



/* =========================================================
   GET COMMENTS
========================================================= */
router.get("/:id/comments", async (req, res) => {

  try {

    const video = await Video.findById(req.params.id)
      .populate("comments.user", "name profilePhoto");

    if (!video)
      return res.status(404).json({
        message: "Video not found"
      });

    res.json(video.comments);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: "Server error"
    });
  }
});



/* =========================================================
   UPLOAD VIDEO (LOCAL STORAGE VERSION)
========================================================= */
router.post("/upload", upload.single("video"), async (req, res) => {

  try {

    const { title, description, category, uploadedBy } = req.body;

    /* Validate fields */

    if (!title || !description || !category || !uploadedBy)
      return res.status(400).json({
        message: "All fields required"
      });

    if (!req.file)
      return res.status(400).json({
        message: "Video file required"
      });


    /* Validate user */

    if (!mongoose.Types.ObjectId.isValid(uploadedBy))
      return res.status(400).json({
        message: "Invalid user ID"
      });

    const user = await User.findById(uploadedBy);

    if (!user)
      return res.status(404).json({
        message: "User not found"
      });


    /* Save video path */

    const videoPath = `/uploads/videos/${req.file.filename}`;


    const newVideo = new Video({

      title: title.trim(),
      description: description.trim(),
      category: category.trim(),

      uploadedBy,

      url: videoPath

    });

    await newVideo.save();


    res.status(201).json({

      message: "Video uploaded successfully",

      video: {
        ...newVideo._doc,
        url: `${req.protocol}://${req.get("host")}${videoPath}`
      }

    });

  }
  catch (err) {

    console.error("Upload error:", err);

    res.status(500).json({

      message: "Upload failed",

      error: err.message

    });

  }

});



/* =========================================================
   GET ALL VIDEOS
========================================================= */
router.get("/", async (req, res) => {

  try {

    const { search } = req.query;

    const query = search
      ? { title: { $regex: search, $options: "i" } }
      : {};

    const videos = await Video.find(query)

      .populate("uploadedBy", "name branch year email profilePhoto")

      .sort({ createdAt: -1 });


    const formatted = videos.map(video => ({

      ...video._doc,

      url: `${req.protocol}://${req.get("host")}${video.url}`,

      uploadedBy: {
        ...video.uploadedBy._doc,
        profilePhoto:
          `${req.protocol}://${req.get("host")}/${video.uploadedBy.profilePhoto}`
      }

    }));


    res.json(formatted);

  }
  catch (err) {

    console.error(err);

    res.status(500).json({
      message: "Server error"
    });

  }

});



/* =========================================================
   GET USER VIDEOS
========================================================= */
router.get("/user/:id", async (req, res) => {

  try {

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({
        message: "Invalid user ID"
      });


    const videos = await Video.find({
      uploadedBy: id
    })

      .populate("uploadedBy", "name branch year email profilePhoto")

      .sort({ createdAt: -1 });


    const formatted = videos.map(video => ({

      ...video._doc,

      url: `${req.protocol}://${req.get("host")}${video.url}`,

      uploadedBy: {
        ...video.uploadedBy._doc,
        profilePhoto:
          `${req.protocol}://${req.get("host")}/${video.uploadedBy.profilePhoto}`
      }

    }));


    res.json(formatted);

  }
  catch (err) {

    console.error(err);

    res.status(500).json({
      message: "Server error"
    });

  }

});



/* =========================================================
   LIKE / UNLIKE
========================================================= */
router.post("/toggle-like/:id", verifyToken, async (req, res) => {

  try {

    const userId = req.user.id;

    const video = await Video.findById(req.params.id);

    if (!video)
      return res.status(404).json({
        message: "Video not found"
      });


    const index = video.likes.indexOf(userId);

    if (index === -1)
      video.likes.push(userId);
    else
      video.likes.splice(index, 1);


    await video.save();

    res.json({
      likes: video.likes.length
    });

  }
  catch (err) {

    console.error(err);

    res.status(500).json({
      message: "Server error"
    });

  }

});



/* =========================================================
   DELETE VIDEO
========================================================= */
router.delete("/:id", async (req, res) => {

  try {

    const video = await Video.findById(req.params.id);

    if (!video)
      return res.status(404).json({
        message: "Video not found"
      });


    const filePath = path.join(__dirname, "..", video.url);

    if (fs.existsSync(filePath))
      fs.unlinkSync(filePath);


    await Video.findByIdAndDelete(req.params.id);

    res.json({
      message: "Video deleted successfully"
    });

  }
  catch (err) {

    console.error(err);

    res.status(500).json({
      message: "Server error"
    });

  }

});


module.exports = router;