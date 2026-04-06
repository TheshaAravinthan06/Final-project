"use client";

import { useMemo, useRef, useState } from "react";
import {
  FiBookmark,
  FiHeart,
  FiMapPin,
  FiMessageCircle,
  FiSend,
} from "react-icons/fi";
import api from "@/lib/axios";
import ShareToFollowingModal from "@/components/common/ShareToFollowingModal";

type PlaceComment = {
  _id: string;
  text: string;
  createdAt?: string;
  user?: {
    _id?: string;
    username?: string;
    profileImage?: string;
  };
};

type Place = {
  _id: string;
  imageUrl: string;
  placeName: string;
  location: string;
  caption: string;
  moodTags: string[];
  bestTime: string;
  weather: string;
  vibe: string;
  travelTip: string;
  createdBy?: {
    username?: string;
  };
  likesCount?: number;
  savesCount?: number;
  commentsCount?: number;
  shareCount?: number;
  isLiked?: boolean;
  isSaved?: boolean;
  comments?: PlaceComment[];
};

type Props = {
  place: Place;
  onPlaceUpdated: (updatedPlace: Place) => void;
};

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

const getPlaceImageSrc = (imageUrl?: string) => {
  if (!imageUrl) return "/images/ella.jpg";

  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }

  if (imageUrl.startsWith("/")) {
    return `${BACKEND_URL}${imageUrl}`;
  }

  return `${BACKEND_URL}/${imageUrl}`;
};

export default function ExplorePlacesCard({ place, onPlaceUpdated }: Props) {
  const [commentText, setCommentText] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [toast, setToast] = useState("");
const [showMoreDetails, setShowMoreDetails] = useState(false);
  const commentInputRef = useRef<HTMLInputElement | null>(null);

  const imageSrc = useMemo(
    () => getPlaceImageSrc(place.imageUrl),
    [place.imageUrl]
  );

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => {
      setToast("");
    }, 1500);
  };

  const handleLike = async () => {
    try {
      const res = await api.post(`/places/${place._id}/like`);
      onPlaceUpdated(res.data.place);
    } catch (error) {
      console.error("Like failed:", error);
    }
  };

  const handleDoubleClickLike = async () => {
    if (place.isLiked) return;
    await handleLike();
  };

  const handleSave = async () => {
    try {
      const nextSaved = !place.isSaved;
      showToast(nextSaved ? "Saved" : "Removed");

      const res = await api.post(`/places/${place._id}/save`);
      onPlaceUpdated(res.data.place);
    } catch (error) {
      console.error("Save failed:", error);
    }
  };

  const handleShare = async () => {
    try {
      const res = await api.post(`/places/${place._id}/share`);
      onPlaceUpdated(res.data.place);
      setShowShareModal(true);
    } catch (error) {
      console.error("Share failed:", error);
    }
  };

  const handleCommentSubmit = async () => {
    if (!commentText.trim()) return;

    try {
      setSubmittingComment(true);

      const res = await api.post(`/places/${place._id}/comments`, {
        text: commentText.trim(),
      });

      onPlaceUpdated(res.data.place);
      setCommentText("");
      setShowComments(true);
    } catch (error) {
      console.error("Comment failed:", error);
    } finally {
      setSubmittingComment(false);
    }
  };

  return (
    <>
      <article className="feed-card place-card">
        <div className="feed-card__header">
          <div className="feed-card__user">
            <div className="place-avatar">
              {place.placeName?.charAt(0)?.toUpperCase() || "P"}
            </div>

            <div>
              <h4>{place.placeName}</h4>
              <p>by {place.createdBy?.username || "admin"} · Explore Places</p>
            </div>
          </div>

          <button type="button" className="place-tag-btn">
            Admin Post
          </button>
        </div>

        <div className="feed-card__image" onDoubleClick={handleDoubleClickLike}>
          <img
            src={imageSrc}
            alt={place.placeName}
            onError={(e) => {
              e.currentTarget.src = "/images/ella.jpg";
            }}
          />
        </div>

        <div className="feed-card__actions feed-card__actions--inline-stats">
          <div className="feed-action-stat">
            <button
              type="button"
              className={`icon-btn ${place.isLiked ? "icon-btn--active" : ""}`}
              onClick={handleLike}
            >
              <FiHeart />
            </button>
            <span className="feed-action-stat__count">
              {place.likesCount || 0}
            </span>
          </div>

          <div className="feed-action-stat">
            <button
              type="button"
              className="icon-btn"
              onClick={() => {
                setShowComments(true);
                setTimeout(() => {
                  commentInputRef.current?.focus();
                }, 0);
              }}
            >
              <FiMessageCircle />
            </button>
            <span className="feed-action-stat__count">
              {place.commentsCount || 0}
            </span>
          </div>

          <div className="feed-action-stat">
            <button type="button" className="icon-btn" onClick={handleShare}>
              <FiSend />
            </button>
            <span className="feed-action-stat__count">
              {place.shareCount || 0}
            </span>
          </div>

          <button
            type="button"
            className={`icon-btn feed-save-btn ${
              place.isSaved ? "icon-btn--saved" : ""
            }`}
            onClick={handleSave}
          >
            <FiBookmark />
          </button>
        </div>

        <div className="feed-card__body place-card__body">
          <div className="place-meta-line">
            <FiMapPin />
            <span>{place.location}</span>
          </div>

          <p className="place-caption place-card__caption">{place.caption}</p>

          {place.moodTags?.length > 0 && (
            <div className="place-tags">
              {place.moodTags.map((tag, index) => (
                <span key={`${tag}-${index}`}>#{tag}</span>
              ))}
            </div>
          )}

         {(place.bestTime || place.weather || place.vibe || place.travelTip) && (
  <div className="place-more-toggle-wrap">
    {!showMoreDetails ? (
      <button
        type="button"
        className="place-more-btn"
        onClick={() => setShowMoreDetails(true)}
      >
        more...
      </button>
    ) : (
      <>
        <div className="place-extra">
          {place.bestTime && (
            <p>
              <strong>Best time:</strong> {place.bestTime}
            </p>
          )}

          {place.weather && (
            <p>
              <strong>Weather:</strong> {place.weather}
            </p>
          )}

          {place.vibe && (
            <p>
              <strong>Vibe:</strong> {place.vibe}
            </p>
          )}

          {place.travelTip && (
            <p>
              <strong>Tip:</strong> {place.travelTip}
            </p>
          )}
        </div>

        <button
          type="button"
          className="place-more-btn"
          onClick={() => setShowMoreDetails(false)}
        >
          less
        </button>
      </>
    )}
  </div>
)}

          <div className="comment-box place-card__comment-box">
            <input
              ref={commentInputRef}
              type="text"
              placeholder="Write a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />

            <button
              type="button"
              onClick={handleCommentSubmit}
              disabled={submittingComment}
            >
              {submittingComment ? "Posting..." : "Post"}
            </button>
          </div>

          {showComments && (
            <div className="comment-list">
              {(place.comments || []).length === 0 ? (
                <p className="comment-empty">No comments yet.</p>
              ) : (
                (place.comments || []).map((comment) => (
                  <div key={comment._id} className="comment-item">
                    <strong>{comment.user?.username || "user"}</strong>
                    <span>{comment.text}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <ShareToFollowingModal
          open={showShareModal}
          onClose={() => setShowShareModal(false)}
          title="Share place"
          shareText={`${place.placeName} - ${place.caption}`}
          shareUrl={`${
            typeof window !== "undefined" ? window.location.origin : ""
          }/home?place=${place._id}`}
        />
      </article>

      {toast && <div className="save-toast">{toast}</div>}
    </>
  );
}