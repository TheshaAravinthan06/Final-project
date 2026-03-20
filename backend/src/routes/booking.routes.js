import express from "express";
import {
  createBooking,
  getMyBookings,
  getMyBookingById,
  adminGetAllBookings,
  adminGetBookingById,
  adminUpdateBooking,
  adminDeleteBooking,
} from "../controllers/booking.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";

const router = express.Router();

// user routes
router.post("/", protect, createBooking);
router.get("/my-bookings", protect, getMyBookings);
router.get("/my-bookings/:id", protect, getMyBookingById);

// admin routes
router.get("/admin/all", protect, authorize("admin"), adminGetAllBookings);
router.get("/admin/:id", protect, authorize("admin"), adminGetBookingById);
router.patch("/admin/:id", protect, authorize("admin"), adminUpdateBooking);
router.delete("/admin/:id", protect, authorize("admin"), adminDeleteBooking);

export default router;