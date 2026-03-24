import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import UserPost from "../models/userPost.models.js";

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const getOptionalUserId = (req) => {
  try {
    let token = null;

    if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token || !process.env.JWT_SECRET) {
      return null;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded?.id || null;
  } catch {
    return null;
  }
};

const formatUserPost = (postDoc, userId = null) => {
  const post = postDoc.toObject ? postDoc.toObject() : postDoc;

  return {
    _id: post._id,
    imageUrl: post.imageUrl,
    caption: post.caption || "",
    location: post.location || "",
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    createdBy: post.createdBy
      ? {
          _id: post.createdBy._id,
          username: post.createdBy.username,
          name: post.createdBy.name || "",
          profileImage: post.createdBy.profileImage || "",
        }
      : null,
    likesCount: post.likes?.length || 0,
    savesCount: post.savedBy?.length || 0,
    commentsCount: post.comments?.length || 0,
    shareCount: post.shareCount || 0,
    isLiked: userId
      ? (post.likes || []).some((id) => String(id) === String(userId))
      : false,
    isSaved: userId
      ? (post.savedBy || []).some((id) => String(id) === String(userId))
      : false,
    comments: (post.comments || []).map((comment) => ({
      _id: comment._id,
      text: comment.text,
      createdAt: comment.createdAt,
      user: comment.user
        ? {
            _id: comment.user._id,
            username: comment.user.username,
          }
        : null,
    })),
  };
};

// CREATE USER POST
export const createUserPost = async (req, res) => {
  try {
    const { caption, location } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "Image is required" });
    }

    const imageUrl = `/uploads/user-posts/${req.file.filename}`;

    const post = await UserPost.create({
      imageUrl,
      caption: caption ? caption.trim() : "",
      location: location ? location.trim() : "",
      createdBy: req.user._id,
    });

    const createdPost = await UserPost.findById(post._id)
      .populate("createdBy", "username name profileImage")
      .populate("comments.user", "username");

    return res.status(201).json({
      message: "User post created successfully",
      post: formatUserPost(createdPost, req.user._id),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// GET ALL USER POSTS FOR FEED
export const getAllUserPosts = async (req, res) => {
  try {
    const userId = getOptionalUserId(req);

    const posts = await UserPost.find()
      .populate("createdBy", "username name profileImage")
      .populate("comments.user", "username")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: posts.length,
      posts: posts.map((post) => formatUserPost(post, userId)),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// GET POSTS OF A SINGLE USER
export const getPostsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const viewerId = getOptionalUserId(req);

    if (!isValidObjectId(userId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const posts = await UserPost.find({ createdBy: userId })
      .populate("createdBy", "username name profileImage")
      .populate("comments.user", "username")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: posts.length,
      posts: posts.map((post) => formatUserPost(post, viewerId)),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};