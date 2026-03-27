import mongoose from "mongoose";

const placeCommentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    text: {
      type: String,
      trim: true,
      maxlength: 300,
    },
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    isAdminReply: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const placeSchema = new mongoose.Schema(
  {
    placeName: {
      type: String,
      required: [true, "Place name is required"],
      trim: true,
      maxlength: 100,
    },
    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
      maxlength: 120,
    },
    imageUrl: {
      type: String,
      required: [true, "Image is required"],
      trim: true,
    },
    caption: {
      type: String,
      required: [true, "Caption is required"],
      trim: true,
      maxlength: 220,
    },
    moodTags: {
      type: [String],
      default: [],
    },
    activities: {
      type: [String],
      default: [],
    },
    bestTime: {
      type: String,
      trim: true,
      maxlength: 50,
      default: "",
    },
    weather: {
      type: String,
      trim: true,
      maxlength: 50,
      default: "",
    },
    vibe: {
      type: String,
      trim: true,
      maxlength: 50,
      default: "",
    },
    travelTip: {
      type: String,
      trim: true,
      maxlength: 180,
      default: "",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    savedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    comments: [placeCommentSchema],
    shareCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Place", placeSchema);