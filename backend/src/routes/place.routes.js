import express from "express";
import {
  createPlace,
  getAllPlaces,
  getPlaceById,
  adminGetAllPlaces,
  adminGetPlaceById,
  updatePlace,
  deletePlace,
  togglePlaceLike,
  togglePlaceSave,
  addPlaceComment,
  deletePlaceComment,
  incrementPlaceShare,
  reportPlace,
} from "../controllers/place.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";
import uploadPlaceImage from "../middlewares/upload.middleware.js";

const router = express.Router();

router.get("/admin/all", protect, authorize("admin"), adminGetAllPlaces);
router.get("/admin/:id", protect, authorize("admin"), adminGetPlaceById);

router.post(
  "/",
  protect,
  authorize("admin"),
  uploadPlaceImage.single("image"),
  createPlace
);

router.patch(
  "/:id",
  protect,
  authorize("admin"),
  uploadPlaceImage.single("image"),
  updatePlace
);

router.delete("/:id", protect, authorize("admin"), deletePlace);
router.delete("/:id/comments/:commentId", protect, authorize("admin"), deletePlaceComment);

router.get("/", getAllPlaces);
router.get("/:id", getPlaceById);

router.post("/:id/like", protect, togglePlaceLike);
router.post("/:id/save", protect, togglePlaceSave);
router.post("/:id/comments", protect, addPlaceComment);
router.post("/:id/share", protect, incrementPlaceShare);
router.post("/:id/report", protect, reportPlace);

export default router;