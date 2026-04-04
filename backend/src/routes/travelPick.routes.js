import express from "express";
import {
  createTravelPick,
  getAllTravelPicks,
  getTravelPickById,
  adminGetAllTravelPicks,
  adminGetTravelPickById,
  updateTravelPick,
  deleteTravelPick,
  saveTravelPick,
  unsaveTravelPick,
} from "../controllers/travelPick.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";
import uploadTravelPickImage from "../middlewares/travelPickUpload.middleware.js";

const router = express.Router();

router.get("/admin/all", protect, authorize("admin"), adminGetAllTravelPicks);
router.get("/admin/:id", protect, authorize("admin"), adminGetTravelPickById);

router.post(
  "/",
  protect,
  authorize("admin"),
  uploadTravelPickImage.single("image"),
  createTravelPick
);

router.patch(
  "/:id",
  protect,
  authorize("admin"),
  uploadTravelPickImage.single("image"),
  updateTravelPick
);

router.delete("/:id", protect, authorize("admin"), deleteTravelPick);

router.post("/:id/save", protect, saveTravelPick);
router.post("/:id/unsave", protect, unsaveTravelPick);

router.get("/", getAllTravelPicks);
router.get("/:id", getTravelPickById);

export default router;