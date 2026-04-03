import mongoose from "mongoose";
import User from "../models/user.models.js";
import AdminNotification from "../models/adminNotification.models.js";
import PlaceReport from "../models/placeReport.models.js";
import Place from "../models/place.models.js";
import Booking from "../models/booking.models.js";
import Payment from "../models/payment.models.js";
import TravelPick from "../models/travelPick.models.js";
import Itinerary from "../models/itinerary.models.js";
import ProblemReport from "../models/problemReport.models.js";


// =============================
// DASHBOARD
// =============================
export const adminDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalBookings,
      totalPackages,
      totalPlaces,
      payments,
      bookings,
      recentBookings,
      recentPlaces,
      recentTravelPicks,
      pendingItineraries,
    ] = await Promise.all([
      User.countDocuments(),
      Booking.countDocuments(),
      TravelPick.countDocuments(),
      Place.countDocuments(),
      Payment.find({ status: "completed" }),
      Booking.find().populate("travelPick", "title"),
      Booking.find()
        .populate("travelPick", "title")
        .sort({ createdAt: -1 })
        .limit(5),
      Place.find().sort({ createdAt: -1 }).limit(5),
      TravelPick.find().sort({ createdAt: -1 }).limit(5),
      Itinerary.find({ status: "sent_to_admin" })
        .populate("user", "username")
        .sort({ createdAt: -1 })
        .limit(5),
    ]);

    // 🔥 SUMMARY
    const totalRevenue = payments.reduce(
      (sum, p) => sum + Number(p.amount || 0),
      0
    );

    const summary = {
      totalUsers,
      totalBookings,
      totalPackages,
      totalPlaces,
      pendingItineraries: pendingItineraries.length,
      totalRevenue,
    };

    // 🔥 BOOKING TREND (last 6 months)
    const now = new Date();
    const bookingTrend = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);

      const monthBookings = bookings.filter((b) => {
        const d = new Date(b.createdAt);
        return (
          d.getMonth() === date.getMonth() &&
          d.getFullYear() === date.getFullYear()
        );
      });

      const monthPayments = payments.filter((p) => {
        const d = new Date(p.createdAt);
        return (
          d.getMonth() === date.getMonth() &&
          d.getFullYear() === date.getFullYear()
        );
      });

      bookingTrend.push({
        month: date.toLocaleString("en-US", { month: "short" }),
        bookings: monthBookings.length,
        revenue: monthPayments.reduce(
          (sum, p) => sum + Number(p.amount || 0),
          0
        ),
      });
    }

    // 🔥 TOP PACKAGES
    const packageMap = {};

    bookings.forEach((b) => {
      const name = b.travelPick?.title || "Package";
      packageMap[name] = (packageMap[name] || 0) + 1;
    });

    const topPackages = Object.entries(packageMap)
      .map(([name, bookings]) => ({ name, bookings }))
      .sort((a, b) => b.bookings - a.bookings)
      .slice(0, 5);

    // 🔥 PAYMENT STATUS
    const paymentStatus = [
      {
        name: "Advance Paid",
        value: bookings.filter((b) => b.paymentStatus === "advance_paid").length,
      },
      {
        name: "Fully Paid",
        value: bookings.filter((b) => b.paymentStatus === "paid").length,
      },
      {
        name: "Pending",
        value: bookings.filter(
          (b) => b.paymentStatus === "pending" || b.paymentStatus === "unpaid"
        ).length,
      },
      {
        name: "Cancelled",
        value: bookings.filter((b) => b.bookingStatus === "cancelled").length,
      },
    ];

    // 🔥 RESPONSE (THIS IS THE IMPORTANT PART)
    return res.status(200).json({
      summary,
      bookingTrend,
      topPackages,
      paymentStatus,
      recentBookings,
      recentPlaces,
      recentTravelPicks,
      pendingItineraries,
    });
  } catch (error) {
    console.error("adminDashboardStats error:", error);
    res.status(500).json({ message: error.message });
  }
};


// =============================
// USERS
// =============================
export const adminGetAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-password -refreshTokenHash")
      .sort({ createdAt: -1 });

    res.status(200).json({ users });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const adminGetUserById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    const user = await User.findById(id).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const adminUpdateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!["admin", "user"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.role = role;
    await user.save();

    res.status(200).json({ message: "Role updated", user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// =============================
// 🔥 FIXED BLOCK USER (YOUR ERROR)
// =============================
export const adminBlockUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user?._id?.toString() === id) {
      return res.status(400).json({ message: "You cannot block yourself" });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.isActive = false;
    await user.save();

    res.status(200).json({
      message: "User blocked successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// =============================
// BOOKINGS (ADMIN VIEW)
// =============================
export const adminGetAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("user", "username email")
      .populate(
        "travelPick",
        "title place startDate endDate imageUrl"
      )
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// =============================
// PAYMENTS (ADMIN VIEW)
// =============================
export const adminGetAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate("user", "username email")
      .populate("booking")
      .populate("travelPick", "title place")
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: payments.length,
      payments,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// =============================
// NOTIFICATIONS
// =============================
export const adminGetNotifications = async (req, res) => {
  try {
    const notifications = await AdminNotification.find()
      .populate("actor", "username")
      .populate("travelPick", "title")
      .populate("booking")
      .populate("payment")
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: notifications.length,
      notifications,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const adminMarkNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await AdminNotification.findById(id);
    if (!notification)
      return res.status(404).json({ message: "Not found" });

    notification.isRead = true;
    await notification.save();

    res.status(200).json({ message: "Marked as read" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// =============================
// REPORTS
// =============================
export const adminGetReports = async (req, res) => {
  try {
    const placeReports = await PlaceReport.find()
      .populate("place", "placeName")
      .populate("reportedBy", "username");

    const problemReports = await ProblemReport.find()
      .populate("reportedBy", "username");

    res.status(200).json({
      placeReports,
      problemReports,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// =============================
// TOGGLE VISIBILITY
// =============================
export const adminTogglePlaceVisibility = async (req, res) => {
  try {
    const place = await Place.findById(req.params.id);

    if (!place) return res.status(404).json({ message: "Not found" });

    place.isPublished = !place.isPublished;
    await place.save();

    res.status(200).json({ place });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const adminToggleTravelPickVisibility = async (req, res) => {
  try {
    const pick = await TravelPick.findById(req.params.id);

    if (!pick) return res.status(404).json({ message: "Not found" });

    pick.isPublished = !pick.isPublished;
    await pick.save();

    res.status(200).json({ pick });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};