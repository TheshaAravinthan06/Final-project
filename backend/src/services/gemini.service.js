import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const askGemini = async (prompt, retries = 2) => {
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      return response.text;
    } catch (error) {
      lastError = error;
      console.error(`Gemini attempt ${attempt + 1} failed:`, error.message);

      if (attempt < retries) {
        await sleep(2000);
      }
    }
  }

  throw lastError;
};

export const safeJsonParse = (text) => {
  try {
    return JSON.parse(text);
  } catch {
    const cleaned = text.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned);
  }
};