import express from "express";
import { protect } from "../middlewares/auth.middleware.js";
import uploadUserPostImage from "../middlewares/userPostUpload.middleware.js";
import {
  createUserPost,
  getAllUserPosts,
  getPostsByUserId,
} from "../controllers/userPost.controller.js";

const router = express.Router();

router.post("/", protect, uploadUserPostImage.single("image"), createUserPost);
router.get("/", getAllUserPosts);
router.get("/user/:userId", getPostsByUserId);

export default router;