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


// ========================
// FOLLOW USER
// ========================
router.post("/follow/:targetUserId", async (req, res) => {

  try {

    const { currentUserId } = req.body;
    const { targetUserId } = req.params;

    if (!currentUserId) {
      return res.status(400).json({
        message: "Current user ID required"
      });
    }

    if (currentUserId === targetUserId) {
      return res.status(400).json({
        message: "You cannot follow yourself"
      });
    }

    const currentUser = await User.findById(currentUserId);
    const targetUser = await User.findById(targetUserId);

    if (!currentUser || !targetUser) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    if (targetUser.followers.includes(currentUserId)) {
      return res.status(400).json({
        message: "Already following this user"
      });
    }

    targetUser.followers.push(currentUserId);
    currentUser.following.push(targetUserId);

    await targetUser.save();
    await currentUser.save();

    res.json({
      message: "User followed successfully"
    });

  } catch (err) {

    console.error("❌ Follow error:", err.message);

    res.status(500).json({
      message: "Server error"
    });

  }

});


// ========================
// UNFOLLOW USER
// ========================
router.post("/unfollow/:targetUserId", async (req, res) => {

  try {

    const { currentUserId } = req.body;
    const { targetUserId } = req.params;

    const currentUser = await User.findById(currentUserId);
    const targetUser = await User.findById(targetUserId);

    if (!currentUser || !targetUser) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    targetUser.followers = targetUser.followers.filter(
      id => id.toString() !== currentUserId
    );

    currentUser.following = currentUser.following.filter(
      id => id.toString() !== targetUserId
    );

    await targetUser.save();
    await currentUser.save();

    res.json({
      message: "User unfollowed successfully"
    });

  } catch (err) {

    console.error("❌ Unfollow error:", err.message);

    res.status(500).json({
      message: "Server error"
    });

  }

});


// ========================
// GET FOLLOWERS COUNT
// ========================
router.get("/:userId/followers-count", async (req, res) => {

  try {

    const user = await User.findById(req.params.userId);

    res.json({
      followersCount: user.followers.length
    });

  } catch (err) {

    res.status(500).json({
      message: "Server error"
    });

  }

});


// ========================
// GET FOLLOWING COUNT
// ========================
router.get("/:userId/following-count", async (req, res) => {

  try {

    const user = await User.findById(req.params.userId);

    res.json({
      followingCount: user.following.length
    });

  } catch (err) {

    res.status(500).json({
      message: "Server error"
    });

  }

});


module.exports = router;