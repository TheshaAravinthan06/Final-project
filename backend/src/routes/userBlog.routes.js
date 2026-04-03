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
} from "../controllers/userBlog.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { uploadBlogImage } from "../middlewares/uploadBlogImage.js";

const router = express.Router();

router.post("/", protect, uploadBlogImage.single("coverImage"), createBlog);
router.get("/", getAllBlogs);
router.get("/user/:userId", getBlogsByUserId);
router.get("/:id", getBlogById);
router.put("/:id", protect, uploadBlogImage.single("coverImage"), updateBlog);
router.patch("/:id/visibility", protect, toggleBlogVisibility);
router.post("/:id/report", protect, reportBlog);
router.delete("/:id", protect, deleteBlog);

export default router;