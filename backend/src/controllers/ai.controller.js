import Itinerary from "../models/itinerary.models.js";
import { askGemini, safeJsonParse } from "../services/gemini.service.js";

export const getPlacesByMood = async (req, res) => {
  try {
    const {
      mood,
      travelPreference,
      travelDate,
      placePreference,
      userPlaces,
    } = req.body;

    if (!mood || !String(mood).trim()) {
      return res.status(400).json({ message: "Mood is required" });
    }

    const normalizedMood = String(mood).trim();
    const normalizedTravelPreference = String(
      travelPreference || ""
    ).trim();
    const normalizedTravelDate = String(travelDate || "").trim();
    const normalizedPlacePreference = String(
      placePreference || ""
    ).trim();

    const cleanedUserPlaces = Array.isArray(userPlaces)
      ? userPlaces
          .map((place) => String(place || "").trim())
          .filter(Boolean)
      : [];

    const prompt = `
You are PackPalz, a travel planner for Sri Lanka.

User details:
- Current mood: "${normalizedMood}"
- Travel preference: "${normalizedTravelPreference || "Not specified"}"
- Travel timing: "${normalizedTravelDate || "Flexible"}"
- Place preference: "${normalizedPlacePreference || "No specific preference"}"
- User selected places: ${
      cleanedUserPlaces.length > 0
        ? cleanedUserPlaces.join(", ")
        : "None"
    }

Return ONLY valid JSON in this exact format:
{
  "message": "short friendly reply",
  "places": [
    {
      "name": "Ella",
      "district": "Badulla",
      "reason": "Matches the user's mood and trip details in a short sentence"
    }
  ]
}

Rules:
- Suggest at least 10 places
- Places must be in Sri Lanka only
- If user selected places are valid Sri Lankan destinations, INCLUDE them in the result
- If some selected places may be less ideal for the given season or travel timing, still keep the suggestions helpful and recommend better alternatives too
- Consider weather and season when the user gives a month, date, weekend, or timing
- Match places with the user's mood and travel preference
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
        "Here are some places based on your preferences and travel timing. You can select more or remove any.",
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
    const { places, mood, travelPreference, travelDate } = req.body;

    if (!Array.isArray(places) || places.length === 0) {
      return res.status(400).json({ message: "Selected places are required" });
    }

    const cleanedPlaces = places
      .map((place) => String(place || "").trim())
      .filter(Boolean);

    const prompt = `
You are PackPalz, a Sri Lanka travel planner.

The user selected these places:
${JSON.stringify(cleanedPlaces)}

User context:
- Mood: "${String(mood || "").trim() || "Not specified"}"
- Travel preference: "${
      String(travelPreference || "").trim() || "Not specified"
    }"
- Travel timing: "${String(travelDate || "").trim() || "Flexible"}"

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
- Consider weather and season if travel timing is given
- Match activities to the user's mood and travel preference where relevant
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
      travelPreference,
      days,
      travelDate,
      specificDate,
      peopleCount,

      needsCompanion,
      companionCount,
      companionType,
      companionMatchBasis,

      placePreference,
      userPlaces,
      selectedPlaces,
      selectedActivities,
      extraRequests,
    } = req.body;

    if (!mood || !days) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const cleanedUserPlaces = Array.isArray(userPlaces)
      ? userPlaces.map((item) => String(item || "").trim()).filter(Boolean)
      : [];

    const cleanedSelectedPlaces = Array.isArray(selectedPlaces)
      ? selectedPlaces.map((item) => String(item || "").trim()).filter(Boolean)
      : [];

    const cleanedSelectedActivities = Array.isArray(selectedActivities)
      ? selectedActivities
      : [];

    const finalTravelTiming =
      String(specificDate || "").trim() || String(travelDate || "").trim() || "Flexible";

    const prompt = `
You are PackPalz, a Sri Lanka travel planner.

Create a detailed travel itinerary in Sri Lanka.

User details:
- Mood: ${String(mood).trim()}
- Travel Preference: ${String(travelPreference || "").trim() || "Not specified"}
- Duration: ${days} days
- Travel Timing: ${finalTravelTiming}
- Number of People: ${peopleCount || "Not specified"}

Companion Details:
- Needs Companion: ${needsCompanion ? "Yes" : "No"}
- Companion Count: ${companionCount || "Flexible"}
- Companion Type: ${companionType || "No specific preference"}
- Matching Preference: ${
      companionMatchBasis || "No specific matching preference"
    }

Place Preference: ${placePreference || "No specific preference"}

User Entered Places:
${cleanedUserPlaces.length > 0 ? cleanedUserPlaces.join(", ") : "None"}

Selected Places:
${cleanedSelectedPlaces.length > 0 ? cleanedSelectedPlaces.join(", ") : "None"}

Selected Activities:
${JSON.stringify(cleanedSelectedActivities)}

Extra Requests:
${extraRequests || "None"}

IMPORTANT:
- Suggest a realistic itinerary
- Consider Sri Lankan weather and season
- Balance travel distance
- Include morning, afternoon, evening plans
- Keep it practical and enjoyable
- If the user asked for changes, reflect them clearly

Return a clear DAY-BY-DAY itinerary as plain text only.
`;

    const text = await askGemini(prompt);

    const itinerary = new Itinerary({
      user: req.user?._id,
      mood,
      travelPreference,
      days,
      travelDate: travelDate || "",
      specificDate: specificDate || "",
      peopleCount,

      needsCompanion: Boolean(needsCompanion),
      companionCount: companionCount || "",
      companionType: companionType || "",
      companionMatchBasis: companionMatchBasis || "",

      placePreference: placePreference || "",
      userPlaces: cleanedUserPlaces,
      selectedPlaces: cleanedSelectedPlaces,
      selectedActivities: cleanedSelectedActivities,
      extraRequests: extraRequests || "",

      itineraryText: text,
    });

    await itinerary.save();

    return res.status(200).json({
      message: "Great! I created your itinerary. Please review it below.",
      itinerary: text,
      itineraryText: text,
    });
  } catch (err) {
    console.error("Create itinerary error:", err);
    return res.status(500).json({ message: "Failed to create itinerary" });
  }
};

export const saveItinerary = async (req, res) => {
  try {
    const {
      mood,
      travelPreference,
      userPlaces,
      selectedPlaces,
      selectedActivities,
      days,
      travelDate,
      specificDate,
      peopleCount,
      needsCompanion,
      companionCount,
      companionType,
      companionMatchBasis,
      travelCompanions,
      placePreference,
      customCompanionNote,
      extraNotes,
      itineraryText,
    } = req.body;

    if (
      !mood ||
      !Array.isArray(selectedPlaces) ||
      !days ||
      !peopleCount ||
      !itineraryText
    ) {
      return res.status(400).json({ message: "Missing required save fields" });
    }

    const itinerary = await Itinerary.create({
      user: req.user?._id || null,
      mood,
      travelPreference: travelPreference || "",
      userPlaces: Array.isArray(userPlaces) ? userPlaces : [],
      selectedPlaces,
      selectedActivities: Array.isArray(selectedActivities)
        ? selectedActivities
        : [],
      days,
      travelDate: travelDate || "",
      specificDate: specificDate || "",
      peopleCount,
      needsCompanion: Boolean(needsCompanion),
      companionCount: companionCount || "",
      companionType: companionType || "",
      companionMatchBasis: companionMatchBasis || "",
      travelCompanions: Array.isArray(travelCompanions) ? travelCompanions : [],
      placePreference: placePreference || "",
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
      travelPreference,
      userPlaces,
      selectedPlaces,
      selectedActivities,
      days,
      travelDate,
      specificDate,
      peopleCount,
      needsCompanion,
      companionCount,
      companionType,
      companionMatchBasis,
      travelCompanions,
      placePreference,
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
      travelPreference: travelPreference || "",
      userPlaces: Array.isArray(userPlaces) ? userPlaces : [],
      selectedPlaces,
      selectedActivities: Array.isArray(selectedActivities)
        ? selectedActivities
        : [],
      days,
      travelDate: travelDate || "",
      specificDate: specificDate || "",
      peopleCount,
      needsCompanion: Boolean(needsCompanion),
      companionCount: companionCount || "",
      companionType: companionType || "",
      companionMatchBasis: companionMatchBasis || "",
      travelCompanions: Array.isArray(travelCompanions) ? travelCompanions : [],
      placePreference: placePreference || "",
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