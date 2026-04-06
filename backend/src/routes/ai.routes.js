import express from "express";
import {
  getPlacesByMood,
  getActivitiesByPlaces,
  createItinerary,
  saveItinerary,
  sendItineraryToAdmin,
  getSavedItineraries,
} from "../controllers/ai.controller.js";

const router = express.Router();

router.post("/places-by-mood", getPlacesByMood);
router.post("/activities-by-places", getActivitiesByPlaces);
router.post("/create-itinerary", createItinerary);
router.post("/save-itinerary", saveItinerary);
router.post("/send-itinerary-to-admin", sendItineraryToAdmin);
router.get("/saved-itineraries", getSavedItineraries);

export default router;