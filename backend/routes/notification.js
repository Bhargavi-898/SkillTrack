const express = require("express");
const router = express.Router();

const Notification = require("../models/Notification");
const auth = require("../middlewares/auth");


/* =============================
   GET MY NOTIFICATIONS (secure)
============================= */
router.get("/", auth, async (req, res) => {

  try {

    const userId = req.user.userId || req.user._id;

    const notifications = await Notification.find({
      receiver: userId
    })
      .populate("sender", "name profilePhoto")
      .populate("video", "title")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      notifications
    });

  } catch (err) {

    console.error("Get notifications error:", err);

    res.status(500).json({
      success: false,
      message: "Server error"
    });

  }

});


/* =============================
   GET UNREAD COUNT
============================= */
router.get("/unread/count", auth, async (req, res) => {

  try {

    const userId = req.user.userId || req.user._id;

    const count = await Notification.countDocuments({
      receiver: userId,
      isRead: false
    });

    res.status(200).json({
      success: true,
      count
    });

  } catch (err) {

    console.error("Unread count error:", err);

    res.status(500).json({
      success: false,
      message: "Server error"
    });

  }

});


/* =============================
   MARK SINGLE NOTIFICATION READ
============================= */
router.put("/read/:id", auth, async (req, res) => {

  try {

    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { $set: { isRead: true } },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Notification marked as read"
    });

  } catch (err) {

    console.error("Read notification error:", err);

    res.status(500).json({
      success: false,
      message: "Server error"
    });

  }

});


/* =============================
   MARK ALL NOTIFICATIONS READ ⭐ FIXED
============================= */
router.put("/read-all", auth, async (req, res) => {

  try {

    const userId = req.user.userId || req.user._id;

    const result = await Notification.updateMany(
      {
        receiver: userId,
        isRead: false   // ⭐ important fix
      },
      {
        $set: { isRead: true }
      }
    );

    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
      modifiedCount: result.modifiedCount
    });

  } catch (err) {

    console.error("Read-all error:", err);

    res.status(500).json({
      success: false,
      message: "Server error"
    });

  }

});


module.exports = router;