import mongoose from "mongoose";
import TravelPick from "../models/travelPick.models.js";
import User from "../models/user.models.js";
import {
  createBulkUserNotifications,
} from "../utils/createUserNotification.js";

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

const subtractDays = (dateInput, days) => {
  const date = new Date(dateInput);
  date.setDate(date.getDate() - days);
  return date;
};

const startOfToday = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

const formatTravelPickResponse = (travelPick) => {
  const obj = travelPick.toObject ? travelPick.toObject() : travelPick;

  const advancePercentage = Number(obj.advancePercentage || 0);
  const price = Number(obj.price || 0);
  const advanceAmount = (price * advancePercentage) / 100;
  const remainingAmount = price - advanceAmount;

  const bookingCloseDate = subtractDays(obj.startDate, 3);
  const balanceDueDate = subtractDays(obj.startDate, 2);

  const today = startOfToday();
  const bookingCloseDay = new Date(
    bookingCloseDate.getFullYear(),
    bookingCloseDate.getMonth(),
    bookingCloseDate.getDate()
  );

  const isBookingOpen = today < bookingCloseDay;

  return {
    ...obj,
    advanceAmount,
    remainingAmount,
    bookingCloseDate,
    balanceDueDate,
    isBookingOpen,
  };
};

// ADMIN - CREATE TRAVEL PICK
export const createTravelPick = async (req, res) => {
  try {
    const title = req.body.title?.trim();
    const place = req.body.place?.trim();
    const startDate = req.body.startDate?.trim();
    const endDate = req.body.endDate?.trim();
    const caption = req.body.caption?.trim();
    const price = req.body.price?.trim();

    const placesToVisit = req.body.placesToVisit;
    const accommodation = req.body.accommodation;
    const meals = req.body.meals;
    const transportation = req.body.transportation;
    const tourGuide = req.body.tourGuide;
    const paymentInfo = req.body.paymentInfo;
    const moreDetails = req.body.moreDetails;
    const advancePolicy = req.body.advancePolicy;
    const advancePercentage = req.body.advancePercentage;
    const cancellationPolicy = req.body.cancellationPolicy;
    const refundPolicy = req.body.refundPolicy;
    const isPublished = req.body.isPublished;

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
      accommodation: accommodation ? accommodation.trim() : "",
      meals: meals ? meals.trim() : "",
      transportation: transportation ? transportation.trim() : "",
      tourGuide: tourGuide ? tourGuide.trim() : "",
      paymentInfo: paymentInfo ? paymentInfo.trim() : "",
      moreDetails: moreDetails ? moreDetails.trim() : "",
      advancePolicy: advancePolicy
        ? advancePolicy.trim()
        : "30% advance payment is required to confirm the booking.",
      advancePercentage:
        advancePercentage !== undefined && advancePercentage !== ""
          ? Number(advancePercentage)
          : 30,
      cancellationPolicy: cancellationPolicy
        ? cancellationPolicy.trim()
        : "No cancellation after confirmation due to travel arrangements.",
      refundPolicy: refundPolicy
        ? refundPolicy.trim()
        : "Advance payment is non-refundable after confirmation.",
      price: Number(price),
      isPublished: toBoolean(isPublished, true),
      createdBy: req.user._id,
    });

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

    const populatedTravelPick = await TravelPick.findById(
      createdTravelPick._id
    ).populate("createdBy", "username email role");

    return res.status(201).json({
      message: "Travel pick created successfully",
      travelPick: formatTravelPickResponse(populatedTravelPick),
    });
  } catch (error) {
    console.error("createTravelPick error:", error);
    return res.status(500).json({ message: error.message });
  }
};

// PUBLIC - GET ALL PUBLISHED TRAVEL PICKS
export const getAllTravelPicks = async (req, res) => {
  try {
    const travelPicks = await TravelPick.find({ isPublished: true })
      .populate("createdBy", "username")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: travelPicks.length,
      travelPicks: travelPicks.map((item) => formatTravelPickResponse(item)),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// PUBLIC - GET SINGLE PUBLISHED TRAVEL PICK
export const getTravelPickById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid travel pick id" });
    }

    const travelPick = await TravelPick.findOne({
      _id: id,
      isPublished: true,
    }).populate("createdBy", "username");

    if (!travelPick) {
      return res.status(404).json({ message: "Travel pick not found" });
    }

    return res.status(200).json({
      travelPick: formatTravelPickResponse(travelPick),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ADMIN - GET ALL TRAVEL PICKS
export const adminGetAllTravelPicks = async (req, res) => {
  try {
    const travelPicks = await TravelPick.find()
      .populate("createdBy", "username email role")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: travelPicks.length,
      travelPicks: travelPicks.map((item) => formatTravelPickResponse(item)),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ADMIN - GET SINGLE TRAVEL PICK
export const adminGetTravelPickById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid travel pick id" });
    }

    const travelPick = await TravelPick.findById(id).populate(
      "createdBy",
      "username email role"
    );

    if (!travelPick) {
      return res.status(404).json({ message: "Travel pick not found" });
    }

    return res.status(200).json({
      travelPick: formatTravelPickResponse(travelPick),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ADMIN - UPDATE TRAVEL PICK
export const updateTravelPick = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid travel pick id" });
    }

    const travelPick = await TravelPick.findById(id);

    if (!travelPick) {
      return res.status(404).json({ message: "Travel pick not found" });
    }

    const {
      title,
      place,
      startDate,
      endDate,
      caption,
      placesToVisit,
      accommodation,
      meals,
      transportation,
      tourGuide,
      paymentInfo,
      moreDetails,
      advancePolicy,
      advancePercentage,
      cancellationPolicy,
      refundPolicy,
      price,
      isPublished,
    } = req.body;

    if (req.file) {
      travelPick.imageUrl = `/uploads/travel-picks/${req.file.filename}`;
    }

    if (title !== undefined) {
      travelPick.title = title.trim();
    }

    if (place !== undefined) {
      travelPick.place = place.trim();
    }

    if (startDate !== undefined) {
      travelPick.startDate = startDate;
    }

    if (endDate !== undefined) {
      travelPick.endDate = endDate;
    }

    if (caption !== undefined) {
      travelPick.caption = caption.trim();
    }

    if (placesToVisit !== undefined) {
      travelPick.placesToVisit = parseArrayField(placesToVisit);
    }

    if (accommodation !== undefined) {
      travelPick.accommodation = accommodation.trim();
    }

    if (meals !== undefined) {
      travelPick.meals = meals.trim();
    }

    if (transportation !== undefined) {
      travelPick.transportation = transportation.trim();
    }

    if (tourGuide !== undefined) {
      travelPick.tourGuide = tourGuide.trim();
    }

    if (paymentInfo !== undefined) {
      travelPick.paymentInfo = paymentInfo.trim();
    }

    if (moreDetails !== undefined) {
      travelPick.moreDetails = moreDetails.trim();
    }

    if (advancePolicy !== undefined) {
      travelPick.advancePolicy = advancePolicy.trim();
    }

    if (advancePercentage !== undefined && advancePercentage !== "") {
      travelPick.advancePercentage = Number(advancePercentage);
    }

    if (cancellationPolicy !== undefined) {
      travelPick.cancellationPolicy = cancellationPolicy.trim();
    }

    if (refundPolicy !== undefined) {
      travelPick.refundPolicy = refundPolicy.trim();
    }

    if (price !== undefined) {
      travelPick.price = Number(price);
    }

    if (isPublished !== undefined) {
      travelPick.isPublished = toBoolean(isPublished, true);
    }

    await travelPick.save();

    const updatedTravelPick = await TravelPick.findById(travelPick._id).populate(
      "createdBy",
      "username email role"
    );

    return res.status(200).json({
      message: "Travel pick updated successfully",
      travelPick: formatTravelPickResponse(updatedTravelPick),
    });
  } catch (error) {
    console.error("updateTravelPick error:", error);
    return res.status(500).json({ message: error.message });
  }
};

// ADMIN - DELETE TRAVEL PICK
export const deleteTravelPick = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid travel pick id" });
    }

    const travelPick = await TravelPick.findById(id);

    if (!travelPick) {
      return res.status(404).json({ message: "Travel pick not found" });
    }

    await travelPick.deleteOne();

    return res.status(200).json({
      message: "Travel pick deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};