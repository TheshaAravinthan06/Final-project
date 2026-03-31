import mongoose from "mongoose";

const userNotificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    type: {
      type: String,
      enum: [
        "follow",
        "comment",
        "reply",
        "like",
        "system",
      ],
      required: true,
    },

    title: {
      type: String,
      trim: true,
      default: "",
    },

    message: {
      type: String,
      trim: true,
      default: "",
    },

    entityType: {
      type: String,
      enum: ["user", "place", "post", "itinerary", "none"],
      default: "none",
    },

    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    previewImage: {
      type: String,
      trim: true,
      default: "",
    },

    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("UserNotification", userNotificationSchema);