const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({

    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },

    video: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video"
    },

    message: {
        type: String,
        required: true
    },

    type: {
        type: String,
        enum: ["like", "comment", "upload"],
        required: true
    },

    isRead: {
        type: Boolean,
        default: false
    }

}, { timestamps: true });

module.exports = mongoose.model("Notification", notificationSchema);