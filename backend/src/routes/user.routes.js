import express from "express";
import { protect } from "../middlewares/auth.middleware.js";
import {
  getMyProfile,
  updateMyProfile,
  getUserProfileById,
} from "../controllers/user.controller.js";

const router = express.Router();

router.get("/me", protect, getMyProfile);
router.put("/me", protect, updateMyProfile);
router.get("/:id", getUserProfileById);

export default router;