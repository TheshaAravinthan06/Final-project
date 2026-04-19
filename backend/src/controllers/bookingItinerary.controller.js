import mongoose from "mongoose";
import BookingItinerary from "../models/bookingItinerary.models.js";
import TravelPick from "../models/travelPick.models.js";
import UserNotification from "../models/userNotification.models.js";
import AdminNotification from "../models/adminNotification.models.js";
import User from "../models/user.models.js";
import { createBulkUserNotifications } from "../utils/createUserNotification.js";

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const parseArrayField = (value) => {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const toBoolean = (value, fallback = true) => {
  if (value === undefined || value === null || value === "") return fallback;
  return String(value).toLowerCase() !== "false";
};

const addDaysToDateString = (dateString, days = 1) => {
  const base = new Date(dateString);

  if (Number.isNaN(base.getTime())) {
    return "";
  }

  base.setDate(base.getDate() + Number(days || 0));
  return base.toISOString().split("T")[0];
};

const getAccommodationLabel = (value = "") => {
  const map = {
    hotel_or_rooms: "Hotel / Rooms",
    rented_house: "Rented House",
    hostel_or_dorm: "Hostel / Dorm",
    camping: "Camping",
  };

  return map[value] || "";
};

const getFoodLabel = (value = "") => {
  const map = {
    veg: "Veg Meals",
    non_veg: "Non-Veg Meals",
  };

  return map[value] || "";
};

const getTransportLabel = (value = "") => {
  const map = {
    car: "Car transport",
    van: "Van transport",
    bus: "Bus transport",
  };

  return map[value] || "";
};

const buildSuggestedTitle = (booking) => {
  const mainPlace = booking.selectedPlaces?.[0] || booking.placePreference || "Sri Lanka";
  const mood = booking.mood ? `${booking.mood} ` : "";
  return `${mood}${mainPlace} Group Travel Package`.trim();
};

const buildSuggestedCaption = (booking) => {
  const places = booking.selectedPlaces?.slice(0, 3).join(", ");
  const daysText = booking.days ? `${booking.days} day trip` : "Group trip";

  if (places) {
    return `${daysText} covering ${places}. Perfect for travelers looking for a shared experience.`;
  }

  return `${daysText} designed for travelers looking for a shared experience.`;
};

const buildSuggestedMoreDetails = (booking) => {
  const lines = [];

  if (booking.itineraryText) {
    lines.push(`Generated Itinerary:\n${booking.itineraryText}`);
  }

  if (booking.selectedActivities?.length) {
    const activityText = booking.selectedActivities
      .map((group) => {
        const activities = Array.isArray(group.activities)
          ? group.activities.join(", ")
          : "";
        return activities ? `${group.place}: ${activities}` : group.place;
      })
      .join("\n");

    if (activityText) {
      lines.push(`Selected Activities:\n${activityText}`);
    }
  }

  if (booking.extraNotes) {
    lines.push(`Extra Notes:\n${booking.extraNotes}`);
  }

  if (booking.customCompanionNote) {
    lines.push(`Companion Note:\n${booking.customCompanionNote}`);
  }

  if (booking.notes) {
    lines.push(`User Notes:\n${booking.notes}`);
  }

  if (booking.budgetPreference) {
    lines.push(`Budget Preference:\n${booking.budgetPreference}`);
  }

  return lines.join("\n\n").trim();
};

export const createBookingItinerary = async (req, res) => {
  try {
    const {
      itineraryText,
      mood,
      travelPreference,
      selectedPlaces,
      selectedActivities,
      days,
      specificDate,
      peopleCount,
      travelCompanions,
      customCompanionNote,
      extraNotes,
      needsCompanion,
      companionCount,
      companionType,
      companionMatchBasis,
      placePreference,
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
      transportPreference,
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
      travelPreference: travelPreference || "",
      selectedPlaces: Array.isArray(selectedPlaces) ? selectedPlaces : [],
      selectedActivities: Array.isArray(selectedActivities) ? selectedActivities : [],
      days: Number(days),
      specificDate: specificDate || "",
      peopleCount: Number(peopleCount),
      travelCompanions: Array.isArray(travelCompanions) ? travelCompanions : [],
      customCompanionNote: customCompanionNote || "",
      extraNotes: extraNotes || "",
      needsCompanion: Boolean(needsCompanion),
      companionCount: companionCount || "",
      companionType: companionType || "",
      companionMatchBasis: companionMatchBasis || "",
      placePreference: placePreference || "",
      name: String(name).trim(),
      phoneNumber: String(phoneNumber).trim(),
      email: String(email).trim().toLowerCase(),
      adults: Number(adults || 0),
      children: Number(children || 0),
      accommodationType: accommodationType || "hotel_or_rooms",
      foodType: foodType || "non_veg",
      notes: notes || "",
      budgetPreference: budgetPreference || "",
      preferredTransport: preferredTransport || transportPreference || "car",
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

    const bookings = await BookingItinerary.find(filter)
      .populate("travelPickId", "title place imageUrl startDate endDate price isPublished")
      .sort({ createdAt: -1 });

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
      .populate("travelPickId", "title place imageUrl startDate endDate price isPublished")
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

    const updatedBooking = await BookingItinerary.findById(id)
      .populate("user", "username email profileImage")
      .populate("travelPickId", "title place imageUrl startDate endDate price isPublished");

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

export const getBookingItineraryPackagePrefill = async (req, res) => {
  const fit = (value, max) => {
    if (value === undefined || value === null) return "";
    return String(value).trim().slice(0, max);
  };

  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid itinerary id" });
    }

    const booking = await BookingItinerary.findById(id);

    if (!booking) {
      return res.status(404).json({ message: "Booking itinerary not found" });
    }

    const mainPlace = fit(
      booking.selectedPlaces?.[0] || booking.placePreference || "",
      120
    );

    const startDate = booking.specificDate || "";
    const endDate =
      booking.specificDate && booking.days
        ? addDaysToDateString(booking.specificDate, Math.max(booking.days - 1, 0))
        : "";

    const placesToVisit = Array.isArray(booking.selectedPlaces)
      ? booking.selectedPlaces.join(", ")
      : "";

    const accommodation = fit(
      getAccommodationLabel(booking.accommodationType),
      180
    );
    const meals = fit(getFoodLabel(booking.foodType), 180);
    const transportation = fit(
      getTransportLabel(booking.preferredTransport),
      180
    );

    const prefill = {
      title: fit(buildSuggestedTitle(booking), 120),
      place: mainPlace,
      startDate,
      endDate,
      caption: fit(buildSuggestedCaption(booking), 240),
      price: "",
      placesToVisit,
      accommodation,
      meals,
      transportation,
      tourGuide: fit(
        booking.needsCompanion
          ? "Coordinator can be assigned by admin"
          : "",
        180
      ),
      paymentInfo: fit(
        booking.budgetPreference
          ? `Budget preference: ${booking.budgetPreference}`
          : "",
        220
      ),
      moreDetails: fit(buildSuggestedMoreDetails(booking), 1200),
      advancePolicy: "30% advance payment is required to confirm the booking.",
      advancePercentage: 30,
      cancellationPolicy:
        "No cancellation after confirmation due to travel arrangements.",
      refundPolicy: "Advance payment is non-refundable after confirmation.",
      isPublished: true,
      adminNote: booking.adminNote || "",
      markStatusApproved: true,
    };

    return res.status(200).json({ prefill });
  } catch (error) {
    console.error("getBookingItineraryPackagePrefill error:", error);
    return res.status(500).json({
      message: error.message || "Failed to get package prefill data",
    });
  }
};

export const createTravelPickFromBookingItinerary = async (req, res) => {
  const fit = (value, max) => {
    if (value === undefined || value === null) return "";
    return String(value).trim().slice(0, max);
  };

  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid itinerary id" });
    }

    const booking = await BookingItinerary.findById(id);

    if (!booking) {
      return res.status(404).json({ message: "Booking itinerary not found" });
    }

    if (booking.addedToPackage && booking.travelPickId) {
      return res.status(400).json({
        message: "This itinerary was already added to a package",
      });
    }

    const title = fit(req.body.title, 120);
    const place = fit(req.body.place, 120);
    const startDate = req.body.startDate?.trim();
    const endDate = req.body.endDate?.trim();
    const caption = fit(req.body.caption, 240);
    const price = req.body.price?.trim();

    const placesToVisit = req.body.placesToVisit;
    const accommodation = fit(req.body.accommodation, 180);
    const meals = fit(req.body.meals, 180);
    const transportation = fit(req.body.transportation, 180);
    const tourGuide = fit(req.body.tourGuide, 180);
    const paymentInfo = fit(req.body.paymentInfo, 220);
    const moreDetails = fit(req.body.moreDetails, 1200);
    const advancePolicy = fit(
      req.body.advancePolicy ||
        "30% advance payment is required to confirm the booking.",
      180
    );
    const advancePercentage = req.body.advancePercentage;
    const cancellationPolicy = fit(
      req.body.cancellationPolicy ||
        "No cancellation after confirmation due to travel arrangements.",
      180
    );
    const refundPolicy = fit(
      req.body.refundPolicy ||
        "Advance payment is non-refundable after confirmation.",
      180
    );
    const isPublished = req.body.isPublished;
    const adminNote = fit(req.body.adminNote, 1000);
    const markStatusApproved = req.body.markStatusApproved;

    if (!req.file) {
      return res.status(400).json({ message: "Image is required" });
    }

    if (!title || !place || !startDate || !endDate || !caption || !price) {
      return res.status(400).json({
        message:
          "Title, place, start date, end date, caption, and price are required",
      });
    }

    const imageUrl = `/uploads/travel-picks/${req.file.filename}`;

   const createdTravelPick = await TravelPick.create({
  title,
  place,
  imageUrl,
  startDate,
  endDate,
  caption,
  placesToVisit: parseArrayField(placesToVisit),
  accommodation,
  meals,
  transportation,
  tourGuide,
  paymentInfo,
  moreDetails,
  advancePolicy,
  advancePercentage:
    advancePercentage !== undefined && advancePercentage !== ""
      ? Number(advancePercentage)
      : 30,
  cancellationPolicy,
  refundPolicy,
  price: Number(price),
  isPublished: toBoolean(isPublished, true),
  sourceType: "itinerary_request",
  sourceBookingItineraryId: booking._id,
  createdBy: req.user._id,
});

    booking.addedToPackage = true;
    booking.travelPickId = createdTravelPick._id;
    booking.packageCreatedAt = new Date();

    if (String(markStatusApproved) === "true") {
      booking.status = "approved";
    }

    if (adminNote) {
      booking.adminNote = adminNote;
    }

    await booking.save();

    // notifications should never break package creation
    try {
      const users = await User.find({
        role: "user",
        isActive: true,
      }).select("_id");

      await createBulkUserNotifications({
        recipients: users.map((user) => user._id),
        actor: req.user._id,
        type: "travel_pick",
        title: "New travel pick",
        message: `A new travel pick "${title}" is now available`,
        entityType: "travel_pick",
        entityId: createdTravelPick._id,
        previewImage: imageUrl,
      });

      if (booking.user) {
        await UserNotification.create({
          recipient: booking.user,
          actor: req.user?._id || null,
          type: "system",
          title: "Your itinerary became a package",
          message: `Your itinerary request has been converted into a travel package.${adminNote ? ` Admin note: ${adminNote}` : ""}`,
          entityType: "travel_pick",
          entityId: createdTravelPick._id,
          isRead: false,
        });
      }
    } catch (notifyError) {
      console.error(
        "createTravelPickFromBookingItinerary notification error:",
        notifyError
      );
    }

    return res.status(201).json({
      message: "Travel pick created from itinerary successfully",
      booking,
      travelPick: createdTravelPick,
    });
  } catch (error) {
    console.error("createTravelPickFromBookingItinerary error:", error);
    return res.status(500).json({
      message: error.message || "Failed to add itinerary to package",
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