import mongoose from "mongoose";
import BookingItinerary from "../models/bookingItinerary.models.js";
import UserNotification from "../models/userNotification.models.js";
import AdminNotification from "../models/adminNotification.models.js";

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

export const createBookingItinerary = async (req, res) => {
  try {
    const {
      itineraryText,
      mood,
      selectedPlaces,
      selectedActivities,
      days,
      specificDate,
      peopleCount,
      travelCompanions,
      customCompanionNote,
      extraNotes,

      name,
      phoneNumber,
      email,
      adults,
      children,
      accommodationType,
      foodType,
      notes,
      budgetPreference,
      preferredTransport,
    } = req.body;

    if (!name || !phoneNumber || !email) {
      return res.status(400).json({
        message: "Name, phone number, and email are required",
      });
    }

    if (!itineraryText || !mood || !days || !peopleCount) {
      return res.status(400).json({
        message: "Required itinerary details are missing",
      });
    }

    const booking = await BookingItinerary.create({
      user: req.user?._id || null,

      itineraryText,
      mood,
      selectedPlaces: Array.isArray(selectedPlaces) ? selectedPlaces : [],
      selectedActivities: Array.isArray(selectedActivities)
        ? selectedActivities
        : [],
      days: Number(days),
      specificDate: specificDate || "",
      peopleCount: Number(peopleCount),
      travelCompanions: Array.isArray(travelCompanions)
        ? travelCompanions
        : [],
      customCompanionNote: customCompanionNote || "",
      extraNotes: extraNotes || "",

      name: String(name).trim(),
      phoneNumber: String(phoneNumber).trim(),
      email: String(email).trim().toLowerCase(),

      adults: Number(adults || 0),
      children: Number(children || 0),
      accommodationType: accommodationType || "hotel_or_rooms",
      foodType: foodType || "non_veg",
      notes: notes || "",
      budgetPreference: budgetPreference || "",
      preferredTransport: preferredTransport || "car",

      status: "pending",
      adminNote: "",
    });

    await AdminNotification.create({
      type: "itinerary",
      title: "New itinerary request",
      message: `${booking.name} sent a new itinerary request.`,
      entityType: "itinerary",
      entityId: booking._id,
      isRead: false,
    });

    return res.status(201).json({
      message: "Itinerary sent to admin successfully",
      booking,
    });
  } catch (error) {
    console.error("createBookingItinerary error:", error);
    return res.status(500).json({
      message: "Failed to send itinerary to admin",
      error: error.message,
    });
  }
};

export const getUserBookingItineraries = async (req, res) => {
  try {
    const filter = req.user?._id
      ? { user: req.user._id }
      : { email: req.user?.email || "__no_match__" };

    const bookings = await BookingItinerary.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({ bookings });
  } catch (error) {
    console.error("getUserBookingItineraries error:", error);
    return res.status(500).json({
      message: "Failed to fetch sent itineraries",
      error: error.message,
    });
  }
};

export const getAdminBookingItineraries = async (req, res) => {
  try {
    const bookings = await BookingItinerary.find()
      .populate("user", "username email profileImage")
      .sort({ createdAt: -1 });

    return res.status(200).json({ bookings });
  } catch (error) {
    console.error("getAdminBookingItineraries error:", error);
    return res.status(500).json({
      message: "Failed to fetch admin booking itineraries",
      error: error.message,
    });
  }
};

export const updateBookingItineraryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNote } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid itinerary id" });
    }

    const allowedStatuses = [
      "pending",
      "in_review",
      "approved",
      "rejected",
      "completed",
    ];

    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const booking = await BookingItinerary.findById(id);

    if (!booking) {
      return res.status(404).json({ message: "Booking itinerary not found" });
    }

    booking.status = status;
    booking.adminNote = typeof adminNote === "string" ? adminNote.trim() : "";
    await booking.save();

    if (booking.user) {
      await UserNotification.create({
        recipient: booking.user,
        actor: req.user?._id || null,
        type: "system",
        title: "Itinerary updated",
        message: `Your itinerary request is now ${status.replace("_", " ")}.${booking.adminNote ? ` Admin note: ${booking.adminNote}` : ""}`,
        entityType: "itinerary",
        entityId: booking._id,
        isRead: false,
      });
    }

    const updatedBooking = await BookingItinerary.findById(id).populate(
      "user",
      "username email profileImage"
    );

    return res.status(200).json({
      message: "Status updated successfully",
      booking: updatedBooking,
    });
  } catch (error) {
    console.error("updateBookingItineraryStatus error:", error);
    return res.status(500).json({
      message: "Failed to update booking itinerary status",
      error: error.message,
    });
  }
};

export const deleteMyBookingItinerary = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid itinerary id" });
    }

    const booking = await BookingItinerary.findOne({
      _id: id,
      user: req.user._id,
    });

    if (!booking) {
      return res.status(404).json({ message: "Sent itinerary not found" });
    }

    await BookingItinerary.findByIdAndDelete(id);

    return res.status(200).json({
      message: "Sent itinerary deleted successfully",
    });
  } catch (error) {
    console.error("deleteMyBookingItinerary error:", error);
    return res.status(500).json({
      message: "Failed to delete sent itinerary",
    });
  }
};