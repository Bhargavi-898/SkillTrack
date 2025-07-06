const express = require("express");
const router = express.Router();
const User = require("../models/user");

// Get user details by email
router.get("/:email", async (req, res) => {
  try {
    const email = req.params.email.toLowerCase();  // normalize email

    const user = await User.findOne({ email }).select("-password"); // exclude password

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (err) {
    console.error("❌ Get user error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
