"use client";

import { useState } from "react";
import {
  FiAlertTriangle,
  FiChevronLeft,
  FiChevronRight,
  FiCopy,
  FiEyeOff,
  FiHeart,
  FiMapPin,
  FiMessageCircle,
  FiMoreHorizontal,
  FiShare2,
  FiTrash2,
  FiUserMinus,
  FiEdit2,
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
  const [showMenu, setShowMenu] = useState(false);
  const [message, setMessage] = useState("");

  if (!open || !item) return null;

  const isBlog = item.type === "blog";

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
    setShowMenu(false);
    setTimeout(() => setMessage(""), 1500);
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title,
          text: title,
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        setMessage("Link copied for sharing");
      }
    } catch {}
    setShowMenu(false);
    setTimeout(() => setMessage(""), 1500);
  };

  const handleEdit = () => {
    setShowMenu(false);
    onEdit?.(item);
  };

  const handleHide = () => {
    setShowMenu(false);
    onHide?.(item);
  };

  const handleDelete = () => {
    setShowMenu(false);
    onDelete?.(item);
  };

  const handleReport = () => {
    setShowMenu(false);
    onReport?.(item);
  };

  const handleUnfollow = () => {
    setShowMenu(false);
    onUnfollow?.(item);
  };

  return (
    <div
      className="admin-post-modal-backdrop"
      onClick={() => {
        setShowMenu(false);
        onClose();
      }}
    >
      <button
        type="button"
        className="admin-modal-arrow admin-modal-arrow--left"
        onClick={(e) => {
          e.stopPropagation();
          setShowMenu(false);
          onPrev();
        }}
      >
        <FiChevronLeft />
      </button>

      <button
        type="button"
        className="admin-modal-arrow admin-modal-arrow--right"
        onClick={(e) => {
          e.stopPropagation();
          setShowMenu(false);
          onNext();
        }}
      >
        <FiChevronRight />
      </button>

      <div className="admin-post-modal" onClick={(e) => e.stopPropagation()}>
        <div className="admin-post-modal__top-actions">
          <div className="admin-post-modal__menu-wrap">
            <button
              type="button"
              className="admin-modal-top-btn"
              onClick={() => setShowMenu((prev) => !prev)}
            >
              <FiMoreHorizontal />
            </button>

            {showMenu && (
              <div className="admin-post-actions-menu">
                {isOwnProfile ? (
                  <>
                    <button type="button" onClick={handleEdit}>
                      <FiEdit2 />
                      Edit
                    </button>

                    <button type="button" onClick={handleHide}>
                      <FiEyeOff />
                      Hide from users
                    </button>

                    <button
                      type="button"
                      onClick={handleDelete}
                      className="danger"
                    >
                      <FiTrash2 />
                      Delete
                    </button>

                    <button type="button" onClick={handleCopy}>
                      <FiCopy />
                      Copy link
                    </button>
                  </>
                ) : (
                  <>
                    <button type="button" onClick={handleReport}>
                      <FiAlertTriangle />
                      Report
                    </button>

                    <button type="button" onClick={handleUnfollow}>
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

                <button type="button" onClick={() => setShowMenu(false)}>
                  Cancel
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            className="admin-modal-top-btn"
            onClick={onClose}
          >
            <FiX />
          </button>
        </div>

        <div className="admin-post-modal__image">
          <img src={imageSrc} alt={title} />
        </div>

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

          <div className="admin-post-modal__caption">
            {isBlog ? (
              <>
                {"excerpt" in item && item.excerpt && <p>{item.excerpt}</p>}

                <div className="admin-post-modal__blog-body">
                  {paragraphs.length ? (
                    paragraphs.map((paragraph, index) => (
                      <p key={index}>{paragraph}</p>
                    ))
                  ) : (
                    <p>No content available.</p>
                  )}
                </div>
              </>
            ) : (
              <p>{bodyText || "No caption available."}</p>
            )}
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

          {message && <div className="profile-grid-modal__toast">{message}</div>}
        </div>
      </div>
    </div>
  );
}