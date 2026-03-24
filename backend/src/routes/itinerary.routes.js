import express from "express";
import {
  createItinerary,
  getMyItineraries,
  getMyItineraryById,
  updateMyItinerary,
  deleteMyItinerary,
  adminGetAllItineraries,
  adminGetItineraryById,
  adminUpdateItinerary,
  adminDeleteItinerary,
} from "../controllers/itinerary.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";

const router = express.Router();

// user routes
router.post("/", protect, createItinerary);
router.get("/my-itineraries", protect, getMyItineraries);
router.get("/my-itineraries/:id", protect, getMyItineraryById);
router.patch("/my-itineraries/:id", protect, updateMyItinerary);
router.delete("/my-itineraries/:id", protect, deleteMyItinerary);

// admin routes
router.get("/admin/all", protect, authorize("admin"), adminGetAllItineraries);
router.get("/admin/:id", protect, authorize("admin"), adminGetItineraryById);
router.patch("/admin/:id", protect, authorize("admin"), adminUpdateItinerary);
router.delete("/admin/:id", protect, authorize("admin"), adminDeleteItinerary);

export default router;