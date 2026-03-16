const express = require("express");
const router = express.Router();
const User = require("../models/User");


// ========================
// Get user details by email
// ========================
router.get("/:email", async (req, res) => {

  try {

    const email = req.params.email.toLowerCase();

    const user = await User.findOne({ email })
      .select("-password");

    if (!user) {

      return res.status(404).json({
        message: "User not found"
      });

    }

    res.json(user);

  } catch (err) {

    console.error("❌ Get user error:", err.message);

    res.status(500).json({
      message: "Server error"
    });

  }

});



module.exports = router;