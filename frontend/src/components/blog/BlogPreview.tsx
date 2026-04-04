"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import {
  FiHeart,
  FiMessageCircle,
  FiBookmark,
  FiMoreHorizontal,
  FiSend,
  FiAlertTriangle,
  FiCopy,
  FiEdit2,
  FiTrash2,
  FiUserMinus,
} from "react-icons/fi";

type BlogPreviewProps = {
  blog: {
    _id: string;
    title: string;
    coverImage?: string;
    excerpt?: string;
    content?: string;
    location?: string;
    createdAt?: string;
    likesCount?: number;
    commentsCount?: number;
    savesCount?: number;
    isLiked?: boolean;
    isSaved?: boolean;
    author?: {
      _id?: string;
      username?: string;
      profileImage?: string;
      isFollowing?: boolean;
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
  const [toast, setToast] = useState("");

  const [currentUserId, setCurrentUserId] = useState("");
  const [followLoading, setFollowLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(
    Boolean(blog.author?.isFollowing)
  );
  const [showMenu, setShowMenu] = useState(false);
  const [showUnfollowModal, setShowUnfollowModal] = useState(false);

  const menuRef = useRef<HTMLDivElement | null>(null);

  const username = blog.author?.username || "user";
  const avatarSrc = useMemo(
    () => getProfileSrc(blog.author?.profileImage),
    [blog.author?.profileImage]
  );
  const coverSrc = useMemo(() => getImageSrc(blog.coverImage), [blog.coverImage]);
  const timeText = useMemo(() => formatTimeAgo(blog.createdAt), [blog.createdAt]);

  const previewText =
    blog.excerpt?.trim() ||
    `${blog.content?.trim()?.slice(0, 160) || ""}${
      (blog.content?.length || 0) > 160 ? "..." : ""
    }`;

  const authorId = blog.author?._id || "";
  const isOwnBlog = !!currentUserId && currentUserId === authorId;
  const canShowFollow = !!authorId && !isOwnBlog && !isFollowing;

  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const res = await api.get("/users/me");
        const me = res.data?.user || res.data;
        setCurrentUserId(me?._id || "");
      } catch (error) {
        console.error("Failed to load current user:", error);
      }
    };

    loadCurrentUser();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu]);

  const showToast = (text: string) => {
    setToast(text);
    window.setTimeout(() => setToast(""), 1800);
  };

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
        showToast("Saved to Blogs");
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

  const handleCopyLink = async () => {
    try {
      const url = `${window.location.origin}/blogs/${blog._id}`;
      await navigator.clipboard.writeText(url);
    } catch (error) {
      console.error("Copy link failed:", error);
    } finally {
      setShowMenu(false);
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

  const handleFollow = async () => {
    if (!authorId || followLoading) return;

    try {
      setFollowLoading(true);
      await api.post(`/users/${authorId}/follow`);
      setIsFollowing(true);
    } catch (error) {
      console.error("Follow failed:", error);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleUnfollow = async () => {
    if (!authorId || followLoading) return;

    try {
      setFollowLoading(true);
      await api.post(`/users/${authorId}/unfollow`);
      setIsFollowing(false);
      setShowUnfollowModal(false);
      setShowMenu(false);
    } catch (error) {
      console.error("Unfollow failed:", error);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleReport = async () => {
    try {
      await api.post(`/blogs/${blog._id}/report`);
    } catch (error) {
      console.error("Report failed:", error);
    } finally {
      setShowMenu(false);
    }
  };

  const handleBlock = async () => {
    if (!authorId) return;

    try {
      await api.post(`/users/${authorId}/block`);
      setShowMenu(false);
      window.location.reload();
    } catch (error) {
      console.error("Block failed:", error);
    }
  };

  const handleOwnEdit = () => {
    setShowMenu(false);
    router.push(`/blogs/edit/${blog._id}`);
  };

  const handleOwnDelete = async () => {
    try {
      await api.delete(`/blogs/${blog._id}`);
      setShowMenu(false);
      window.location.reload();
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  return (
    <>
      <article className="blog-feed-card">
        {toast ? <div className="save-toast">{toast}</div> : null}

        <div className="blog-feed-card__header">
          <div className="blog-feed-card__user">
            <img src={avatarSrc} alt={username} />
            <div>
              <h4>{username}</h4>
              <p>{timeText}</p>
            </div>
          </div>

          <div className="blog-feed-card__header-actions" ref={menuRef}>
            {canShowFollow ? (
              <button
                type="button"
                className="follow-btn"
                onClick={handleFollow}
                disabled={followLoading}
              >
                {followLoading ? "Please wait..." : "Follow"}
              </button>
            ) : null}

            <button
              type="button"
              className="icon-btn"
              onClick={() => setShowMenu((prev) => !prev)}
            >
              <FiMoreHorizontal />
            </button>

            {showMenu && (
              <div className="feed-more-menu">
                {isOwnBlog ? (
                  <>
                    <button type="button" onClick={handleOwnEdit}>
                      <FiEdit2 />
                      Edit
                    </button>

                    <button
                      type="button"
                      className="danger"
                      onClick={handleOwnDelete}
                    >
                      <FiTrash2 />
                      Delete
                    </button>

                    <button type="button" onClick={handleCopyLink}>
                      <FiCopy />
                      Copy link
                    </button>

                    <button type="button" onClick={() => setShowMenu(false)}>
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button type="button" onClick={handleReport}>
                      <FiAlertTriangle />
                      Report
                    </button>

                    <button type="button" onClick={handleBlock}>
                      <FiUserMinus />
                      Block account
                    </button>

                    {isFollowing && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowMenu(false);
                          setShowUnfollowModal(true);
                        }}
                      >
                        <FiUserMinus />
                        Unfollow
                      </button>
                    )}

                    <button type="button" onClick={handleCopyLink}>
                      <FiCopy />
                      Copy link
                    </button>

                    <button type="button" onClick={() => setShowMenu(false)}>
                      Cancel
                    </button>
                  </>
                )}
              </div>
            )}
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
          <p className="blog-feed-card__caption">
            <span>{username}</span> {previewText}
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

      {showUnfollowModal && (
        <div
          className="unfollow-modal-backdrop"
          onClick={() => setShowUnfollowModal(false)}
        >
          <div className="unfollow-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Are you sure you want to unfollow?</h3>
            <p>You will stop seeing updates from this user.</p>

            <div className="unfollow-modal__actions">
              <button
                type="button"
                className="unfollow-confirm-btn"
                onClick={handleUnfollow}
                disabled={followLoading}
              >
                {followLoading ? "Please wait..." : "Unfollow"}
              </button>

              <button
                type="button"
                className="unfollow-cancel-btn"
                onClick={() => setShowUnfollowModal(false)}
                disabled={followLoading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}