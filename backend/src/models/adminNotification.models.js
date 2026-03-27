import mongoose from "mongoose";

const adminNotificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["place_like", "place_comment", "place_report"],
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
    place: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Place",
      default: null,
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    commentId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    reportId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("AdminNotification", adminNotificationSchema);