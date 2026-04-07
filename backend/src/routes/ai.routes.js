import express from "express";
import {
  getPlacesByMood,
  getActivitiesByPlaces,
  createItinerary,
  saveItinerary,
  sendItineraryToAdmin,
  getSavedItineraries,
} from "../controllers/ai.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/places-by-mood", getPlacesByMood);
router.post("/activities-by-places", getActivitiesByPlaces);
router.post("/create-itinerary", createItinerary);

router.post("/save-itinerary", protect, saveItinerary);
router.post("/send-itinerary-to-admin", protect, sendItineraryToAdmin);
router.get("/saved-itineraries", protect, getSavedItineraries);

export default router;