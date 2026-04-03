import OpenAI from "openai";
import Itinerary from "../models/itinerary.models.js";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const cleanJson = (text) => {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error("Invalid JSON from OpenAI");
  }
};

const normalizeStringArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

const normalizeGeneratedItinerary = (value) => {
  if (!Array.isArray(value)) return [];

  return value
    .map((day, index) => ({
      dayNumber: Number(day?.dayNumber || index + 1),
      title: day?.title ? String(day.title).trim() : "",
      activities: normalizeStringArray(day?.activities),
      stay: day?.stay ? String(day.stay).trim() : "",
      meals: day?.meals ? String(day.meals).trim() : "",
      transport: day?.transport ? String(day.transport).trim() : "",
      notes: day?.notes ? String(day.notes).trim() : "",
    }))
    .filter((day) => day.dayNumber > 0);
};

const buildPrompt = ({
  mood,
  destination,
  days,
  budget,
  travelersCount,
  travelWithStrangers,
  preferences,
  specialNote,
}) => {
  return `
You are a travel planner for a mood-based travel platform.

Create a personalized travel itinerary in valid JSON only.

User details:
- Mood: ${mood}
- Destination: ${destination || "Sri Lanka"}
- Days: ${days}
- Budget: ${budget || 0}
- Travelers count: ${travelersCount || 1}
- Travel with strangers: ${travelWithStrangers ? "Yes" : "No"}
- Preferences: ${
    Array.isArray(preferences) ? preferences.join(", ") : preferences || ""
  }
- Special note: ${specialNote || ""}

Return ONLY this JSON shape:
{
  "generatedTitle": "string",
  "generatedSummary": "string",
  "estimatedCost": number,
  "generatedItinerary": [
    {
      "dayNumber": 1,
      "title": "string",
      "activities": ["string"],
      "stay": "string",
      "meals": "string",
      "transport": "string",
      "notes": "string"
    }
  ]
}
`;
};

export const generateMoodItinerary = async (req, res) => {
  try {
    const {
      mood,
      destination,
      days,
      budget,
      travelersCount,
      travelWithStrangers,
      preferences,
      specialNote,
      saveToDb = false,
    } = req.body;

    if (!mood || !String(mood).trim()) {
      return res.status(400).json({ message: "Mood is required" });
    }

    const totalDays = Number(days);
    if (Number.isNaN(totalDays) || totalDays < 1 || totalDays > 30) {
      return res.status(400).json({
        message: "Days must be a number between 1 and 30",
      });
    }

    const totalTravelers = Number(travelersCount || 1);
    const parsedBudget = Number(budget || 0);

    const prompt = buildPrompt({
      mood: String(mood).trim(),
      destination: destination ? String(destination).trim() : "",
      days: totalDays,
      budget: parsedBudget,
      travelersCount: totalTravelers,
      travelWithStrangers: Boolean(travelWithStrangers),
      preferences: normalizeStringArray(preferences),
      specialNote: specialNote ? String(specialNote).trim() : "",
    });

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
    });

    const outputText = response.output_text;
    const parsed = cleanJson(outputText);

    const result = {
      generatedTitle: parsed.generatedTitle || "",
      generatedSummary: parsed.generatedSummary || "",
      estimatedCost: Number(parsed.estimatedCost || 0),
      generatedItinerary: normalizeGeneratedItinerary(parsed.generatedItinerary),
    };

    let savedItinerary = null;

    if (saveToDb && req.user?._id) {
      savedItinerary = await Itinerary.create({
        user: req.user._id,
        mood: String(mood).trim(),
        destination: destination ? String(destination).trim() : "",
        budget: parsedBudget,
        days: totalDays,
        travelersCount: totalTravelers,
        travelWithStrangers: Boolean(travelWithStrangers),
        preferences: normalizeStringArray(preferences),
        specialNote: specialNote ? String(specialNote).trim() : "",
        aiPrompt: prompt,
        generatedTitle: result.generatedTitle,
        generatedSummary: result.generatedSummary,
        generatedItinerary: result.generatedItinerary,
        estimatedCost: result.estimatedCost,
        status: "generated",
      });
    }

    return res.status(200).json({
      message: "Itinerary generated successfully",
      result,
      savedItinerary,
    });
  } catch (error) {
    console.error(
      "generateMoodItinerary error:",
      error?.response?.data || error.message
    );

    return res.status(error?.status || 500).json({
      message:
        error?.response?.data?.error?.message ||
        error?.message ||
        "Failed to generate itinerary",
    });
  }
};

export const saveGeneratedItinerary = async (req, res) => {
  try {
    const { formData, itinerary } = req.body;

    if (!req.user?._id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!formData?.mood || !String(formData.mood).trim()) {
      return res.status(400).json({ message: "Mood is required" });
    }

    const totalDays = Number(formData.days);
    if (Number.isNaN(totalDays) || totalDays < 1 || totalDays > 30) {
      return res.status(400).json({
        message: "Days must be between 1 and 30",
      });
    }

    const created = await Itinerary.create({
      user: req.user._id,
      mood: String(formData.mood).trim(),
      destination: formData.destination
        ? String(formData.destination).trim()
        : "",
      budget: Number(formData.budget || 0),
      days: totalDays,
      travelersCount: Number(formData.travelersCount || 1),
      travelWithStrangers: Boolean(formData.travelWithStrangers),
      preferences: normalizeStringArray(formData.preferences),
      specialNote: formData.specialNote
        ? String(formData.specialNote).trim()
        : "",
      generatedTitle: itinerary?.generatedTitle || "",
      generatedSummary: itinerary?.generatedSummary || "",
      generatedItinerary: normalizeGeneratedItinerary(
        itinerary?.generatedItinerary
      ),
      estimatedCost: Number(itinerary?.estimatedCost || 0),
      status: "generated",
      sentToAdmin: false,
    });

    return res.status(201).json({
      message: "Itinerary saved successfully",
      itinerary: created,
    });
  } catch (error) {
    console.error("saveGeneratedItinerary error:", error);
    return res.status(500).json({
      message: error.message || "Failed to save itinerary",
    });
  }
};

export const sendGeneratedItineraryToAdmin = async (req, res) => {
  try {
    const { formData, itinerary } = req.body;

    if (!req.user?._id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!formData?.mood || !String(formData.mood).trim()) {
      return res.status(400).json({ message: "Mood is required" });
    }

    const totalDays = Number(formData.days);
    if (Number.isNaN(totalDays) || totalDays < 1 || totalDays > 30) {
      return res.status(400).json({
        message: "Days must be between 1 and 30",
      });
    }

    const created = await Itinerary.create({
      user: req.user._id,
      mood: String(formData.mood).trim(),
      destination: formData.destination
        ? String(formData.destination).trim()
        : "",
      budget: Number(formData.budget || 0),
      days: totalDays,
      travelersCount: Number(formData.travelersCount || 1),
      travelWithStrangers: Boolean(formData.travelWithStrangers),
      preferences: normalizeStringArray(formData.preferences),
      specialNote: formData.specialNote
        ? String(formData.specialNote).trim()
        : "",
      generatedTitle: itinerary?.generatedTitle || "",
      generatedSummary: itinerary?.generatedSummary || "",
      generatedItinerary: normalizeGeneratedItinerary(
        itinerary?.generatedItinerary
      ),
      estimatedCost: Number(itinerary?.estimatedCost || 0),
      status: "sent_to_admin",
      sentToAdmin: true,
    });

    return res.status(201).json({
      message: "Itinerary sent to admin successfully",
      itinerary: created,
    });
  } catch (error) {
    console.error("sendGeneratedItineraryToAdmin error:", error);
    return res.status(500).json({
      message: error.message || "Failed to send itinerary to admin",
    });
  }
};