import UserBlog from "../models/userBlog.models.js";

const formatBlog = (blog) => ({
  _id: blog._id,
  title: blog.title || "",
  coverImage: blog.coverImage || "",
  excerpt: blog.excerpt || "",
  content: blog.content || "",
  location: blog.location || "",
  createdAt: blog.createdAt,
  updatedAt: blog.updatedAt,
  likesCount: blog.likes?.length || 0,
  commentsCount: blog.comments?.length || 0,
  author: blog.author
    ? {
        _id: blog.author._id,
        username: blog.author.username,
        name: blog.author.name || "",
        profileImage: blog.author.profileImage || "",
      }
    : null,
});

export const createBlog = async (req, res) => {
  try {
    const newBlog = await UserBlog.create({
      title: req.body.title,
      excerpt: req.body.excerpt,
      content: req.body.content,
      location: req.body.location,
      coverImage: req.file ? `/uploads/blogs/${req.file.filename}` : "",
      author: req.user._id,
    });

    const populatedBlog = await UserBlog.findById(newBlog._id).populate(
      "author",
      "username name profileImage"
    );

    res.status(201).json({
      message: "Blog created successfully",
      blog: formatBlog(populatedBlog),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllBlogs = async (req, res) => {
  try {
    const blogs = await UserBlog.find()
      .populate("author", "username name profileImage")
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: blogs.length,
      blogs: blogs.map(formatBlog),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getBlogById = async (req, res) => {
  try {
    const blog = await UserBlog.findById(req.params.id).populate(
      "author",
      "username name profileImage"
    );

    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    res.status(200).json({ blog: formatBlog(blog) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getBlogsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    const blogs = await UserBlog.find({ author: userId })
      .populate("author", "username name profileImage")
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: blogs.length,
      blogs: blogs.map(formatBlog),
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

    res.status(200).json({
      message: "Blog updated successfully",
      blog: formatBlog(updatedBlog),
    });
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