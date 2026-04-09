import express from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";
import {
  createBookingItinerary,
  getUserBookingItineraries,
  getAdminBookingItineraries,
  updateBookingItineraryStatus,
  deleteMyBookingItinerary,
} from "../controllers/bookingItinerary.controller.js";

const router = express.Router();

router.post("/", protect, createBookingItinerary);
router.get("/user", protect, getUserBookingItineraries);
router.get("/admin", protect, authorize("admin"), getAdminBookingItineraries);
router.patch("/:id/status", protect, authorize("admin"), updateBookingItineraryStatus);
router.delete("/:id", protect, deleteMyBookingItinerary);

export default router;