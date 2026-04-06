"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import api from "@/lib/axios";
import ShareToFollowingModal from "@/components/common/ShareToFollowingModal";
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
    isFollowing?: boolean;
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
  const [commentsCount, setCommentsCount] = useState(post.commentsCount || 0);
  const [shareCount, setShareCount] = useState(post.shareCount || 0);
  const [commentText, setCommentText] = useState("");
  const [showShareModal, setShowShareModal] = useState(false);
  const [toast, setToast] = useState("");

  const [currentUserId, setCurrentUserId] = useState("");
  const [followLoading, setFollowLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(
    Boolean(post.createdBy?.isFollowing)
  );
  const [showMenu, setShowMenu] = useState(false);
  const [showUnfollowModal, setShowUnfollowModal] = useState(false);
  const [expandedCaption, setExpandedCaption] = useState(false);

  const menuRef = useRef<HTMLDivElement | null>(null);
  const commentInputRef = useRef<HTMLInputElement | null>(null);

  const username = post.createdBy?.username || "user";
  const avatarSrc = useMemo(
    () => getProfileSrc(post.createdBy?.profileImage),
    [post.createdBy?.profileImage]
  );
  const postImageSrc = useMemo(
    () => getImageSrc(post.imageUrl),
    [post.imageUrl]
  );
  const timeText = useMemo(
    () => formatTimeAgo(post.createdAt),
    [post.createdAt]
  );

  const captionLimit = 100;

const fullCaption = post.caption || "";
const shortCaption =
  fullCaption.length > captionLimit
    ? `${fullCaption.slice(0, captionLimit).trim()}...`
    : fullCaption;

const hasLongCaption = fullCaption.length > captionLimit;

  const authorId = post.createdBy?._id || "";
  const isOwnPost = !!currentUserId && currentUserId === authorId;
  const canShowFollow = !!authorId && !isOwnPost && !isFollowing;

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
    window.setTimeout(() => setToast(""), 1500);
  };

  const handleLike = async () => {
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikesCount((prev) => (nextLiked ? prev + 1 : Math.max(prev - 1, 0)));

    try {
      if (nextLiked) {
        await api.post(`/user-posts/${post._id}/like`);
      } else {
        await api.post(`/user-posts/${post._id}/unlike`);
      }
    } catch (error) {
      console.error("Like failed:", error);
      setLiked(!nextLiked);
      setLikesCount((prev) => (nextLiked ? Math.max(prev - 1, 0) : prev + 1));
    }
  };

  const handleDoubleClickLike = () => {
    if (!liked) {
      handleLike();
    }
  };

  const handleSave = async () => {
    const nextSaved = !saved;
    setSaved(nextSaved);
    showToast(nextSaved ? "Saved" : "Removed");

    try {
      if (nextSaved) {
        await api.post(`/user-posts/${post._id}/save`);
      } else {
        await api.post(`/user-posts/${post._id}/unsave`);
      }
    } catch (error) {
      console.error("Save failed:", error);
      setSaved(!nextSaved);
      showToast("Save failed");
    }
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;

    const text = commentText.trim();
    setCommentText("");

    try {
      await api.post(`/user-posts/${post._id}/comment`, { text });
      setCommentsCount((prev) => prev + 1);
    } catch (error) {
      console.error("Comment failed:", error);
      alert("Failed to comment.");
    }
  };

  const handleShare = () => {
    setShareCount((prev) => prev + 1);
    setShowShareModal(true);
  };

  const handleCopyLink = async () => {
    try {
      const url = `${window.location.origin}/home?post=${post._id}`;
      await navigator.clipboard.writeText(url);
      showToast("Link copied");
    } catch (error) {
      console.error("Copy link failed:", error);
    } finally {
      setShowMenu(false);
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
      await api.post(`/user-posts/${post._id}/report`);
      showToast("Reported");
    } catch (error) {
      console.error("Report failed:", error);
    } finally {
      setShowMenu(false);
    }
  };

  const handleOwnEdit = () => {
    setShowMenu(false);
    alert("Connect this to your user post edit flow.");
  };

  const handleOwnDelete = async () => {
    try {
      await api.delete(`/user-posts/${post._id}`);
      setShowMenu(false);
      window.location.reload();
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  return (
    <>
      <article className="feed-card">
        <div className="feed-card__header">
          <div className="feed-card__user">
            <img src={avatarSrc} alt={username} />
            <div>
              <h4>{username}</h4>
              <p>{timeText}</p>
            </div>
          </div>

          <div className="feed-card__header-actions" ref={menuRef}>
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
                {isOwnPost ? (
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

        <div
          className="feed-card__image feed-card__image--square"
          onDoubleClick={handleDoubleClickLike}
        >
          <img src={postImageSrc} alt={post.caption || "Post image"} />
        </div>

        <div className="feed-card__actions feed-card__actions--inline-stats">
          <div className="feed-action-stat">
            <button
              type="button"
              className={`icon-btn ${liked ? "icon-btn--active" : ""}`}
              onClick={handleLike}
            >
              <FiHeart />
            </button>
            <span className="feed-action-stat__count">{likesCount}</span>
          </div>

          <div className="feed-action-stat">
            <button
              type="button"
              className="icon-btn"
              onClick={() => commentInputRef.current?.focus()}
            >
              <FiMessageCircle />
            </button>
            <span className="feed-action-stat__count">{commentsCount}</span>
          </div>

          <div className="feed-action-stat">
            <button type="button" className="icon-btn" onClick={handleShare}>
              <FiSend />
            </button>
            <span className="feed-action-stat__count">{shareCount}</span>
          </div>

          <button
            type="button"
            className={`icon-btn feed-save-btn ${
              saved ? "icon-btn--saved" : ""
            }`}
            onClick={handleSave}
          >
            <FiBookmark />
          </button>
        </div>

        <div className="feed-card__body">
          <p className="feed-card__caption">
  <span className="feed-card__caption-username">{username}</span>{" "}
  {expandedCaption ? fullCaption : shortCaption}

  {!expandedCaption && hasLongCaption && (
    <button
      type="button"
      className="feed-card__more-btn"
      onClick={() => setExpandedCaption(true)}
    >
      more...
    </button>
  )}
</p>

          <div className="comment-box feed-card__comment-box">
            <input
              ref={commentInputRef}
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

      {toast && <div className="save-toast">{toast}</div>}

      <ShareToFollowingModal
        open={showShareModal}
        onClose={() => setShowShareModal(false)}
        title="Share post"
        shareText={post.caption || "Check this post"}
        shareUrl={`${
          typeof window !== "undefined" ? window.location.origin : ""
        }/home?post=${post._id}`}
      />

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