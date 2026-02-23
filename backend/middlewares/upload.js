const multer = require("multer");
const path = require("path");
const fs = require("fs");

/* =========================
   Create uploads/videos folder
========================= */

const videoDir = path.join(__dirname, "..", "uploads", "videos");

if (!fs.existsSync(videoDir)) {
  fs.mkdirSync(videoDir, { recursive: true });
}

/* =========================
   Storage Config (LOCAL)
========================= */

const storage = multer.diskStorage({

  destination: function (req, file, cb) {
    cb(null, videoDir);
  },

  filename: function (req, file, cb) {

    const uniqueName =
      Date.now() + "-" + Math.round(Math.random() * 1e9);

    const ext = path.extname(file.originalname);

    cb(null, uniqueName + ext);
  }

});

/* =========================
   Allowed Video Types
========================= */

const allowedTypes = [
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/mpeg",
  "video/x-matroska",
  "video/avi",
  "video/quicktime"
];

const fileFilter = (req, file, cb) => {

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("❌ Only video files allowed"), false);
  }

};

/* =========================
   Multer Upload Config
========================= */

const upload = multer({

  storage,

  fileFilter,

  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB
  }

});

module.exports = upload;