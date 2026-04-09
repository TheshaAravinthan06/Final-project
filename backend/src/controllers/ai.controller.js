import Itinerary from "../models/itinerary.models.js";
import { askGemini, safeJsonParse } from "../services/gemini.service.js";

export const getPlacesByMood = async (req, res) => {
  try {
    const { mood } = req.body;

    if (!mood || !String(mood).trim()) {
      return res.status(400).json({ message: "Mood is required" });
    }

    const prompt = `
You are PackPalz, a travel planner for Sri Lanka.

The user's current mood is: "${String(mood).trim()}"

Return ONLY valid JSON in this exact format:
{
  "message": "short friendly reply",
  "places": [
    {
      "name": "Ella",
      "district": "Badulla",
      "reason": "Matches the user's mood in a short sentence"
    }
  ]
}

Rules:
- Suggest at least 10 places
- Places must be in Sri Lanka only
- Do not mention any place outside Sri Lanka
- Keep reason short
- No markdown
- No explanation outside JSON
`;

    const result = await askGemini(prompt);
    console.log("Gemini raw places result:", result);

    const parsed = safeJsonParse(result);

    if (!parsed || !Array.isArray(parsed.places) || parsed.places.length === 0) {
      return res.status(500).json({
        message: "AI returned invalid places data",
      });
    }

    return res.status(200).json({
      message:
        parsed.message ||
        "These are some places in Sri Lanka that match your mood. Please select one or more places.",
      places: parsed.places,
    });
  } catch (error) {
    console.error("getPlacesByMood error:", error);

    return res.status(500).json({
      message: "Failed to generate places",
      error: error.message,
    });
  }
};

export const getActivitiesByPlaces = async (req, res) => {
  try {
    const { places } = req.body;

    if (!Array.isArray(places) || places.length === 0) {
      return res.status(400).json({ message: "Selected places are required" });
    }

    const prompt = `
You are PackPalz, a Sri Lanka travel planner.

The user selected these places:
${JSON.stringify(places)}

Return ONLY valid JSON in this exact format:
{
  "message": "short friendly reply",
  "activitiesByPlace": [
    {
      "place": "Ella",
      "activities": [
        "Nine Arch Bridge visit",
        "Little Adam's Peak hike",
        "Tea factory tour",
        "Cafe hopping",
        "Scenic train photography"
      ]
    }
  ]
}

Rules:
- For EACH place, give at least 5 activities
- All activities must suit that exact Sri Lankan destination
- No markdown
- No extra text outside JSON
`;

    const result = await askGemini(prompt);
    const parsed = safeJsonParse(result);

    if (
      !parsed ||
      !Array.isArray(parsed.activitiesByPlace) ||
      parsed.activitiesByPlace.length === 0
    ) {
      return res.status(500).json({
        message: "AI returned invalid activities data",
      });
    }

    return res.status(200).json({
      message:
        parsed.message ||
        "Nice choices. Now select the activities you would like to do.",
      activitiesByPlace: parsed.activitiesByPlace,
    });
  } catch (error) {
    console.error("getActivitiesByPlaces error:", error);
    return res.status(500).json({
      message: "Failed to generate activities",
      error: error.message,
    });
  }
};

export const createItinerary = async (req, res) => {
  try {
    const {
      mood,
      selectedPlaces,
      selectedActivities,
      days,
      specificDate,
      peopleCount,
      travelCompanions,
      customCompanionNote,
      extraNotes,
    } = req.body;

    if (
      !mood ||
      !Array.isArray(selectedPlaces) ||
      selectedPlaces.length === 0 ||
      !Array.isArray(selectedActivities) ||
      selectedActivities.length === 0 ||
      !days ||
      !peopleCount
    ) {
      return res.status(400).json({
        message: "Missing required itinerary fields",
      });
    }

    const prompt = `
You are PackPalz, a smart Sri Lanka travel planner.

Create a friendly, practical itinerary based on these details:

Mood: ${mood}
Places: ${JSON.stringify(selectedPlaces)}
Activities: ${JSON.stringify(selectedActivities)}
Days: ${days}
Specific Date: ${specificDate || "Not specified"}
People Count: ${peopleCount}
Travel Companions: ${JSON.stringify(travelCompanions || [])}
Custom Companion Preference: ${customCompanionNote || "None"}
Extra User Notes: ${extraNotes || "None"}

Return ONLY valid JSON in this exact format:
{
  "message": "short friendly reply",
  "itineraryText": "full itinerary in plain text"
}

Rules:
- Use only Sri Lanka places
- Organize by day
- Include morning, afternoon, evening when suitable
- Match the mood
- Consider travel group type and extra notes
- Keep it user-friendly
- No markdown
- No extra text outside JSON
`;

    const result = await askGemini(prompt);
    const parsed = safeJsonParse(result);

    if (!parsed || !parsed.itineraryText) {
      return res.status(500).json({
        message: "AI returned invalid itinerary data",
      });
    }

    return res.status(200).json({
      message:
        parsed.message ||
        "Great! I created your itinerary. Please review it below.",
      itineraryText: parsed.itineraryText,
    });
  } catch (error) {
    console.error("createItinerary error:", error);
    return res.status(500).json({
      message: "Failed to create itinerary",
      error: error.message,
    });
  }
};

export const saveItinerary = async (req, res) => {
  try {
    const {
      mood,
      selectedPlaces,
      selectedActivities,
      days,
      specificDate,
      peopleCount,
      travelCompanions,
      customCompanionNote,
      extraNotes,
      itineraryText,
    } = req.body;

    if (
      !mood ||
      !Array.isArray(selectedPlaces) ||
      !Array.isArray(selectedActivities) ||
      !days ||
      !peopleCount ||
      !itineraryText
    ) {
      return res.status(400).json({ message: "Missing required save fields" });
    }

    const itinerary = await Itinerary.create({
      user: req.user?._id || null,
      mood,
      selectedPlaces,
      selectedActivities,
      days,
      specificDate: specificDate || "",
      peopleCount,
      travelCompanions: Array.isArray(travelCompanions) ? travelCompanions : [],
      customCompanionNote: customCompanionNote || "",
      extraNotes: extraNotes || "",
      itineraryText,
      status: "saved",
    });

    return res.status(201).json({
      message: "Itinerary saved successfully",
      itinerary,
    });
  } catch (error) {
    console.error("saveItinerary error:", error);
    return res.status(500).json({
      message: "Failed to save itinerary",
      error: error.message,
    });
  }
};

export const sendItineraryToAdmin = async (req, res) => {
  try {
    const {
      name,
      phoneNumber,
      email,
      adults,
      children,
      accommodationType,
      foodType,
      allergies,
      budgetPreference,
      preferredTransport,

      mood,
      selectedPlaces,
      selectedActivities,
      days,
      specificDate,
      peopleCount,
      travelCompanions,
      customCompanionNote,
      extraNotes,
      itineraryText,
    } = req.body;

    if (!name || !phoneNumber || !email) {
      return res.status(400).json({
        message: "Name, phone number, and email are required",
      });
    }

    if (
      !mood ||
      !Array.isArray(selectedPlaces) ||
      !Array.isArray(selectedActivities) ||
      !days ||
      !peopleCount ||
      !itineraryText
    ) {
      return res.status(400).json({
        message: "Missing required send fields",
      });
    }

    const itinerary = await Itinerary.create({
      user: req.user?._id || null,

      name: String(name).trim(),
      phoneNumber: String(phoneNumber).trim(),
      email: String(email).trim().toLowerCase(),

      adults: Number(adults || 0),
      children: Number(children || 0),
      accommodationType: accommodationType || "hotel_or_rooms",
      foodType: foodType || "non_veg",
      allergies: allergies || "",
      budgetPreference: budgetPreference || "",
      preferredTransport: preferredTransport || "car",

      mood,
      selectedPlaces,
      selectedActivities,
      days,
      specificDate: specificDate || "",
      peopleCount,
      travelCompanions: Array.isArray(travelCompanions) ? travelCompanions : [],
      customCompanionNote: customCompanionNote || "",
      extraNotes: extraNotes || "",
      itineraryText,

      status: "sent_to_admin",
      adminStatus: "pending",
      adminNote: "",
    });

    return res.status(201).json({
      message: "Itinerary sent to admin successfully",
      itinerary,
    });
  } catch (error) {
    console.error("sendItineraryToAdmin error:", error);
    return res.status(500).json({
      message: "Failed to send itinerary to admin",
      error: error.message,
    });
  }
};

export const getSavedItineraries = async (req, res) => {
  try {
    const itineraries = await Itinerary.find({
      user: req.user._id,
      status: "saved",
    }).sort({
      createdAt: -1,
    });

    return res.status(200).json({ itineraries });
  } catch (error) {
    console.error("getSavedItineraries error:", error);
    return res.status(500).json({
      message: "Failed to fetch itineraries",
      error: error.message,
    });
  }
};