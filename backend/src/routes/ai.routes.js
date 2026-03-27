import express from "express";
import { generateMoodItinerary } from "../controllers/ai.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

// with login
router.post("/generate",  generateMoodItinerary);

// if you want temporary testing without login, use this instead:
// router.post("/generate", generateMoodItinerary);

export default router;