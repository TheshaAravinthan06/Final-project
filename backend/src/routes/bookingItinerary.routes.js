import express from "express";
import {
  createBookingItinerary,
  getUserBookingItineraries,
  getAdminBookingItineraries,
  updateBookingItineraryStatus,
} from "../controllers/bookingItinerary.controller.js";

const router = express.Router();

router.post("/", createBookingItinerary);
router.get("/user", getUserBookingItineraries);
router.get("/admin", getAdminBookingItineraries);
router.patch("/:id/status", updateBookingItineraryStatus);

export default router;