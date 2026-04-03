import jwt from "jsonwebtoken";
import UserBlog from "../models/userBlog.models.js";
import User from "../models/user.models.js";

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

// helper — fetch the set of userIds that userId is following
const getFollowingSet = async (userId) => {
  if (!userId) return new Set();
  try {
    const user = await User.findById(userId).select("following").lean();
    return new Set((user?.following || []).map(String));
  } catch {
    return new Set();
  }
};

const formatBlog = (blog, userId = null, followingIds = new Set()) => {
  const authorId = blog.author?._id ? String(blog.author._id) : null;
  const isOwnBlog = userId && authorId && String(userId) === authorId;

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
          isFollowing: isOwnBlog ? false : followingIds.has(authorId),
        }
      : null,
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

    const populatedBlog = await UserBlog.findById(newBlog._id).populate(
      "author",
      "username name profileImage"
    );

    const followingSet = await getFollowingSet(req.user._id);

    res.status(201).json({
      message: "Blog created successfully",
      blog: formatBlog(populatedBlog, req.user._id, followingSet),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllBlogs = async (req, res) => {
  try {
    const userId = getOptionalUserId(req);
    const followingSet = await getFollowingSet(userId);

    const blogs = await UserBlog.find({ isPublished: { $ne: false } })
      .populate("author", "username name profileImage")
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: blogs.length,
      blogs: blogs.map((blog) => formatBlog(blog, userId, followingSet)),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getBlogById = async (req, res) => {
  try {
    const viewerId = getOptionalUserId(req);

    const blog = await UserBlog.findById(req.params.id).populate(
      "author",
      "username name profileImage"
    );

    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    const isOwner =
      viewerId && String(blog.author?._id || blog.author) === String(viewerId);

    if (blog.isPublished === false && !isOwner) {
      return res.status(404).json({ message: "Blog not found" });
    }

    const followingSet = await getFollowingSet(viewerId);

    res.status(200).json({ blog: formatBlog(blog, viewerId, followingSet) });
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
      .sort({ createdAt: -1 });

    const followingSet = await getFollowingSet(viewerId);

    res.status(200).json({
      count: blogs.length,
      blogs: blogs.map((blog) => formatBlog(blog, viewerId, followingSet)),
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

    const updatedBlog = await UserBlog.findById(blog._id).populate(
      "author",
      "username name profileImage"
    );

    const followingSet = await getFollowingSet(req.user._id);

    res.status(200).json({
      message: "Blog updated successfully",
      blog: formatBlog(updatedBlog, req.user._id, followingSet),
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

    const updatedBlog = await UserBlog.findById(blog._id).populate(
      "author",
      "username name profileImage"
    );

    const followingSet = await getFollowingSet(req.user._id);

    res.status(200).json({
      message:
        blog.isPublished === false
          ? "Blog hidden successfully"
          : "Blog visible to users again",
      blog: formatBlog(updatedBlog, req.user._id, followingSet),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const reportBlog = async (req, res) => {
  try {
    const blog = await UserBlog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    res.status(200).json({ message: "Blog reported successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
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