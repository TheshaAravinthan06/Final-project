"use client";

import { useMemo, useState } from "react";
import api from "@/lib/axios";
import {
  FiHeart,
  FiMessageCircle,
  FiBookmark,
  FiMoreHorizontal,
  FiSend,
} from "react-icons/fi";

type FeedPost = {
  _id: string;
  imageUrl: string;
  caption: string;
  location?: string;
  createdAt: string;
  likesCount: number;
  commentsCount: number;
  savesCount: number;
  shareCount: number;
  isLiked?: boolean;
  isSaved?: boolean;
  createdBy?: {
    _id: string;
    username: string;
    name?: string;
    profileImage?: string;
  } | null;
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

export default function FeedPostCard({ post }: { post: FeedPost }) {
  const [liked, setLiked] = useState(Boolean(post.isLiked));
  const [saved, setSaved] = useState(Boolean(post.isSaved));
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  const [commentText, setCommentText] = useState("");

  const username = post.createdBy?.username || "user";
  const avatarSrc = useMemo(
    () => getProfileSrc(post.createdBy?.profileImage),
    [post.createdBy?.profileImage]
  );
  const postImageSrc = useMemo(() => getImageSrc(post.imageUrl), [post.imageUrl]);
  const timeText = useMemo(() => formatTimeAgo(post.createdAt), [post.createdAt]);

  const handleLike = async () => {
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikesCount((prev) => (nextLiked ? prev + 1 : prev - 1));

    try {
      if (nextLiked) {
        await api.post(`/user-posts/${post._id}/like`);
      } else {
        await api.post(`/user-posts/${post._id}/unlike`);
      }
    } catch (error) {
      console.error("Like failed:", error);
      setLiked(!nextLiked);
      setLikesCount((prev) => (nextLiked ? prev - 1 : prev + 1));
    }
  };

  const handleSave = async () => {
    const nextSaved = !saved;
    setSaved(nextSaved);

    try {
      if (nextSaved) {
        await api.post(`/user-posts/${post._id}/save`);
      } else {
        await api.post(`/user-posts/${post._id}/unsave`);
      }
    } catch (error) {
      console.error("Save failed:", error);
      setSaved(!nextSaved);
    }
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;

    const text = commentText.trim();
    setCommentText("");

    try {
      await api.post(`/user-posts/${post._id}/comment`, { text });
    } catch (error) {
      console.error("Comment failed:", error);
      alert("Failed to comment.");
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/home?post=${post._id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: username,
          text: post.caption || "Check this post",
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
    <article className="feed-card">
      <div className="feed-card__header">
        <div className="feed-card__user">
          <img src={avatarSrc} alt={username} />
          <div>
            <h4>{username}</h4>
            <p>{timeText}</p>
          </div>
        </div>

        <div className="feed-card__header-actions">
          <button type="button" className="follow-btn">
            Follow
          </button>

          <button type="button" className="icon-btn">
            <FiMoreHorizontal />
          </button>
        </div>
      </div>

      <div className="feed-card__image feed-card__image--square">
        <img src={postImageSrc} alt={post.caption || "Post image"} />
      </div>

      <div className="feed-card__actions">
        <div className="feed-card__actions-left">
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

      <div className="feed-card__body">
        <p className="feed-card__caption">
          <span>{username}</span> {post.caption || ""}
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