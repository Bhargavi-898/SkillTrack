const Video = require("../models/video");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");

// Ensure uploads/videos directory exists
const uploadPath = path.join(__dirname, "../../uploads/videos");
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadPath),
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname.replace(/\s+/g, "_");
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["video/mp4", "video/webm", "video/ogg"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only mp4, webm, and ogg are allowed."));
  }
};

exports.upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 1000 * 1000 * 1000 }, // 1GB
});

// Upload Video Controller
exports.uploadVideo = async (req, res) => {
  try {
    const { title, description, category, uploadedBy } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "No video file uploaded." });
    }

    if (!title || !category || !uploadedBy) {
      return res.status(400).json({ message: "Title, category, and user are required." });
    }

    const video = await Video.create({
      title,
      description: description || "",
      category,
      uploadedBy: new mongoose.Types.ObjectId(uploadedBy),
      url: `/uploads/videos/${req.file.filename}`,
    });

    res.status(201).json({ message: "✅ Video uploaded successfully", video });
  } catch (error) {
    console.error("❌ Upload Error:", error);
    res.status(500).json({ error: "Error uploading video", message: error.message });
  }
};


// Get All Videos
exports.getAllVideos = async (req, res) => {
  try {
    const videos = await Video.find().populate("uploadedBy", "name email branch year profilePhoto");
    res.json(videos);
  } catch (error) {
    console.error("❌ Fetch Videos Error:", error);
    res.status(500).json({ error: "Error fetching videos", message: error.message });
  }
};
