import express from "express";
import { protect } from "../middlewares/auth.middleware.js";
import uploadUserPostImage from "../middlewares/userPostUpload.middleware.js";
import {
  createUserPost,
  getAllUserPosts,
  getPostsByUserId,
  updateUserPost,
  toggleUserPostVisibility,
  deleteUserPost,
  likeUserPost,
  unlikeUserPost,
  saveUserPost,
  unsaveUserPost,
  addCommentToUserPost,
  deleteCommentFromUserPost,
  reportUserPost,
} from "../controllers/userPost.controller.js";

const router = express.Router();

router.post("/", protect, uploadUserPostImage.single("image"), createUserPost);
router.get("/", getAllUserPosts);
router.get("/user/:userId", getPostsByUserId);

router.put("/:id", protect, uploadUserPostImage.single("image"), updateUserPost);
router.patch("/:id/visibility", protect, toggleUserPostVisibility);
router.delete("/:id", protect, deleteUserPost);

router.post("/:id/like", protect, likeUserPost);
router.post("/:id/unlike", protect, unlikeUserPost);

router.post("/:id/save", protect, saveUserPost);
router.post("/:id/unsave", protect, unsaveUserPost);

router.post("/:id/comment", protect, addCommentToUserPost);
router.post("/:id/report", protect, reportUserPost);
router.delete("/:postId/comment/:commentId", protect, deleteCommentFromUserPost);



// router.get("/:id", protect, getUserPostById);
// router.post("/:id/comment", protect, addUserPostComment);
// router.delete("/:id/comments/:commentId", protect, deleteUserPostComment);

export default router;