import express from "express";
import { protect } from "../middlewares/auth.middleware.js";
import uploadProfileImage from "../middlewares/profileUpload.middleware.js";
import {
  getMyProfile,
  updateMyProfile,
  uploadMyProfileImage,
  getUserProfileById,
  followUser,
  unfollowUser,
  getFollowersList,
  getFollowingList,
  addReviewToUser,
  getReviewsOfUser,
  deleteMyReview,
} from "../controllers/user.controller.js";

const router = express.Router();

router.get("/me", protect, getMyProfile);
router.put("/me", protect, updateMyProfile);

router.post(
  "/me/avatar",
  protect,
  uploadProfileImage.single("image"),
  uploadMyProfileImage
);

router.post("/:id/follow", protect, followUser);
router.post("/:id/unfollow", protect, unfollowUser);

router.get("/:id/followers", getFollowersList);
router.get("/:id/following", getFollowingList);

router.get("/:id", protect, getUserProfileById);

router.post("/:id/review", protect, addReviewToUser);
router.get("/:id/reviews", getReviewsOfUser);
router.delete("/reviews/:reviewId", protect, deleteMyReview);

export default router;