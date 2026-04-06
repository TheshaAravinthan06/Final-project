// import Itinerary from "../models/itinerary.models.js";
// import { askGemini, safeJsonParse } from "../services/gemini.service.js";

// export const getPlacesByMood = async (req, res) => {
//   try {
//     const { mood } = req.body;

//     if (!mood) {
//       return res.status(400).json({ message: "Mood is required" });
//     }

//     const prompt = `
// You are PackPalz, a travel planner for Sri Lanka.

// The user's current mood is: "${mood}"

// Return ONLY valid JSON in this exact format:
// {
//   "message": "short friendly reply",
//   "places": [
//     {
//       "name": "Ella",
//       "district": "Badulla",
//       "reason": "Matches the user's mood in a short sentence"
//     }
//   ]
// }

// Rules:
// - Suggest at least 10 places
// - Places must be in Sri Lanka only
// - Do not mention any place outside Sri Lanka
// - Keep reason short
// - No markdown
// - No extra text outside JSON
// `;

//     const result = await askGemini(prompt);
//     const parsed = safeJsonParse(result);

//     return res.status(200).json(parsed);
//   } catch (error) {
//     console.error("getPlacesByMood error:", error);
//     return res.status(500).json({ message: "Failed to generate places" });
//   }
// };

// export const getActivitiesByPlaces = async (req, res) => {
//   try {
//     const { places } = req.body;

//     if (!places || !Array.isArray(places) || places.length === 0) {
//       return res.status(400).json({ message: "Selected places are required" });
//     }

//     const prompt = `
// You are PackPalz, a Sri Lanka travel planner.

// The user selected these places:
// ${JSON.stringify(places)}

// Return ONLY valid JSON in this exact format:
// {
//   "message": "short friendly reply",
//   "activitiesByPlace": [
//     {
//       "place": "Ella",
//       "activities": [
//         "Nine Arch Bridge visit",
//         "Little Adam's Peak hike",
//         "Tea factory tour",
//         "Cafe hopping",
//         "Scenic train photography"
//       ]
//     }
//   ]
// }

// Rules:
// - For EACH place, give at least 5 activities
// - All activities must suit that exact Sri Lankan destination
// - No markdown
// - No extra text outside JSON
// `;

//     const result = await askGemini(prompt);
//     const parsed = safeJsonParse(result);

//     return res.status(200).json(parsed);
//   } catch (error) {
//     console.error("getActivitiesByPlaces error:", error);
//     return res.status(500).json({ message: "Failed to generate activities" });
//   }
// };

// export const createItinerary = async (req, res) => {
//   try {
//     const {
//       mood,
//       selectedPlaces,
//       selectedActivities,
//       days,
//       specificDate,
//       peopleCount,
//       travelMode,
//     } = req.body;

//     const prompt = `
// You are PackPalz, a smart Sri Lanka travel planner.

// Create a friendly, practical itinerary based on these details:

// Mood: ${mood}
// Places: ${JSON.stringify(selectedPlaces)}
// Activities: ${JSON.stringify(selectedActivities)}
// Days: ${days}
// Specific Date: ${specificDate || "Not specified"}
// People Count: ${peopleCount}
// Travel Style: ${travelMode}

// Return ONLY valid JSON in this exact format:
// {
//   "message": "short friendly reply",
//   "itineraryText": "full itinerary in plain text"
// }

// Rules:
// - Use only Sri Lanka places
// - Organize by day
// - Include morning, afternoon, evening when suitable
// - Match the mood
// - Keep it user-friendly
// - No markdown
// - No extra text outside JSON
// `;

//     const result = await askGemini(prompt);
//     const parsed = safeJsonParse(result);

//     return res.status(200).json(parsed);
//   } catch (error) {
//     console.error("createItinerary error:", error);
//     return res.status(500).json({ message: "Failed to create itinerary" });
//   }
// };

// export const saveItinerary = async (req, res) => {
//   try {
//     const itinerary = await Itinerary.create({
//       ...req.body,
//       status: "saved",
//     });

//     return res.status(201).json({
//       message: "Itinerary saved successfully",
//       itinerary,
//     });
//   } catch (error) {
//     console.error("saveItinerary error:", error);
//     return res.status(500).json({ message: "Failed to save itinerary" });
//   }
// };

// export const sendItineraryToAdmin = async (req, res) => {
//   try {
//     const itinerary = await Itinerary.create({
//       ...req.body,
//       status: "sent_to_admin",
//     });

//     return res.status(201).json({
//       message: "Itinerary sent to admin successfully",
//       itinerary,
//     });
//   } catch (error) {
//     console.error("sendItineraryToAdmin error:", error);
//     return res.status(500).json({ message: "Failed to send itinerary to admin" });
//   }
// };

// export const getSavedItineraries = async (req, res) => {
//   try {
//     const itineraries = await Itinerary.find({ status: "saved" })
//       .sort({ createdAt: -1 });

//     return res.status(200).json({ itineraries });
//   } catch (error) {
//     console.error("getSavedItineraries error:", error);
//     return res.status(500).json({ message: "Failed to fetch itineraries" });
//   }
// };

import Itinerary from "../models/itinerary.models.js";
import { askGemini, safeJsonParse } from "../services/gemini.service.js";

export const getPlacesByMood = async (req, res) => {
  try {
    const { mood } = req.body;

    if (!mood) {
      return res.status(400).json({ message: "Mood is required" });
    }

    const prompt = `
You are PackPalz, a travel planner for Sri Lanka.

The user's current mood is: "${mood}"

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
- No extra text outside JSON
`;

    const result = await askGemini(prompt);
    const parsed = safeJsonParse(result);

    return res.status(200).json(parsed);
  } catch (error) {
    console.error("getPlacesByMood error:", error);
    return res.status(500).json({ message: "Failed to generate places" });
  }
};

export const getActivitiesByPlaces = async (req, res) => {
  try {
    const { places } = req.body;

    if (!places || !Array.isArray(places) || places.length === 0) {
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

    return res.status(200).json(parsed);
  } catch (error) {
    console.error("getActivitiesByPlaces error:", error);
    return res.status(500).json({ message: "Failed to generate activities" });
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

    return res.status(200).json(parsed);
  } catch (error) {
    console.error("createItinerary error:", error);
    return res.status(500).json({ message: "Failed to create itinerary" });
  }
};

export const saveItinerary = async (req, res) => {
  try {
    const itinerary = await Itinerary.create({
      ...req.body,
      status: "saved",
    });

    return res.status(201).json({
      message: "Itinerary saved successfully",
      itinerary,
    });
  } catch (error) {
    console.error("saveItinerary error:", error);
    return res.status(500).json({ message: "Failed to save itinerary" });
  }
};

export const sendItineraryToAdmin = async (req, res) => {
  try {
    const itinerary = await Itinerary.create({
      ...req.body,
      status: "sent_to_admin",
    });

    return res.status(201).json({
      message: "Itinerary sent to admin successfully",
      itinerary,
    });
  } catch (error) {
    console.error("sendItineraryToAdmin error:", error);
    return res.status(500).json({ message: "Failed to send itinerary to admin" });
  }
};

export const getSavedItineraries = async (req, res) => {
  try {
    const itineraries = await Itinerary.find({ status: "saved" })
      .sort({ createdAt: -1 });

    return res.status(200).json({ itineraries });
  } catch (error) {
    console.error("getSavedItineraries error:", error);
    return res.status(500).json({ message: "Failed to fetch itineraries" });
  }
};

