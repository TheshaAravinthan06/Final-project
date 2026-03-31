import mongoose from "mongoose";
import UserNotification from "../models/userNotification.models.js";

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const formatNotification = (item) => ({
  _id: item._id,
  type: item.type,
  title: item.title,
  message: item.message,
  entityType: item.entityType,
  entityId: item.entityId,
  previewImage: item.previewImage || "",
  isRead: item.isRead,
  createdAt: item.createdAt,
  actor: item.actor
    ? {
        _id: item.actor._id,
        username: item.actor.username,
        name: item.actor.name || "",
        profileImage: item.actor.profileImage || "",
      }
    : null,
});

export const getMyNotifications = async (req, res) => {
  try {
    const { type, unreadOnly, limit } = req.query;

    const filter = {
      recipient: req.user._id,
    };

    if (type && type !== "all") {
      filter.type = type;
    }

    if (String(unreadOnly).toLowerCase() === "true") {
      filter.isRead = false;
    }

    const parsedLimit = Number(limit) > 0 ? Number(limit) : 50;

    const notifications = await UserNotification.find(filter)
      .populate("actor", "username name profileImage")
      .sort({ createdAt: -1 })
      .limit(parsedLimit);

    const unreadCount = await UserNotification.countDocuments({
      recipient: req.user._id,
      isRead: false,
    });

    return res.status(200).json({
      count: notifications.length,
      unreadCount,
      notifications: notifications.map(formatNotification),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const markMyNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid notification id" });
    }

    const notification = await UserNotification.findOne({
      _id: id,
      recipient: req.user._id,
    }).populate("actor", "username name profileImage");

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    notification.isRead = true;
    await notification.save();

    return res.status(200).json({
      message: "Notification marked as read",
      notification: formatNotification(notification),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const markAllMyNotificationsRead = async (req, res) => {
  try {
    await UserNotification.updateMany(
      {
        recipient: req.user._id,
        isRead: false,
      },
      {
        $set: { isRead: true },
      }
    );

    return res.status(200).json({
      message: "All notifications marked as read",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const deleteMyNotification = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid notification id" });
    }

    const notification = await UserNotification.findOneAndDelete({
      _id: id,
      recipient: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    return res.status(200).json({
      message: "Notification deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};