import express from "express";
import {
  createBlog,
  getAllBlogs,
  getBlogById,
  getBlogsByUserId,
  updateBlog,
  toggleBlogVisibility,
  reportBlog,
  deleteBlog,
  saveBlog,
  unsaveBlog,
  likeBlog,
  unlikeBlog,
  addCommentToBlog,
  deleteCommentFromBlog,
} from "../controllers/userBlog.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { uploadBlogImage } from "../middlewares/uploadBlogImage.js";

const router = express.Router();

router.post("/", protect, uploadBlogImage.single("coverImage"), createBlog);
router.get("/", getAllBlogs);
router.get("/user/:userId", getBlogsByUserId);

router.post("/:id/like", protect, likeBlog);
router.post("/:id/unlike", protect, unlikeBlog);

router.post("/:id/save", protect, saveBlog);
router.post("/:id/unsave", protect, unsaveBlog);

router.post("/:id/comment", protect, addCommentToBlog);
router.delete("/:blogId/comment/:commentId", protect, deleteCommentFromBlog);

router.get("/:id", getBlogById);
router.put("/:id", protect, uploadBlogImage.single("coverImage"), updateBlog);
router.patch("/:id/visibility", protect, toggleBlogVisibility);
router.post("/:id/report", protect, reportBlog);
router.delete("/:id", protect, deleteBlog);

export default router;