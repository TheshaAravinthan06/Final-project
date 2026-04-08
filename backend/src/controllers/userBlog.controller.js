import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import UserBlog from "../models/userBlog.models.js";
import User from "../models/user.models.js";
import ContentReport from "../models/contentReport.models.js";

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

const formatBlog = (blogDoc, userId = null) => {
  const blog = blogDoc.toObject ? blogDoc.toObject() : blogDoc;

  return {
    _id: blog._id,
    title: blog.title || "",
    coverImage: blog.coverImage || "",
    excerpt: blog.excerpt || "",
    content: blog.content || "",
    location: blog.location || "",
    createdAt: blog.createdAt,
    updatedAt: blog.updatedAt,
    isPublished: blog.isPublished !== false,
    likesCount: blog.likes?.length || 0,
    commentsCount: blog.comments?.length || 0,
    savesCount: blog.savedBy?.length || 0,
    isLiked: userId
      ? (blog.likes || []).some((id) => String(id) === String(userId))
      : false,
    isSaved: userId
      ? (blog.savedBy || []).some((id) => String(id) === String(userId))
      : false,
    author: blog.author
      ? {
          _id: blog.author._id,
          username: blog.author.username,
          name: blog.author.name || "",
          profileImage: blog.author.profileImage || "",
        }
      : null,
    comments: (blog.comments || []).map((comment) => ({
      _id: comment._id,
      text: comment.text || "",
      createdAt: comment.createdAt,
      user: comment.user
        ? {
            _id: comment.user._id,
            username: comment.user.username || "",
            name: comment.user.name || "",
            profileImage: comment.user.profileImage || "",
          }
        : null,
    })),
  };
};

export const createBlog = async (req, res) => {
  try {
    const newBlog = await UserBlog.create({
      title: req.body.title,
      excerpt: req.body.excerpt,
      content: req.body.content,
      location: req.body.location,
      coverImage: req.file ? `/uploads/blogs/${req.file.filename}` : "",
      author: req.user._id,
      isPublished: true,
    });

    const populatedBlog = await UserBlog.findById(newBlog._id)
      .populate("author", "username name profileImage")
      .populate("comments.user", "username name profileImage");

    res.status(201).json({
      message: "Blog created successfully",
      blog: formatBlog(populatedBlog, req.user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllBlogs = async (req, res) => {
  try {
    const userId = getOptionalUserId(req);
    let blockedUserIds = [];

    if (userId) {
      const currentUser = await User.findById(userId).select("blockedUsers");
      blockedUserIds = (currentUser?.blockedUsers || []).map((id) => String(id));
    }

    const blogs = await UserBlog.find({ isPublished: { $ne: false } })
      .populate("author", "username name profileImage")
      .populate("comments.user", "username name profileImage")
      .sort({ createdAt: -1 });

    const visibleBlogs = blogs.filter(
      (blog) => !blockedUserIds.includes(String(blog.author?._id || blog.author))
    );

    res.status(200).json({
      count: visibleBlogs.length,
      blogs: visibleBlogs.map((blog) => formatBlog(blog, userId)),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getBlogById = async (req, res) => {
  try {
    const viewerId = getOptionalUserId(req);

    const blog = await UserBlog.findById(req.params.id)
      .populate("author", "username name profileImage")
      .populate("comments.user", "username name profileImage");

    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    const isOwner =
      viewerId && String(blog.author?._id || blog.author) === String(viewerId);

    if (blog.isPublished === false && !isOwner) {
      return res.status(404).json({ message: "Blog not found" });
    }

    res.status(200).json({ blog: formatBlog(blog, viewerId) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getBlogsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const viewerId = getOptionalUserId(req);

    const query =
      viewerId && String(viewerId) === String(userId)
        ? { author: userId }
        : { author: userId, isPublished: { $ne: false } };

    const blogs = await UserBlog.find(query)
      .populate("author", "username name profileImage")
      .populate("comments.user", "username name profileImage")
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: blogs.length,
      blogs: blogs.map((blog) => formatBlog(blog, viewerId)),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateBlog = async (req, res) => {
  try {
    const blog = await UserBlog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    if (blog.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    blog.title = req.body.title ?? blog.title;
    blog.excerpt = req.body.excerpt ?? blog.excerpt;
    blog.content = req.body.content ?? blog.content;
    blog.location = req.body.location ?? blog.location;

    if (req.file) {
      blog.coverImage = `/uploads/blogs/${req.file.filename}`;
    }

    await blog.save();

    const updatedBlog = await UserBlog.findById(blog._id)
      .populate("author", "username name profileImage")
      .populate("comments.user", "username name profileImage");

    res.status(200).json({
      message: "Blog updated successfully",
      blog: formatBlog(updatedBlog, req.user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const toggleBlogVisibility = async (req, res) => {
  try {
    const blog = await UserBlog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    if (blog.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    blog.isPublished = blog.isPublished === false ? true : false;
    await blog.save();

    const updatedBlog = await UserBlog.findById(blog._id)
      .populate("author", "username name profileImage")
      .populate("comments.user", "username name profileImage");

    res.status(200).json({
      message:
        blog.isPublished === false
          ? "Blog hidden successfully"
          : "Blog visible to users again",
      blog: formatBlog(updatedBlog, req.user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const reportBlog = async (req, res) => {
  try {
    const { reason = "", details = "" } = req.body || {};
    const blog = await UserBlog.findById(req.params.id).populate("author", "username");

    if (!blog || blog.isPublished === false) {
      return res.status(404).json({ message: "Blog not found" });
    }

    if (String(blog.author?._id || blog.author) === String(req.user._id)) {
      return res.status(400).json({ message: "You cannot report your own blog" });
    }

    const report = await ContentReport.findOneAndUpdate(
      {
        reportType: "blog",
        entityId: blog._id,
        reportedBy: req.user._id,
      },
      {
        $set: {
          targetUser: blog.author?._id || blog.author,
          reason: String(reason || "").trim(),
          details: String(details || "").trim(),
          status: "pending",
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({
      message: "Blog reported successfully",
      report,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const likeBlog = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid blog id" });
    }

    const blog = await UserBlog.findById(id)
      .populate("author", "username name profileImage")
      .populate("comments.user", "username name profileImage");

    if (!blog || blog.isPublished === false) {
      return res.status(404).json({ message: "Blog not found" });
    }

    const alreadyLiked = blog.likes.some(
      (userId) => String(userId) === String(req.user._id)
    );

    if (alreadyLiked) {
      return res.status(400).json({ message: "Blog already liked" });
    }

    blog.likes.push(req.user._id);
    await blog.save();

    return res.status(200).json({
      message: "Blog liked successfully",
      blog: formatBlog(blog, req.user._id),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const unlikeBlog = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid blog id" });
    }

    const blog = await UserBlog.findById(id)
      .populate("author", "username name profileImage")
      .populate("comments.user", "username name profileImage");

    if (!blog || blog.isPublished === false) {
      return res.status(404).json({ message: "Blog not found" });
    }

    blog.likes = blog.likes.filter(
      (userId) => String(userId) !== String(req.user._id)
    );

    await blog.save();

    return res.status(200).json({
      message: "Blog unliked successfully",
      blog: formatBlog(blog, req.user._id),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const saveBlog = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid blog id" });
    }

    const blog = await UserBlog.findById(id)
      .populate("author", "username name profileImage")
      .populate("comments.user", "username name profileImage");

    if (!blog || blog.isPublished === false) {
      return res.status(404).json({ message: "Blog not found" });
    }

    const alreadySaved = blog.savedBy.some(
      (userId) => String(userId) === String(req.user._id)
    );

    if (alreadySaved) {
      return res.status(400).json({ message: "Blog already saved" });
    }

    blog.savedBy.push(req.user._id);
    await blog.save();

    return res.status(200).json({
      message: "Blog saved successfully",
      blog: formatBlog(blog, req.user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const unsaveBlog = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid blog id" });
    }

    const blog = await UserBlog.findById(id)
      .populate("author", "username name profileImage")
      .populate("comments.user", "username name profileImage");

    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    blog.savedBy = blog.savedBy.filter(
      (userId) => String(userId) !== String(req.user._id)
    );

    await blog.save();

    return res.status(200).json({
      message: "Blog unsaved successfully",
      blog: formatBlog(blog, req.user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addCommentToBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid blog id" });
    }

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Comment text is required" });
    }

    const blog = await UserBlog.findById(id);

    if (!blog || blog.isPublished === false) {
      return res.status(404).json({ message: "Blog not found" });
    }

    blog.comments.push({
      user: req.user._id,
      text: text.trim(),
    });

    await blog.save();

    const updatedBlog = await UserBlog.findById(id)
      .populate("author", "username name profileImage")
      .populate("comments.user", "username name profileImage");

    return res.status(201).json({
      message: "Comment added successfully",
      blog: formatBlog(updatedBlog, req.user._id),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const deleteCommentFromBlog = async (req, res) => {
  try {
    const { blogId, commentId } = req.params;

    if (!isValidObjectId(blogId) || !isValidObjectId(commentId)) {
      return res.status(400).json({ message: "Invalid id" });
    }

    const blog = await UserBlog.findById(blogId);

    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    const comment = blog.comments.id(commentId);

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (String(comment.user) !== String(req.user._id)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    comment.deleteOne();
    await blog.save();

    const updatedBlog = await UserBlog.findById(blogId)
      .populate("author", "username name profileImage")
      .populate("comments.user", "username name profileImage");

    return res.status(200).json({
      message: "Comment deleted successfully",
      blog: formatBlog(updatedBlog, req.user._id),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const deleteBlog = async (req, res) => {
  try {
    const blog = await UserBlog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    if (blog.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await blog.deleteOne();

    res.status(200).json({ message: "Blog deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};