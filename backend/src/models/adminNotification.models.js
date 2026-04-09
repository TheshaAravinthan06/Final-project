import mongoose from "mongoose";

const adminNotificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        "place_like",
        "place_comment",
        "place_report",
        "booking_created",
        "payment_completed",
        "itinerary",
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
      enum: ["place", "booking", "payment", "itinerary", "none"],
      default: "none",
    },

    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    place: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Place",
      default: null,
    },

    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      default: null,
    },

    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      default: null,
    },

    travelPick: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TravelPick",
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