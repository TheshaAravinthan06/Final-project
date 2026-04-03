"use client";

import { useState } from "react";
import {
  FiAlertTriangle,
  FiChevronLeft,
  FiChevronRight,
  FiCopy,
  FiEdit2,
  FiEye,
  FiEyeOff,
  FiHeart,
  FiMapPin,
  FiMessageCircle,
  FiMoreHorizontal,
  FiShare2,
  FiTrash2,
  FiUserMinus,
  FiX,
} from "react-icons/fi";
import { ProfileGridItem } from "./types";
import { getImageSrc } from "./profileUtils";

type Props = {
  item: ProfileGridItem | null;
  open: boolean;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  isOwnProfile?: boolean;
  onEdit?: (item: ProfileGridItem) => void;
  onHide?: (item: ProfileGridItem) => void;
  onDelete?: (item: ProfileGridItem) => void;
  onReport?: (item: ProfileGridItem) => void;
  onUnfollow?: (item: ProfileGridItem) => void;
};

const formatPostDate = (dateString?: string) => {
  if (!dateString) return "";
  const now = new Date();
  const postedAt = new Date(dateString);
  const diffMs = now.getTime() - postedAt.getTime();

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  const diffMinutes = Math.floor(diffMs / minute);
  const diffHours = Math.floor(diffMs / hour);
  const diffDays = Math.floor(diffMs / day);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;

  return postedAt.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

export default function ProfileGridModal({
  item,
  open,
  onClose,
  onPrev,
  onNext,
  isOwnProfile = false,
  onEdit,
  onHide,
  onDelete,
  onReport,
  onUnfollow,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [message, setMessage] = useState("");

  if (!open || !item) return null;

  const isBlog = item.type === "blog";
  const isPublished = item.isPublished !== false;

  const imageSrc = isBlog
    ? getImageSrc(item.coverImage)
    : getImageSrc(item.imageUrl);

  const title = isBlog ? item.title || "Untitled Blog" : "Post";
  const bodyText = isBlog
    ? item.content || item.excerpt || ""
    : item.caption || "";

  const paragraphs = bodyText
    .split("\n")
    .map((t) => t.trim())
    .filter(Boolean);

  const url = `${window.location.origin}/${isBlog ? "blogs" : "posts"}/${item._id}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setMessage("Link copied");
    } catch {
      setMessage("Could not copy link");
    }
    setMenuOpen(false);
    setTimeout(() => setMessage(""), 1500);
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title, text: title, url });
      } else {
        await navigator.clipboard.writeText(url);
        setMessage("Link copied for sharing");
      }
    } catch {}
    setMenuOpen(false);
    setTimeout(() => setMessage(""), 1500);
  };

  return (
    <div className="admin-post-modal-backdrop" onClick={onClose}>
      <button
        type="button"
        className="admin-modal-arrow admin-modal-arrow--left"
        onClick={(e) => {
          e.stopPropagation();
          setMenuOpen(false);
          onPrev();
        }}
        aria-label="Previous item"
      >
        <FiChevronLeft />
      </button>

      <button
        type="button"
        className="admin-modal-arrow admin-modal-arrow--right"
        onClick={(e) => {
          e.stopPropagation();
          setMenuOpen(false);
          onNext();
        }}
        aria-label="Next item"
      >
        <FiChevronRight />
      </button>

      <div className="admin-post-modal" onClick={(e) => e.stopPropagation()}>
        {/* TOP ACTIONS */}
        <div className="admin-post-modal__top-actions">
          <div className="admin-post-modal__menu-wrap">
            <button
              type="button"
              className="admin-modal-top-btn"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label="Open menu"
            >
              <FiMoreHorizontal />
            </button>

            {menuOpen && (
              <div className="admin-post-actions-menu">
                {isOwnProfile ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onEdit?.(item);
                      }}
                    >
                      <FiEdit2 />
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onHide?.(item);
                      }}
                    >
                      {isPublished ? <FiEyeOff /> : <FiEye />}
                      {isPublished ? "Hide from users" : "Unhide"}
                    </button>

                    <button type="button" onClick={handleCopy}>
                      <FiCopy />
                      Copy link
                    </button>

                    <button
                      type="button"
                      className="danger"
                      onClick={() => {
                        setMenuOpen(false);
                        onDelete?.(item);
                      }}
                    >
                      <FiTrash2 />
                      Delete
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onReport?.(item);
                      }}
                    >
                      <FiAlertTriangle />
                      Report
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onUnfollow?.(item);
                      }}
                    >
                      <FiUserMinus />
                      Unfollow
                    </button>

                    <button type="button" onClick={handleCopy}>
                      <FiCopy />
                      Copy link
                    </button>

                    <button type="button" onClick={handleShare}>
                      <FiShare2 />
                      Share
                    </button>
                  </>
                )}

                <button type="button" onClick={() => setMenuOpen(false)}>
                  Cancel
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            className="admin-modal-top-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <FiX />
          </button>
        </div>

        {/* IMAGE */}
        <div className="admin-post-modal__image">
          <img src={imageSrc} alt={title} />
          {!isPublished && (
            <div className="admin-place-grid__hidden-badge">Hidden from users</div>
          )}
        </div>

        {/* CONTENT */}
        <div className="admin-post-modal__content">
          <div className="admin-post-modal__header">
            <div>
              <h3>{title}</h3>
              {item.location && (
                <p>
                  <FiMapPin />
                  {item.location}
                </p>
              )}
            </div>
          </div>

          <div className="admin-post-modal__stats">
            <span>
              <FiHeart />
              {item.likesCount || 0}
            </span>
            <span>
              <FiMessageCircle />
              {item.commentsCount || 0}
            </span>
          </div>

          <div className="admin-post-modal__caption">
            {isBlog ? (
              <>
                {"excerpt" in item && item.excerpt && (
                  <p>{item.excerpt}</p>
                )}
                <div>
                  {paragraphs.length ? (
                    paragraphs.map((p, i) => <p key={i}>{p}</p>)
                  ) : (
                    <p>No content available.</p>
                  )}
                </div>
              </>
            ) : (
              <p>{bodyText || "No caption available."}</p>
            )}
          </div>

          <div className="admin-post-date">
            {formatPostDate(item.createdAt)}
          </div>

          {message && (
            <div className="admin-post-modal__toast">{message}</div>
          )}
        </div>
      </div>
    </div>
  );
}