import express from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";
import { adminDashboardStats } from "../controllers/admin.controller.js";
import {
  adminGetAllUsers,
  adminGetUserById,
  adminUpdateUserRole,
  adminGetNotifications,
  adminMarkNotificationRead,
  adminGetReports,
  adminHidePlace,
  adminBlockUser,
} from "../controllers/admin.controller.js";
import { adminGlobalSearch } from "../controllers/search.controller.js";

const router = express.Router();

router.use(protect, authorize("admin"));
router.get("/dashboard", adminDashboardStats);
router.get("/search", adminGlobalSearch);

router.get("/users", adminGetAllUsers);
router.get("/users/:id", adminGetUserById);
router.patch("/users/:id/role", adminUpdateUserRole);

router.get("/notifications", adminGetNotifications);
router.patch("/notifications/:id/read", adminMarkNotificationRead);

router.get("/reports", adminGetReports);
router.patch("/places/:id/hide", adminHidePlace);
router.patch("/users/:id/block", adminBlockUser);

export default router;