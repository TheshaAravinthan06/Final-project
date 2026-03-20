import mongoose from "mongoose";
import Booking from "../models/booking.models.js";
import TravelPick from "../models/travelPick.models.js";

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const subtractDays = (dateInput, days) => {
  const date = new Date(dateInput);
  date.setDate(date.getDate() - days);
  return date;
};

const startOfToday = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

const isBookingStillOpen = (startDate) => {
  const bookingCloseDate = subtractDays(startDate, 3);
  const today = startOfToday();
  const bookingCloseDay = new Date(
    bookingCloseDate.getFullYear(),
    bookingCloseDate.getMonth(),
    bookingCloseDate.getDate()
  );

  return today < bookingCloseDay;
};

const formatBookingResponse = (booking) => {
  const obj = booking.toObject ? booking.toObject() : booking;

  let balanceDueDate = null;

  if (obj.travelPick?.startDate) {
    balanceDueDate = subtractDays(obj.travelPick.startDate, 2);
  }

  return {
    ...obj,
    balanceDueDate,
  };
};

// USER - CREATE BOOKING
export const createBooking = async (req, res) => {
  try {
    const {
      travelPickId,
      fullName,
      email,
      phone,
      travelersCount,
      specialNote,
    } = req.body;

    if (!travelPickId || !isValidObjectId(travelPickId)) {
      return res.status(400).json({ message: "Valid travel pick id is required" });
    }

    if (!fullName || !email || !phone) {
      return res.status(400).json({
        message: "Full name, email, and phone are required",
      });
    }

    const travelPick = await TravelPick.findOne({
      _id: travelPickId,
      isPublished: true,
    });

    if (!travelPick) {
      return res.status(404).json({ message: "Travel pick not found" });
    }

    if (!isBookingStillOpen(travelPick.startDate)) {
      return res.status(400).json({
        message:
          "Booking is closed for this trip. Reservations close 3 days before departure.",
      });
    }

    const count = Number(travelersCount || 1);

    if (Number.isNaN(count) || count < 1) {
      return res.status(400).json({
        message: "Travelers count must be at least 1",
      });
    }

    const unitPrice = Number(travelPick.price);
    const totalPrice = unitPrice * count;
    const advancePercentage = Number(travelPick.advancePercentage || 0);
    const advanceAmount = (totalPrice * advancePercentage) / 100;
    const remainingAmount = totalPrice - advanceAmount;

    const booking = await Booking.create({
      user: req.user._id,
      travelPick: travelPick._id,
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      travelersCount: count,
      specialNote: specialNote ? specialNote.trim() : "",
      unitPrice,
      totalPrice,
      advancePercentage,
      advanceAmount,
      remainingAmount,
    });

    await TravelPick.findByIdAndUpdate(travelPick._id, {
      $inc: { bookingCount: 1 },
    });

    const populatedBooking = await Booking.findById(booking._id)
      .populate("user", "username email")
      .populate(
        "travelPick",
        "title place imageUrl startDate endDate caption price advancePercentage"
      );

    return res.status(201).json({
      message: "Booking created successfully",
      booking: formatBookingResponse(populatedBooking),
    });
  } catch (error) {
    console.error("createBooking error:", error);
    return res.status(500).json({ message: error.message });
  }
};

// USER - GET MY BOOKINGS
export const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate(
        "travelPick",
        "title place imageUrl startDate endDate caption price advancePercentage"
      )
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: bookings.length,
      bookings: bookings.map((item) => formatBookingResponse(item)),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// USER - GET MY SINGLE BOOKING
export const getMyBookingById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid booking id" });
    }

    const booking = await Booking.findOne({
      _id: id,
      user: req.user._id,
    })
      .populate(
        "travelPick",
        "title place imageUrl startDate endDate caption price advancePercentage"
      )
      .populate("user", "username email");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    return res.status(200).json({
      booking: formatBookingResponse(booking),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ADMIN - GET ALL BOOKINGS
export const adminGetAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("user", "username email role")
      .populate(
        "travelPick",
        "title place imageUrl startDate endDate price advancePercentage"
      )
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: bookings.length,
      bookings: bookings.map((item) => formatBookingResponse(item)),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ADMIN - GET SINGLE BOOKING
export const adminGetBookingById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid booking id" });
    }

    const booking = await Booking.findById(id)
      .populate("user", "username email role")
      .populate(
        "travelPick",
        "title place imageUrl startDate endDate caption price advancePercentage"
      );

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    return res.status(200).json({
      booking: formatBookingResponse(booking),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ADMIN - UPDATE BOOKING
export const adminUpdateBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { bookingStatus, paymentStatus } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid booking id" });
    }

    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (bookingStatus !== undefined) {
      booking.bookingStatus = bookingStatus;
    }

    if (paymentStatus !== undefined) {
      booking.paymentStatus = paymentStatus;
    }

    await booking.save();

    const updatedBooking = await Booking.findById(booking._id)
      .populate("user", "username email role")
      .populate(
        "travelPick",
        "title place imageUrl startDate endDate caption price advancePercentage"
      );

    return res.status(200).json({
      message: "Booking updated successfully",
      booking: formatBookingResponse(updatedBooking),
    });
  } catch (error) {
    console.error("adminUpdateBooking error:", error);
    return res.status(500).json({ message: error.message });
  }
};

// ADMIN - DELETE BOOKING
export const adminDeleteBooking = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid booking id" });
    }

    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    await booking.deleteOne();

    return res.status(200).json({
      message: "Booking deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};