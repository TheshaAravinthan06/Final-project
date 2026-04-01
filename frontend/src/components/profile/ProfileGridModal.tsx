"use client";

import { useState } from "react";
import {
  FiAlertTriangle,
  FiChevronLeft,
  FiChevronRight,
  FiCopy,
  FiEdit2,
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
    setMenuOpen(false);
    setTimeout(() => setMessage(""), 1500);
  };

  return (
    <div
      className="profile-modal-backdrop"
      onClick={() => {
        setMenuOpen(false);
        onClose();
      }}
    >
      <div
        className="profile-grid-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="profile-grid-modal__top-actions">
          <div className="profile-grid-modal__menu-wrap">
            <button
              type="button"
              className="profile-grid-modal__icon-btn"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((prev) => !prev);
              }}
              aria-label="Open menu"
            >
              <FiMoreHorizontal />
            </button>

            {menuOpen && (
              <div className="profile-grid-modal__menu">
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
                      <FiEyeOff />
                      Hide from users
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

                    <button type="button" onClick={handleCopy}>
                      <FiCopy />
                      Copy link
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

                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            className="profile-grid-modal__icon-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <FiX />
          </button>
        </div>

        <button
          type="button"
          className="profile-grid-modal__nav profile-grid-modal__nav--left"
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
          className="profile-grid-modal__nav profile-grid-modal__nav--right"
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen(false);
            onNext();
          }}
          aria-label="Next item"
        >
          <FiChevronRight />
        </button>

        <div className="profile-grid-modal__media">
          <img src={imageSrc} alt={title} />
        </div>

        <div className="profile-grid-modal__content">
          <div className="profile-grid-modal__top">
            <h2>{title}</h2>

            {item.location && (
              <div className="profile-grid-modal__location">
                <FiMapPin />
                <span>{item.location}</span>
              </div>
            )}
          </div>

          <div className="profile-grid-modal__stats">
            <span>
              <FiHeart />
              {item.likesCount || 0}
            </span>

            <span>
              <FiMessageCircle />
              {item.commentsCount || 0}
            </span>
          </div>

          {isBlog ? (
            <>
              {"excerpt" in item && item.excerpt && (
                <p className="profile-grid-modal__excerpt">
                  {item.excerpt}
                </p>
              )}

              <div className="profile-grid-modal__body">
                {paragraphs.length ? (
                  paragraphs.map((p, i) => <p key={i}>{p}</p>)
                ) : (
                  <p>No content available.</p>
                )}
              </div>
            </>
          ) : (
            <div className="profile-grid-modal__body">
              <p>{bodyText || "No caption available."}</p>
            </div>
          )}

          {message && (
            <div className="profile-grid-modal__toast">
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}