import mongoose from "mongoose";

const bookingItinerarySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    itineraryText: {
      type: String,
      required: true,
      trim: true,
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

    name: {
      type: String,
      required: true,
      trim: true,
    },

    phoneNumber: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
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
      enum: [
        "hotel_or_rooms",
        "rented_house",
        "hostel_or_dorm",
        "camping",
      ],
      default: "hotel_or_rooms",
    },

    foodType: {
      type: String,
      enum: ["veg", "non_veg"],
      default: "non_veg",
    },

    notes: {
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
      enum: ["car", "van", "bus"],
      default: "car",
    },

    status: {
      type: String,
      enum: ["pending", "in_review", "approved", "rejected", "completed"],
      default: "pending",
    },

    travelPreference: {
      type: String,
      default: "",
      trim: true,
    },

    needsCompanion: {
      type: Boolean,
      default: false,
    },

    companionCount: {
      type: String,
      default: "",
      trim: true,
    },

    companionType: {
      type: String,
      default: "",
      trim: true,
    },

    companionMatchBasis: {
      type: String,
      default: "",
      trim: true,
    },

    placePreference: {
      type: String,
      default: "",
      trim: true,
    },

    adminNote: {
      type: String,
      default: "",
      trim: true,
    },

    addedToPackage: {
      type: Boolean,
      default: false,
    },

    travelPickId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TravelPick",
      default: null,
    },

    packageCreatedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("BookingItinerary", bookingItinerarySchema);