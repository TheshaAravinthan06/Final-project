import mongoose from "mongoose";

const bookingItinerarySchema = new mongoose.Schema(
  {
    itineraryText: {
      type: String,
      required: true,
    },
    mood: {
      type: String,
      required: true,
    },
    selectedPlaces: [
      {
        type: String,
      },
    ],
    selectedActivities: [
      {
        place: String,
        activities: [String],
      },
    ],
    days: {
      type: Number,
      required: true,
    },
    specificDate: {
      type: String,
      default: "",
    },
    peopleCount: {
      type: Number,
      required: true,
    },
    travelCompanions: [String],
    customCompanionNote: {
      type: String,
      default: "",
    },
    extraNotes: {
      type: String,
      default: "",
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
    },

    adults: {
      type: Number,
      default: 1,
    },
    children: {
      type: Number,
      default: 0,
    },

    accommodationType: {
      type: String,
      enum: [
        "hotel",
        "private_room",
        "shared_room",
        "rented_house",
        "rest_inn",
        "dome",
        "hostel",
        "camping",
      ],
      default: "hotel",
    },

    foodType: {
      type: String,
      enum: ["veg", "non_veg"],
      default: "non_veg",
    },

    budgetPreference: {
      type: String,
      default: "",
    },

    preferredTransport: {
      type: String,
      enum: ["car", "van", "bus"],
      default: "car",
    },

    status: {
      type: String,
      enum: ["pending", "reviewed", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export default mongoose.model("BookingItinerary", bookingItinerarySchema);