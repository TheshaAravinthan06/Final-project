import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import UserPost from "../models/userPost.models.js";
import User from "../models/user.models.js";
import ContentReport from "../models/contentReport.models.js";
import { createUserNotification } from "../utils/createUserNotification.js";

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
    isPublished: post.isPublished !== false,
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
      replyTo: comment.replyTo || null,
      user: comment.user
        ? {
            _id: comment.user._id,
            username: comment.user.username,
            profileImage: comment.user.profileImage || "",
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
      isPublished: true,
    });

    const createdPost = await UserPost.findById(post._id)
      .populate("createdBy", "username name")
      .populate("comments.user", "username profileImage");

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
    let blockedUserIds = [];

    if (userId) {
      const currentUser = await User.findById(userId).select("blockedUsers");
      blockedUserIds = (currentUser?.blockedUsers || []).map((id) => String(id));
    }

    const posts = await UserPost.find({ isPublished: { $ne: false } })
      .populate("createdBy", "username name profileImage")
      .populate("comments.user", "username profileImage")
      .sort({ createdAt: -1 });

    const visiblePosts = posts.filter(
      (post) => !blockedUserIds.includes(String(post.createdBy?._id || post.createdBy))
    );

    return res.status(200).json({
      count: visiblePosts.length,
      posts: visiblePosts.map((post) => formatUserPost(post, userId)),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// GET SINGLE USER POST
export const getUserPostById = async (req, res) => {
  try {
    const { id } = req.params;
    const viewerId = getOptionalUserId(req);

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid post id" });
    }

    const post = await UserPost.findById(id)
      .populate("createdBy", "username name")
      .populate("comments.user", "username profileImage");

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (post.isPublished === false) {
      if (!viewerId || String(post.createdBy?._id || post.createdBy) !== String(viewerId)) {
        return res.status(404).json({ message: "Post not found" });
      }
    }

    return res.status(200).json({
      post: formatUserPost(post, viewerId),
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

    const query =
      viewerId && String(viewerId) === String(userId)
        ? { createdBy: userId }
        : { createdBy: userId, isPublished: { $ne: false } };

    const posts = await UserPost.find(query)
      .populate("createdBy", "username name")
      .populate("comments.user", "username profileImage")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: posts.length,
      posts: posts.map((post) => formatUserPost(post, viewerId)),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// UPDATE POST
export const updateUserPost = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid post id" });
    }

    const post = await UserPost.findById(id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (String(post.createdBy) !== String(req.user._id)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    post.caption = req.body.caption ?? post.caption;
    post.location = req.body.location ?? post.location;

    if (req.file) {
      post.imageUrl = `/uploads/user-posts/${req.file.filename}`;
    }

    await post.save();

    const updatedPost = await UserPost.findById(post._id)
      .populate("createdBy", "username name")
      .populate("comments.user", "username profileImage");

    return res.status(200).json({
      message: "Post updated successfully",
      post: formatUserPost(updatedPost, req.user._id),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// TOGGLE POST VISIBILITY
export const toggleUserPostVisibility = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid post id" });
    }

    const post = await UserPost.findById(id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (String(post.createdBy) !== String(req.user._id)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    post.isPublished = post.isPublished === false ? true : false;
    await post.save();

    const updatedPost = await UserPost.findById(post._id)
      .populate("createdBy", "username name")
      .populate("comments.user", "username profileImage");

    return res.status(200).json({
      message:
        post.isPublished === false
          ? "Post hidden successfully"
          : "Post visible to users again",
      post: formatUserPost(updatedPost, req.user._id),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// DELETE POST
export const deleteUserPost = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid post id" });
    }

    const post = await UserPost.findById(id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (String(post.createdBy) !== String(req.user._id)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await post.deleteOne();

    return res.status(200).json({ message: "Post deleted successfully" });
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
      .populate("createdBy", "username name")
      .populate("comments.user", "username profileImage");

    if (!post || post.isPublished === false) {
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

    if (String(post.createdBy?._id || post.createdBy) !== String(req.user._id)) {
      await createUserNotification({
        recipient: post.createdBy?._id || post.createdBy,
        actor: req.user._id,
        type: "like",
        title: "New like",
        message: `${req.user.username} liked your post`,
        entityType: "post",
        entityId: post._id,
        previewImage: post.imageUrl || "",
      });
    }

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
      .populate("createdBy", "username name")
      .populate("comments.user", "username profileImage");

    if (!post || post.isPublished === false) {
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
      .populate("createdBy", "username name")
      .populate("comments.user", "username profileImage");

    if (!post || post.isPublished === false) {
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
      .populate("createdBy", "username name")
      .populate("comments.user", "username profileImage");

    if (!post || post.isPublished === false) {
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


export const reportUserPost = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason = "", details = "" } = req.body || {};

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid post id" });
    }

    const post = await UserPost.findById(id).populate("createdBy", "username");

    if (!post || post.isPublished === false) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (String(post.createdBy?._id || post.createdBy) === String(req.user._id)) {
      return res.status(400).json({ message: "You cannot report your own post" });
    }

    const report = await ContentReport.findOneAndUpdate(
      {
        reportType: "user_post",
        entityId: post._id,
        reportedBy: req.user._id,
      },
      {
        $set: {
          targetUser: post.createdBy?._id || post.createdBy,
          reason: String(reason || "").trim(),
          details: String(details || "").trim(),
          status: "pending",
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({
      message: "Post reported successfully",
      report,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ADD COMMENT
export const addCommentToUserPost = async (req, res) => {
  try {
    const { id } = req.params;
    const { text, replyTo } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid post id" });
    }

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Comment text is required" });
    }

    const post = await UserPost.findById(id).populate(
      "createdBy",
      "username name profileImage"
    );

    if (!post || post.isPublished === false) {
      return res.status(404).json({ message: "Post not found" });
    }

    post.comments.push({
      user: req.user._id,
      text: text.trim(),
      replyTo:
        replyTo && isValidObjectId(replyTo)
          ? new mongoose.Types.ObjectId(replyTo)
          : null,
    });

    await post.save();

    if (String(post.createdBy?._id || post.createdBy) !== String(req.user._id)) {
      await createUserNotification({
        recipient: post.createdBy?._id || post.createdBy,
        actor: req.user._id,
        type: "comment",
        title: "New comment",
        message: `${req.user.username} commented on your post`,
        entityType: "post",
        entityId: post._id,
        previewImage: post.imageUrl || "",
      });
    }

    const updatedPost = await UserPost.findById(id)
      .populate("createdBy", "username name")
      .populate("comments.user", "username profileImage");

    return res.status(201).json({
      message: "Comment added successfully",
      post: formatUserPost(updatedPost, req.user._id),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// DELETE COMMENT
export const deleteCommentFromUserPost = async (req, res) => {
  try {
    const { id, commentId } = req.params;

    if (!isValidObjectId(id) || !isValidObjectId(commentId)) {
      return res.status(400).json({ message: "Invalid id" });
    }

    const post = await UserPost.findById(id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const comment = post.comments.id(commentId);

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (
      String(comment.user) !== String(req.user._id) &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    comment.deleteOne();
    await post.save();

    const updatedPost = await UserPost.findById(id)
      .populate("createdBy", "username name ")
      .populate("comments.user", "username profileImage");

    return res.status(200).json({
      message: "Comment deleted successfully",
      post: formatUserPost(updatedPost, req.user._id),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};