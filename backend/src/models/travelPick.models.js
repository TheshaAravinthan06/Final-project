import mongoose from "mongoose";

const travelPickSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: 120,
    },

    place: {
      type: String,
      required: [true, "Place is required"],
      trim: true,
      maxlength: 120,
    },

    imageUrl: {
      type: String,
      required: [true, "Image is required"],
      trim: true,
    },

    startDate: {
      type: Date,
      required: [true, "Start date is required"],
    },

    endDate: {
      type: Date,
      required: [true, "End date is required"],
    },

    caption: {
      type: String,
      required: [true, "Caption is required"],
      trim: true,
      maxlength: 240,
    },

    placesToVisit: {
      type: [String],
      default: [],
    },

    accommodation: {
      type: String,
      trim: true,
      maxlength: 180,
      default: "",
    },

    meals: {
      type: String,
      trim: true,
      maxlength: 180,
      default: "",
    },

    transportation: {
      type: String,
      trim: true,
      maxlength: 180,
      default: "",
    },

    tourGuide: {
      type: String,
      trim: true,
      maxlength: 180,
      default: "",
    },

    paymentInfo: {
      type: String,
      trim: true,
      maxlength: 220,
      default: "",
    },

    moreDetails: {
      type: String,
      trim: true,
      maxlength: 1200,
      default: "",
    },

    advancePolicy: {
      type: String,
      trim: true,
      maxlength: 180,
      default: "30% advance payment is required to confirm the booking.",
    },

    advancePercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 30,
    },

    cancellationPolicy: {
      type: String,
      trim: true,
      maxlength: 180,
      default: "No cancellation after confirmation due to travel arrangements.",
    },

    refundPolicy: {
      type: String,
      trim: true,
      maxlength: 180,
      default: "Advance payment is non-refundable after confirmation.",
    },

    price: {
      type: Number,
      required: [true, "Price is required"],
      min: 0,
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

    // future-ready fields
    savedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    bookingCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.model("TravelPick", travelPickSchema);