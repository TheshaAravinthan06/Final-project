import express from "express";
import { protect } from "../middlewares/auth.middleware.js";
import {
  getMyNotifications,
  markMyNotificationRead,
  markAllMyNotificationsRead,
  deleteMyNotification,
} from "../controllers/notification.controller.js";

const router = express.Router();

router.use(protect);

router.get("/", getMyNotifications);
router.patch("/read-all", markAllMyNotificationsRead);
router.patch("/:id/read", markMyNotificationRead);
router.delete("/:id", deleteMyNotification);

export default router;