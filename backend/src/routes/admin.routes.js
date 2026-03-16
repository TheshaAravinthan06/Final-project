import express from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";
import {
  adminGetAllUsers,
  adminGetUserById,
  adminUpdateUserRole,
} from "../controllers/admin.controller.js";

const router = express.Router();

router.use(protect, authorize("admin"));

router.get("/users", adminGetAllUsers);
router.get("/users/:id", adminGetUserById);
router.patch("/users/:id/role", adminUpdateUserRole);

export default router;