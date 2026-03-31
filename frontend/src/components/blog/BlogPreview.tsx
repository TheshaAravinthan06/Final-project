"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import {
  FiHeart,
  FiMessageCircle,
  FiBookmark,
  FiMoreHorizontal,
  FiSend,
} from "react-icons/fi";

type BlogPreviewProps = {
  blog: {
    _id: string;
    title: string;
    coverImage: string;
    excerpt?: string;
    content: string;
    location?: string;
    createdAt: string;
    likesCount?: number;
    commentsCount?: number;
    savesCount?: number;
    isLiked?: boolean;
    isSaved?: boolean;
    author?: {
      _id?: string;
      username?: string;
      profileImage?: string;
    } | null;
  };
};

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

const getImageSrc = (imageUrl?: string) => {
  if (!imageUrl) return "/images/ella.jpg";
  if (imageUrl.startsWith("http")) return imageUrl;
  return `${BACKEND_URL}${imageUrl}`;
};

const getProfileSrc = (profileImage?: string) => {
  if (!profileImage) return "/images/user-avatar.jpg";
  if (profileImage.startsWith("http")) return profileImage;
  return `${BACKEND_URL}${profileImage}`;
};

const formatTimeAgo = (dateString?: string) => {
  if (!dateString) return "";
  const now = new Date().getTime();
  const created = new Date(dateString).getTime();
  const diffMs = now - created;

  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d`;

  return new Date(dateString).toLocaleDateString();
};

export default function BlogPreview({ blog }: BlogPreviewProps) {
  const router = useRouter();

  const [liked, setLiked] = useState(Boolean(blog.isLiked));
  const [saved, setSaved] = useState(Boolean(blog.isSaved));
  const [likesCount, setLikesCount] = useState(blog.likesCount || 0);
  const [commentText, setCommentText] = useState("");

  const username = blog.author?.username || "user";
  const avatarSrc = useMemo(
    () => getProfileSrc(blog.author?.profileImage),
    [blog.author?.profileImage]
  );
  const coverSrc = useMemo(() => getImageSrc(blog.coverImage), [blog.coverImage]);
  const timeText = useMemo(() => formatTimeAgo(blog.createdAt), [blog.createdAt]);

  const previewText =
    blog.excerpt?.trim() ||
    blog.content?.trim()?.slice(0, 160) + (blog.content?.length > 160 ? "..." : "");

  const handleLike = async () => {
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikesCount((prev) => (nextLiked ? prev + 1 : Math.max(prev - 1, 0)));

    try {
      if (nextLiked) {
        await api.post(`/blogs/${blog._id}/like`);
      } else {
        await api.post(`/blogs/${blog._id}/unlike`);
      }
    } catch (error) {
      console.error("Blog like failed:", error);
      setLiked(!nextLiked);
      setLikesCount((prev) => (nextLiked ? Math.max(prev - 1, 0) : prev + 1));
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

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/blogs/${blog._id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: blog.title,
          text: previewText || "Check this blog",
          url: shareUrl,
        });
      } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
      } catch {}
    }
  };

  return (
    <article className="blog-feed-card">
      <div className="blog-feed-card__header">
        <div className="blog-feed-card__user">
          <img src={avatarSrc} alt={username} />
          <div>
            <h4>{username}</h4>
            <p>{timeText}</p>
          </div>
        </div>

        <div className="blog-feed-card__header-actions">
          <button type="button" className="follow-btn">
            Follow
          </button>

          <button type="button" className="icon-btn">
            <FiMoreHorizontal />
          </button>
        </div>
      </div>

      <div className="blog-feed-card__content-wrap">
        <div className="blog-feed-card__image">
          <img src={coverSrc} alt={blog.title} />
        </div>

        <div className="blog-feed-card__content">
          <div className="blog-feed-card__content-top">
            <h3>{blog.title}</h3>
            {blog.location ? (
              <span className="blog-feed-card__location">{blog.location}</span>
            ) : null}
            <p>{previewText}</p>
          </div>

          <button
            type="button"
            className="blog-feed-card__read-more"
            onClick={() => router.push(`/blogs/${blog._id}`)}
          >
            Read more
          </button>
        </div>
      </div>

      <div className="blog-feed-card__actions">
        <div className="blog-feed-card__actions-left">
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

      <div className="blog-feed-card__footer">
        <p className="blog-feed-card__meta">
          <span>{likesCount} likes</span>
        </p>

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
  );
}