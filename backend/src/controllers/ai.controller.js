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

    const prompt = `
You are a travel planner for a mood-based travel platform.

Create a personalized travel itinerary in valid JSON only.

User details:
- Mood: ${mood}
- Destination: ${destination || "Sri Lanka"}
- Days: ${totalDays}
- Budget: ${budget || 0}
- Travelers count: ${travelersCount || 1}
- Travel with strangers: ${travelWithStrangers ? "Yes" : "No"}
- Preferences: ${Array.isArray(preferences) ? preferences.join(", ") : preferences || ""}
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

    const response = await client.responses.create({
  model: "gpt-4.1-mini",
  input: prompt,
});

    const outputText = response.output_text;
    const parsed = cleanJson(outputText);

    let savedItinerary = null;

    if (saveToDb && req.user?._id) {
      savedItinerary = await Itinerary.create({
        user: req.user._id,
        mood: String(mood).trim(),
        destination: destination ? String(destination).trim() : "",
        budget: Number(budget || 0),
        days: totalDays,
        travelersCount: Number(travelersCount || 1),
        travelWithStrangers: Boolean(travelWithStrangers),
        preferences: Array.isArray(preferences)
          ? preferences
          : typeof preferences === "string"
          ? preferences.split(",").map((item) => item.trim()).filter(Boolean)
          : [],
        specialNote: specialNote ? String(specialNote).trim() : "",
        aiPrompt: prompt,
        generatedTitle: parsed.generatedTitle || "",
        generatedSummary: parsed.generatedSummary || "",
        generatedItinerary: parsed.generatedItinerary || [],
        estimatedCost: Number(parsed.estimatedCost || 0),
        status: "generated",
      });
    }

    return res.status(200).json({
      message: "Itinerary generated successfully",
      result: parsed,
      savedItinerary,
    });
  } catch (error) {
  console.error("generateMoodItinerary error:", error?.response?.data || error.message);

  return res.status(error?.status || 500).json({
    message:
      error?.response?.data?.error?.message ||
      error?.message ||
      "Failed to generate itinerary",
  });
}
};