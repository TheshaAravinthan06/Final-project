import mongoose from "mongoose";

const itinerarySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    name: {
      type: String,
      default: "",
      trim: true,
    },

    phoneNumber: {
      type: String,
      default: "",
      trim: true,
    },

    email: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },

    adults: {
      type: Number,
      default: 1,
      min: 0,
    },

    children: {
      type: Number,
      default: 0,
      min: 0,
    },

    accommodationType: {
      type: String,
      enum: ["", "hotel_or_rooms", "rented_house", "hostel_or_dorm", "camping"],
      default: "",
    },

    foodType: {
      type: String,
      enum: ["", "veg", "non_veg"],
      default: "",
    },

    allergies: {
      type: String,
      default: "",
      trim: true,
    },

    budgetPreference: {
      type: String,
      default: "",
      trim: true,
    },

    preferredTransport: {
      type: String,
      enum: ["", "car", "van", "bus"],
      default: "",
    },

    mood: {
      type: String,
      required: true,
      trim: true,
    },

    selectedPlaces: [
      {
        type: String,
        trim: true,
      },
    ],

    selectedActivities: [
      {
        place: {
          type: String,
          trim: true,
        },
        activities: [
          {
            type: String,
            trim: true,
          },
        ],
      },
    ],

    days: {
      type: Number,
      required: true,
      min: 1,
    },

    specificDate: {
      type: String,
      default: "",
      trim: true,
    },

    peopleCount: {
      type: Number,
      required: true,
      min: 1,
    },

    travelCompanions: [
      {
        type: String,
        trim: true,
      },
    ],

    customCompanionNote: {
      type: String,
      default: "",
      trim: true,
    },

    extraNotes: {
      type: String,
      default: "",
      trim: true,
    },

    itineraryText: {
      type: String,
      required: true,
      trim: true,
    },

    status: {
      type: String,
      enum: ["saved", "sent_to_admin"],
      default: "saved",
    },

    adminStatus: {
      type: String,
      enum: ["pending", "in_review", "approved", "rejected", "completed"],
      default: "pending",
    },

    adminNote: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

const Itinerary = mongoose.model("Itinerary", itinerarySchema);

export default Itinerary;