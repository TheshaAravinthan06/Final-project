"use client";

import { useState } from "react";
import {
  FiChevronLeft,
  FiChevronRight,
  FiCopy,
  FiHeart,
  FiMapPin,
  FiMessageCircle,
  FiMoreHorizontal,
  FiShare2,
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
};

export default function ProfileGridModal({
  item,
  open,
  onClose,
  onPrev,
  onNext,
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

  const url = `${window.location.origin}/${
    isBlog ? "blogs" : "posts"
  }/${item._id}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setMessage("Link copied");
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
    <div className="profile-modal-backdrop" onClick={onClose}>
      <div
        className="profile-grid-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* TOP RIGHT ACTIONS */}
        <div className="profile-grid-modal__top-actions">
          <div className="profile-grid-modal__menu-wrap">
            <button
              className="profile-grid-modal__icon-btn"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((prev) => !prev);
              }}
            >
              <FiMoreHorizontal />
            </button>

            {menuOpen && (
              <div className="profile-grid-modal__menu">
                <button onClick={handleCopy}>
                  <FiCopy /> Copy link
                </button>
                <button onClick={handleShare}>
                  <FiShare2 /> Share
                </button>
                <button onClick={() => setMenuOpen(false)}>Cancel</button>
              </div>
            )}
          </div>

          <button
            className="profile-grid-modal__icon-btn"
            onClick={onClose}
          >
            <FiX />
          </button>
        </div>

        {/* NAV */}
        <button
          className="profile-grid-modal__nav profile-grid-modal__nav--left"
          onClick={(e) => {
            e.stopPropagation();
            onPrev();
          }}
        >
          <FiChevronLeft />
        </button>

        <button
          className="profile-grid-modal__nav profile-grid-modal__nav--right"
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
        >
          <FiChevronRight />
        </button>

        {/* IMAGE */}
        <div className="profile-grid-modal__media">
          <img src={imageSrc} alt={title} />
        </div>

        {/* CONTENT */}
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
              <FiHeart /> {item.likesCount || 0}
            </span>
            <span>
              <FiMessageCircle /> {item.commentsCount || 0}
            </span>
          </div>

          {isBlog ? (
            <>
              {item.excerpt && (
                <p className="profile-grid-modal__excerpt">
                  {item.excerpt}
                </p>
              )}

              <div className="profile-grid-modal__body">
                {paragraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </>
          ) : (
            <div className="profile-grid-modal__body">
              <p>{bodyText}</p>
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