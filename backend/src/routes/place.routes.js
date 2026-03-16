import express from "express";
import {
  createPlace,
  getAllPlaces,
  getPlaceById,
  adminGetAllPlaces,
  adminGetPlaceById,
  updatePlace,
  deletePlace,
} from "../controllers/place.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";

const router = express.Router();

// admin-only routes
router.get("/admin/all", protect, authorize("admin"), adminGetAllPlaces);
router.get("/admin/:id", protect, authorize("admin"), adminGetPlaceById);
router.post("/", protect, authorize("admin"), createPlace);
router.patch("/:id", protect, authorize("admin"), updatePlace);
router.delete("/:id", protect, authorize("admin"), deletePlace);

// public routes for user home page
router.get("/", getAllPlaces);
router.get("/:id", getPlaceById);

export default router;