const express = require("express");
const router = express.Router();
const User = require("../models/user");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
const verifyToken = require("../middlewares/auth");
require("dotenv").config();
const bcrypt = require("bcryptjs"); // Add this at the top

const JWT_SECRET = process.env.JWT_SECRET || "defaultSecret";

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer config for profile photo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const safeName = (file.originalname || "file").replace(/\s+/g, "_");
    cb(null, `${Date.now()}-${safeName}`);
  },
});
const upload = multer({ storage });

/** Register */
router.post("/register", upload.single("profilePhoto"), async (req, res) => {
  try {
    let { name, branch, year, email, password } = req.body;

    if (!name || !branch || !year || !email || !password) {
      return res.status(400).json({ message: "Please fill all required fields" });
    }

    email = email.toLowerCase();

    if (!email.endsWith("@svecw.edu.in")) {
      return res.status(400).json({ message: "Email must be from svecw.edu.in domain" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const profilePhoto = req.file
      ? `uploads/${req.file.filename}`.replace(/\\/g, "/")
      : "uploads/default-avatar.png";

    const newUser = new User({
  name,
  branch,
  year: parseInt(year),
  email,
  password, // ✅ store hashed password
  profilePhoto,
});

    await newUser.save();

    res.status(201).json({
      message: "User registered successfully",
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        branch: newUser.branch,
        year: newUser.year,
        profilePhoto: newUser.profilePhoto,
      },
    });
  } catch (err) {
    console.error("❌ Register error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});
/** Login */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    // Compare password with hashed one
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    // Generate token
    const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn: "1h" });

    // Return user without password
    const userData = user.toObject();
    delete userData.password;

    res.status(200).json({ message: "Login successful", token, user: userData });
  } catch (err) {
    console.error("❌ Login error:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

/** Update Profile */
router.put("/update/:email", verifyToken, upload.single("profilePhoto"), async (req, res) => {
  try {
    const emailParam = req.params.email.toLowerCase();

    if (!req.user || req.user.email.toLowerCase() !== emailParam) {
      return res.status(403).json({ message: "Unauthorized: Email mismatch" });
    }

    const { name, branch, year } = req.body;
    const user = await User.findOne({ email: emailParam });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (req.file && user.profilePhoto !== "uploads/default-avatar.png") {
      const oldPhotoPath = path.resolve(__dirname, "..", user.profilePhoto);
      if (fs.existsSync(oldPhotoPath)) {
        fs.unlinkSync(oldPhotoPath);
      }
    }

    if (name) user.name = name;
    if (branch) user.branch = branch;
    if (year) user.year = parseInt(year);
    if (req.file) {
      user.profilePhoto = `uploads/${req.file.filename}`.replace(/\\/g, "/");
    }

    await user.save();

    res.json({
      message: "✅ Profile updated successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        branch: user.branch,
        year: user.year,
        profilePhoto: user.profilePhoto,
      },
    });
  } catch (err) {
    console.error("❌ Update error:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

/** Get user by ID */
router.get("/details/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    console.error("❌ User details fetch error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});


module.exports = router;