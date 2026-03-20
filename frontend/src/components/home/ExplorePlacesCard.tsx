"use client";

import { useMemo, useState } from "react";
import {
  FiHeart,
  FiMessageCircle,
  FiBookmark,
  FiMapPin,
  FiSend,
} from "react-icons/fi";
import api from "@/lib/axios";

type PlaceComment = {
  _id: string;
  text: string;
  createdAt: string;
  user: {
    _id: string;
    username: string;
  } | null;
};

type Place = {
  _id: string;
  placeName: string;
  location: string;
  imageUrl: string;
  caption: string;
  moodTags: string[];
  activities: string[];
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

const getPlaceImageSrc = (imageUrl?: string) => {
  if (!imageUrl) return "/images/ella.jpg";
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }
  if (imageUrl.startsWith("/")) {
    return `http://localhost:5000${imageUrl}`;
  }
  return `http://localhost:5000/${imageUrl}`;
};

export default function ExplorePlacesCard({
  place,
  onPlaceUpdated,
}: Props) {
  const [commentText, setCommentText] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  const imageSrc = useMemo(() => getPlaceImageSrc(place.imageUrl), [place.imageUrl]);

  const handleLike = async () => {
    try {
      const res = await api.post(`/places/${place._id}/like`);
      onPlaceUpdated(res.data.place);
    } catch (error) {
      console.error("Like failed:", error);
    }
  };

  const handleSave = async () => {
    try {
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

      const shareUrl = `${window.location.origin}/home?place=${place._id}`;

      if (navigator.share) {
        await navigator.share({
          title: place.placeName,
          text: place.caption,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
      }
    } catch (error) {
      console.error("Share failed:", error);
    }
  };

  const handleCommentSubmit = async () => {
    if (!commentText.trim()) return;

    try {
      setSubmittingComment(true);
      const res = await api.post(`/places/${place._id}/comments`, {
        text: commentText,
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
    <article className="feed-card place-card">
      <div className="feed-card__header">
        <div className="feed-card__user">
          <div className="place-avatar">{place.placeName?.charAt(0) || "P"}</div>
          <div>
            <h4>{place.placeName}</h4>
            <p>by {place.createdBy?.username || "admin"} · Explore Places</p>
          </div>
        </div>

        <button type="button" className="place-tag-btn">
          Admin Post
        </button>
      </div>

      <div className="feed-card__image">
        <img
          src={imageSrc}
          alt={place.placeName}
          onError={(e) => {
            e.currentTarget.src = "/images/ella.jpg";
          }}
        />
      </div>

      <div className="feed-card__actions">
        <div className="feed-card__actions-left">
          <button
            type="button"
            className={`icon-btn ${place.isLiked ? "icon-btn--active" : ""}`}
            onClick={handleLike}
          >
            <FiHeart />
          </button>

          <button
            type="button"
            className="icon-btn"
            onClick={() => setShowComments((prev) => !prev)}
          >
            <FiMessageCircle />
          </button>

          <button type="button" className="icon-btn" onClick={handleShare}>
            <FiSend />
          </button>
        </div>

        <button
          type="button"
          className={`icon-btn ${place.isSaved ? "icon-btn--active" : ""}`}
          onClick={handleSave}
        >
          <FiBookmark />
        </button>
      </div>

      <div className="feed-card__body">
        <div className="feed-stats">
          <span>{place.likesCount || 0} likes</span>
          <span>{place.commentsCount || 0} comments</span>
          <span>{place.savesCount || 0} saves</span>
          <span>{place.shareCount || 0} shares</span>
        </div>

        <div className="place-meta-line">
          <FiMapPin />
          <span>{place.location}</span>
        </div>

        <p className="place-caption">{place.caption}</p>

        {place.moodTags?.length > 0 && (
          <div className="place-tags">
            {place.moodTags.map((tag, index) => (
              <span key={`${tag}-${index}`}>#{tag}</span>
            ))}
          </div>
        )}

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

        <div className="comment-box">
          <input
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
    </article>
  );
}