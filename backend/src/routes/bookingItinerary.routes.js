import express from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";
import uploadTravelPickImage from "../middlewares/travelPickUpload.middleware.js";
import {
  createBookingItinerary,
  getUserBookingItineraries,
  getAdminBookingItineraries,
  updateBookingItineraryStatus,
  createTravelPickFromBookingItinerary,
  getBookingItineraryPackagePrefill,
  deleteMyBookingItinerary,
} from "../controllers/bookingItinerary.controller.js";

const router = express.Router();

router.post("/", protect, createBookingItinerary);

router.get("/user", protect, getUserBookingItineraries);

router.get("/admin", protect, authorize("admin"), getAdminBookingItineraries);

router.get(
  "/:id/package-prefill",
  protect,
  authorize("admin"),
  getBookingItineraryPackagePrefill
);

router.patch(
  "/:id/status",
  protect,
  authorize("admin"),
  updateBookingItineraryStatus
);

router.post(
  "/:id/add-to-package",
  protect,
  authorize("admin"),
  uploadTravelPickImage.single("image"),
  createTravelPickFromBookingItinerary
);

router.delete("/:id", protect, deleteMyBookingItinerary);

export default router;