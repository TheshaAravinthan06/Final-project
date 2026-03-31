"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/lib/axios";
import { useParams, useRouter } from "next/navigation";
import {
  FiHeart,
  FiMessageCircle,
  FiBookmark,
  FiSend,
} from "react-icons/fi";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

const getImageSrc = (imageUrl?: string) => {
  if (!imageUrl) return "/images/ella.jpg";
  if (imageUrl.startsWith("http")) return imageUrl;
  return `${BACKEND_URL}${imageUrl}`;
};

export default function BlogDetail() {
  const { id } = useParams();
  const router = useRouter();

  const [blog, setBlog] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [commentText, setCommentText] = useState("");

  useEffect(() => {
    api.get(`/blogs/${id}`).then((res) => {
      const fetchedBlog = res.data.blog;
      setBlog(fetchedBlog);
      setLiked(Boolean(fetchedBlog?.isLiked));
      setSaved(Boolean(fetchedBlog?.isSaved));
      setLikesCount(fetchedBlog?.likesCount || 0);
    });
  }, [id]);

  useEffect(() => {
    api.get("/auth/me").then((res) => {
      setUser(res.data.user);
    });
  }, []);

  const coverSrc = useMemo(() => getImageSrc(blog?.coverImage), [blog?.coverImage]);

  if (!blog) {
    return <div className="blog-detail-loading">Loading blog...</div>;
  }

  const handleLike = async () => {
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikesCount((prev: number) =>
      nextLiked ? prev + 1 : Math.max(prev - 1, 0)
    );

    try {
      if (nextLiked) {
        await api.post(`/blogs/${blog._id}/like`);
      } else {
        await api.post(`/blogs/${blog._id}/unlike`);
      }
    } catch (error) {
      console.error("Blog like failed:", error);
      setLiked(!nextLiked);
      setLikesCount((prev: number) =>
        nextLiked ? Math.max(prev - 1, 0) : prev + 1
      );
    }
  };

  const handleSave = async () => {
    const nextSaved = !saved;
    setSaved(nextSaved);

    try {
      if (nextSaved) {
        await api.post(`/blogs/${blog._id}/save`);
      } else {
        await api.post(`/blogs/${blog._id}/unsave`);
      }
    } catch (error) {
      console.error("Blog save failed:", error);
      setSaved(!nextSaved);
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/blogs/${blog._id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: blog.title,
          text: blog.excerpt || "Check this blog",
          url: shareUrl,
        });
      } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
      } catch {}
    }
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;

    const text = commentText.trim();
    setCommentText("");

    try {
      await api.post(`/blogs/${blog._id}/comment`, { text });
    } catch (error) {
      console.error("Blog comment failed:", error);
      alert("Failed to comment.");
    }
  };

  const paragraphs = String(blog.content || "")
    .split("\n")
    .filter((line) => line.trim() !== "");

  return (
    <section className="blog-detail-page">
      <div className="blog-detail-shell">
        <article className="blog-detail-card">
          <div className="blog-detail-head">
            <div>
              <p className="blog-detail-eyebrow">Travel Blog</p>
              <h1>{blog.title}</h1>
            </div>

            {user && blog.author?._id === user._id && (
              <button
                type="button"
                className="blog-detail-edit-btn"
                onClick={() => router.push(`/edit-blog/${blog._id}`)}
              >
                Edit
              </button>
            )}
          </div>

          <div className="blog-detail-cover">
            <img src={coverSrc} alt={blog.title} />
          </div>

          <div className="blog-detail-content">
            {paragraphs.length > 0 ? (
              paragraphs.map((para, index) => <p key={index}>{para}</p>)
            ) : (
              <p>{blog.content}</p>
            )}
          </div>

          <div className="blog-detail-actions">
            <div className="blog-detail-actions__left">
              <button
                type="button"
                className={`icon-btn ${liked ? "icon-btn--active" : ""}`}
                onClick={handleLike}
              >
                <FiHeart />
              </button>

              <button type="button" className="icon-btn">
                <FiMessageCircle />
              </button>

              <button type="button" className="icon-btn" onClick={handleShare}>
                <FiSend />
              </button>
            </div>

            <button
              type="button"
              className={`icon-btn ${saved ? "icon-btn--active" : ""}`}
              onClick={handleSave}
            >
              <FiBookmark />
            </button>
          </div>

          <div className="blog-detail-footer">
            <p className="blog-detail-likes">{likesCount} likes</p>

            <div className="comment-box">
              <input
                type="text"
                placeholder="Write a comment"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />
              <button type="button" onClick={handleComment}>
                Post
              </button>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}