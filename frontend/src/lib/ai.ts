import api from "./axios";

export type GenerateItineraryPayload = {
  mood: string;
  destination?: string;
  days: number;
  budget?: number;
  travelersCount?: number;
  travelWithStrangers?: boolean;
  preferences?: string[];
  specialNote?: string;
  saveToDb?: boolean;
};

export const generateMoodItinerary = async (
  payload: GenerateItineraryPayload
) => {
  const res = await api.post("/ai/generate", payload);
  return res.data;
};