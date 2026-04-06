import BookingItinerary from "../models/bookingItinerary.models.js";

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
      budgetPreference,
      preferredTransport,
    } = req.body;

    if (!name || !phoneNumber || !email) {
      return res.status(400).json({
        message: "Name, phone number, and email are required",
      });
    }

    if (!itineraryText) {
      return res.status(400).json({
        message: "Itinerary is required",
      });
    }

    const booking = await BookingItinerary.create({
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
      budgetPreference,
      preferredTransport,
      status: "pending",
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
    const bookings = await BookingItinerary.find().sort({ createdAt: -1 });

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
    const bookings = await BookingItinerary.find().sort({ createdAt: -1 });

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
    const { status } = req.body;

    const booking = await BookingItinerary.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({ message: "Booking itinerary not found" });
    }

    return res.status(200).json({
      message: "Status updated successfully",
      booking,
    });
  } catch (error) {
    console.error("updateBookingItineraryStatus error:", error);
    return res.status(500).json({
      message: "Failed to update booking itinerary status",
      error: error.message,
    });
  }
};