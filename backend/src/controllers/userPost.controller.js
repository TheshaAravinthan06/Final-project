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

// LIKE POST
export const likeUserPost = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid post id" });
    }

    const post = await UserPost.findById(id)
      .populate("createdBy", "username name profileImage")
      .populate("comments.user", "username");

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const alreadyLiked = post.likes.some(
      (userId) => String(userId) === String(req.user._id)
    );

    if (alreadyLiked) {
      return res.status(400).json({ message: "Post already liked" });
    }

    post.likes.push(req.user._id);
    await post.save();

    return res.status(200).json({
      message: "Post liked successfully",
      post: formatUserPost(post, req.user._id),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// UNLIKE POST
export const unlikeUserPost = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid post id" });
    }

    const post = await UserPost.findById(id)
      .populate("createdBy", "username name profileImage")
      .populate("comments.user", "username");

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const alreadyLiked = post.likes.some(
      (userId) => String(userId) === String(req.user._id)
    );

    if (!alreadyLiked) {
      return res.status(400).json({ message: "You have not liked this post" });
    }

    post.likes = post.likes.filter(
      (userId) => String(userId) !== String(req.user._id)
    );

    await post.save();

    return res.status(200).json({
      message: "Post unliked successfully",
      post: formatUserPost(post, req.user._id),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// SAVE POST
export const saveUserPost = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid post id" });
    }

    const post = await UserPost.findById(id)
      .populate("createdBy", "username name profileImage")
      .populate("comments.user", "username");

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const alreadySaved = post.savedBy.some(
      (userId) => String(userId) === String(req.user._id)
    );

    if (alreadySaved) {
      return res.status(400).json({ message: "Post already saved" });
    }

    post.savedBy.push(req.user._id);
    await post.save();

    return res.status(200).json({
      message: "Post saved successfully",
      post: formatUserPost(post, req.user._id),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// UNSAVE POST
export const unsaveUserPost = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid post id" });
    }

    const post = await UserPost.findById(id)
      .populate("createdBy", "username name profileImage")
      .populate("comments.user", "username");

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const alreadySaved = post.savedBy.some(
      (userId) => String(userId) === String(req.user._id)
    );

    if (!alreadySaved) {
      return res.status(400).json({ message: "You have not saved this post" });
    }

    post.savedBy = post.savedBy.filter(
      (userId) => String(userId) !== String(req.user._id)
    );

    await post.save();

    return res.status(200).json({
      message: "Post unsaved successfully",
      post: formatUserPost(post, req.user._id),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ADD COMMENT
export const addCommentToUserPost = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid post id" });
    }

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Comment text is required" });
    }

    const post = await UserPost.findById(id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    post.comments.push({
      user: req.user._id,
      text: text.trim(),
    });

    await post.save();

    const updatedPost = await UserPost.findById(id)
      .populate("createdBy", "username name profileImage")
      .populate("comments.user", "username");

    return res.status(201).json({
      message: "Comment added successfully",
      post: formatUserPost(updatedPost, req.user._id),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// DELETE OWN COMMENT
export const deleteCommentFromUserPost = async (req, res) => {
  try {
    const { postId, commentId } = req.params;

    if (!isValidObjectId(postId)) {
      return res.status(400).json({ message: "Invalid post id" });
    }

    if (!isValidObjectId(commentId)) {
      return res.status(400).json({ message: "Invalid comment id" });
    }

    const post = await UserPost.findById(postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const comment = post.comments.id(commentId);

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (String(comment.user) !== String(req.user._id)) {
      return res
        .status(403)
        .json({ message: "You can only delete your own comment" });
    }

    comment.deleteOne();
    await post.save();

    const updatedPost = await UserPost.findById(postId)
      .populate("createdBy", "username name profileImage")
      .populate("comments.user", "username");

    return res.status(200).json({
      message: "Comment deleted successfully",
      post: formatUserPost(updatedPost, req.user._id),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};