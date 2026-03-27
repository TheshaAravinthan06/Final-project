import mongoose from "mongoose";
import User from "../models/user.models.js";
import AdminNotification from "../models/adminNotification.models.js";
import PlaceReport from "../models/placeReport.models.js";
import Place from "../models/place.models.js";
import Booking from "../models/booking.models.js";
import Payment from "../models/payment.models.js";
import TravelPick from "../models/travelPick.models.js";
import Itinerary from "../models/itinerary.models.js";

export const adminDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalBookings,
      totalPackages,
      totalPlaces,
      pendingItinerariesCount,
      payments,
      allBookings,
      recentBookings,
      recentPlaces,
      recentTravelPicks,
      pendingItineraries,
      unreadNotifications,
      totalReports,
    ] = await Promise.all([
      User.countDocuments(),
      Booking.countDocuments(),
      TravelPick.countDocuments(),
      Place.countDocuments(),
      Itinerary.countDocuments({ status: "sent_to_admin" }),
      Payment.find({}).sort({ createdAt: -1 }),
      Booking.find()
        .populate("travelPick", "title")
        .sort({ createdAt: -1 }),
      Booking.find()
        .populate("travelPick", "title")
        .sort({ createdAt: -1 })
        .limit(5),
      Place.find().sort({ createdAt: -1 }).limit(4),
      TravelPick.find().sort({ createdAt: -1 }).limit(4),
      Itinerary.find({ status: "sent_to_admin" })
        .populate("user", "username")
        .sort({ createdAt: -1 })
        .limit(5),
      AdminNotification.countDocuments({ isRead: false }),
      PlaceReport.countDocuments(),
    ]);

    const totalRevenue = payments
      .filter((payment) => payment.status === "completed")
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    const paymentStatus = [
      {
        name: "Advance Paid",
        value: allBookings.filter((b) => b.paymentStatus === "advance_paid")
          .length,
      },
      {
        name: "Fully Paid",
        value: allBookings.filter((b) => b.paymentStatus === "paid").length,
      },
      {
        name: "Pending",
        value: allBookings.filter(
          (b) => b.paymentStatus === "pending" || b.paymentStatus === "unpaid"
        ).length,
      },
      {
        name: "Cancelled",
        value: allBookings.filter((b) => b.bookingStatus === "cancelled")
          .length,
      },
    ];

    const now = new Date();
    const bookingTrend = [];

    for (let i = 5; i >= 0; i--) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const targetMonth = targetDate.getMonth();
      const targetYear = targetDate.getFullYear();

      const monthLabel = targetDate.toLocaleString("en-US", {
        month: "short",
      });

      const monthBookings = allBookings.filter((booking) => {
        const created = new Date(booking.createdAt);
        return (
          created.getMonth() === targetMonth &&
          created.getFullYear() === targetYear
        );
      });

      const monthPayments = payments.filter((payment) => {
        const created = new Date(payment.createdAt);
        return (
          payment.status === "completed" &&
          created.getMonth() === targetMonth &&
          created.getFullYear() === targetYear
        );
      });

      bookingTrend.push({
        month: monthLabel,
        bookings: monthBookings.length,
        revenue: monthPayments.reduce(
          (sum, payment) => sum + Number(payment.amount || 0),
          0
        ),
      });
    }

    const packageMap = {};

    allBookings.forEach((booking) => {
      const packageName = booking.travelPick?.title || "Package";
      packageMap[packageName] = (packageMap[packageName] || 0) + 1;
    });

    const topPackages = Object.entries(packageMap)
      .map(([name, bookings]) => ({
        name,
        bookings,
      }))
      .sort((a, b) => b.bookings - a.bookings)
      .slice(0, 5);

    const recentTravelPicksWithCounts = recentTravelPicks.map((pick) => ({
      _id: pick._id,
      title: pick.title,
      place: pick.place,
      imageUrl: pick.imageUrl,
      createdAt: pick.createdAt,
      bookingCount: pick.bookingCount || 0,
    }));

    return res.status(200).json({
      summary: {
        totalUsers,
        totalBookings,
        totalPackages,
        totalPlaces,
        pendingItineraries: pendingItinerariesCount,
        totalRevenue,
      },
      bookingTrend,
      topPackages,
      paymentStatus,
      recentBookings,
      recentPlaces,
      recentTravelPicks: recentTravelPicksWithCounts,
      pendingItineraries,
      extraStats: {
        unreadNotifications,
        totalReports,
      },
    });
  } catch (error) {
    console.error("adminDashboardStats error:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const adminGetAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select(
        "-password -resetPasswordToken -resetPasswordExpire -refreshTokenHash -refreshTokenExpire"
      )
      .sort({ createdAt: -1 });

    return res.status(200).json({ count: users.length, users });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const adminGetUserById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const user = await User.findById(id).select(
      "-password -resetPasswordToken -resetPasswordExpire -refreshTokenHash -refreshTokenExpire"
    );

    if (!user) return res.status(404).json({ message: "User not found" });

    return res.status(200).json({ user });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const adminUpdateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    if (!role || !["admin", "user"].includes(role)) {
      return res.status(400).json({ message: "Role must be admin or user" });
    }

    if (req.user?._id?.toString() === id) {
      return res
        .status(400)
        .json({ message: "You cannot change your own role" });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.role = role;
    await user.save();

    return res.status(200).json({
      message: "Role updated successfully",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const adminGetNotifications = async (req, res) => {
  try {
    const notifications = await AdminNotification.find()
      .populate("actor", "username email")
      .populate("place", "placeName imageUrl")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: notifications.length,
      notifications,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const adminMarkNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await AdminNotification.findById(id);

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    notification.isRead = true;
    await notification.save();

    return res.status(200).json({
      message: "Notification marked as read",
      notification,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const adminGetReports = async (req, res) => {
  try {
    const reports = await PlaceReport.find()
      .populate("place", "placeName imageUrl isPublished createdBy")
      .populate("reportedBy", "username email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: reports.length,
      reports,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const adminHidePlace = async (req, res) => {
  try {
    const { id } = req.params;

    const place = await Place.findById(id);
    if (!place) {
      return res.status(404).json({ message: "Place not found" });
    }

    place.isPublished = false;
    await place.save();

    return res.status(200).json({
      message: "Place hidden from users",
      place,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

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

    return res.status(200).json({
      message: "User blocked successfully",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};