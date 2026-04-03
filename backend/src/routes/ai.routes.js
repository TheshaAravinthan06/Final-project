import express from "express";
import {
  generateMoodItinerary,
  saveGeneratedItinerary,
  sendGeneratedItineraryToAdmin,
} from "../controllers/ai.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/generate", generateMoodItinerary);
router.post("/save-itinerary", protect, saveGeneratedItinerary);
router.post("/send-itinerary-to-admin", protect, sendGeneratedItineraryToAdmin);

export default router;