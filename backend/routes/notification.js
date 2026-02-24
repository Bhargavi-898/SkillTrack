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

        res.json(notifications);

    } catch (err) {

        console.error("Get notifications error:", err.message);

        res.status(500).json({
            message: "Server error"
        });

    }

});


/* =============================
   GET UNREAD COUNT (for bell badge)
============================= */
router.get("/unread/count", auth, async (req, res) => {

    try {

        const userId = req.user.userId || req.user._id;

        const count = await Notification.countDocuments({
            receiver: userId,
            isRead: false
        });

        res.json({ count });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            message: "Server error"
        });

    }

});


/* =============================
   MARK AS READ
============================= */
router.put("/read/:id", auth, async (req, res) => {

    try {

        await Notification.findByIdAndUpdate(req.params.id, {
            isRead: true
        });

        res.json({
            message: "Notification marked as read"
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            message: "Server error"
        });

    }

});


/* =============================
   MARK ALL AS READ
============================= */
router.put("/read-all", auth, async (req, res) => {

    try {

        const userId = req.user.userId || req.user._id;

        await Notification.updateMany(
            { receiver: userId },
            { isRead: true }
        );

        res.json({
            message: "All notifications marked as read"
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            message: "Server error"
        });

    }

});


module.exports = router;