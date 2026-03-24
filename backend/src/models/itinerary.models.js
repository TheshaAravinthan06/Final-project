import mongoose from "mongoose";

const itineraryDaySchema = new mongoose.Schema(
  {
    dayNumber: {
      type: Number,
      required: true,
      min: 1,
    },

    title: {
      type: String,
      trim: true,
      maxlength: 120,
      default: "",
    },

    activities: {
      type: [String],
      default: [],
    },

    stay: {
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

    transport: {
      type: String,
      trim: true,
      maxlength: 180,
      default: "",
    },

    notes: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
  },
  { _id: false }
);

const itinerarySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    mood: {
      type: String,
      required: [true, "Mood is required"],
      trim: true,
      maxlength: 80,
    },

    destination: {
      type: String,
      trim: true,
      maxlength: 120,
      default: "",
    },

    budget: {
      type: Number,
      min: 0,
      default: 0,
    },

    days: {
      type: Number,
      required: [true, "Number of days is required"],
      min: 1,
      max: 30,
    },

    travelersCount: {
      type: Number,
      min: 1,
      default: 1,
    },

    travelWithStrangers: {
      type: Boolean,
      default: false,
    },

    startDate: {
      type: Date,
      default: null,
    },

    preferences: {
      type: [String],
      default: [],
    },

    specialNote: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },

    aiPrompt: {
      type: String,
      trim: true,
      maxlength: 3000,
      default: "",
    },

    generatedTitle: {
      type: String,
      trim: true,
      maxlength: 150,
      default: "",
    },

    generatedSummary: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },

    generatedItinerary: {
      type: [itineraryDaySchema],
      default: [],
    },

    estimatedCost: {
      type: Number,
      min: 0,
      default: 0,
    },

    status: {
      type: String,
     enum: [
  "draft",
  "generated",
  "sent_to_admin",
  "approved",
  "rejected"
],
default: "draft",
    },

    adminNote: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    reviewedAt: {
      type: Date,
      default: null,
    },

    chatMessages: [
  {
    role: {
      type: String,
      enum: ["user", "assistant"],
    },
    message: String,
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
],

sentToAdmin: {
  type: Boolean,
  default: false,
},

emailSent: {
  type: Boolean,
  default: false,
},

  },
  { timestamps: true }
);

export default mongoose.model("Itinerary", itinerarySchema);