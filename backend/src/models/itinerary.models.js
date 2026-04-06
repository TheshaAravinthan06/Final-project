import mongoose from "mongoose";

const itinerarySchema = new mongoose.Schema(
  {
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
    },
    specificDate: {
      type: String,
      default: "",
      trim: true,
    },
    peopleCount: {
      type: Number,
      required: true,
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
    },
    status: {
      type: String,
      enum: ["saved", "sent_to_admin"],
      default: "saved",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Itinerary", itinerarySchema);