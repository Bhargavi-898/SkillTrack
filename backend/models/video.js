const mongoose = require("mongoose");

// Review sub-schema
const reviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  rating: { type: Number, min: 1, max: 5 },
  comment: { type: String },
  createdAt: { type: Date, default: Date.now }
});

// Main Video Schema
const videoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    url: {
      type: String,
      required: [true, "Video URL is required"],
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Uploader reference is required"],
    },
    category: {
      type: String,
      enum: ["Technical", "Non-Technical"],
      required: [true, "Category is required"],
    },
    likes: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },
    dislikes: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User" }
    ],
    reviews: [reviewSchema],
    views: { type: Number, default: 0 },
    viewedBy: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User" }
    ]
  },
  {
    timestamps: true // Automatically adds createdAt and updatedAt
  }
);

module.exports = mongoose.model("Video", videoSchema);
