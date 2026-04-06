import mongoose from "mongoose";

const itinerarySchema = new mongoose.Schema(
  {
    mood: String,
    selectedPlaces: [String],
    selectedActivities: [
      {
        place: String,
        activities: [String],
      },
    ],
    days: Number,
    specificDate: String,
    travelCompanions: [
      {
        type: String,
      },
    ],
    customCompanionNote: {
      type: String,
      default: "",
    },
    extraNotes: {
      type: String,
      default: "",
    },
    travelMode: {
      type: String,
      enum: ["solo", "friends", "strangers"],
    },
    itineraryText: String,
    status: {
      type: String,
      enum: ["saved", "sent_to_admin"],
      default: "saved",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Itinerary", itinerarySchema);