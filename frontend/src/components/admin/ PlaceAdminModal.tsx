"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/lib/axios";
import {
  FiBookmark,
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
  FiTrash2,
  FiX,
} from "react-icons/fi";
import EditPlaceModal, { EditablePlace } from "@/components/admin/EditPlaceModal";

type PlaceComment = {
  _id: string;
  text: string;
  createdAt: string;
  replyTo?: string | null;
  isAdminReply?: boolean;
  user: {
    _id: string;
    username: string;
  } | null;
};

type Place = EditablePlace & {
  comments: PlaceComment[];
};

type Props = {
  placeId: string;
  onClose: () => void;
  onPlaceUpdated: (updatedPlace: Place) => void;
  onPlaceDeleted: (placeId: string) => void;
  onPrev?: () => void;
  onNext?: () => void;
};

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

const getImageSrc = (imageUrl?: string) => {
  if (!imageUrl) return "/images/ella.jpg";
  if (imageUrl.startsWith("http")) return imageUrl;
  return `${BACKEND_URL}${imageUrl}`;
};

const formatPostDate = (dateString: string) => {
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

export default function PlaceAdminModal({
  placeId,
  onClose,
  onPlaceUpdated,
  onPlaceDeleted,
  onPrev,
  onNext,
}: Props) {
  const [place, setPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlace = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/places/admin/${placeId}`);
        setPlace(res.data.place);
      } catch (error) {
        console.error("Failed to load place:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlace();
  }, [placeId]);

  const rootComments = useMemo(() => {
    return (place?.comments || []).filter((comment) => !comment.replyTo);
  }, [place]);

  const childReplies = (commentId: string) =>
    (place?.comments || []).filter((comment) => comment.replyTo === commentId);

  const syncPlace = (updatedPlace: Place) => {
    setPlace(updatedPlace);
    onPlaceUpdated(updatedPlace);
  };

  const handleReply = async () => {
    if (!replyText.trim() || !replyTo) return;

    try {
      const res = await api.post(`/places/${placeId}/comments`, {
        text: replyText,
        replyTo,
      });

      syncPlace(res.data.place);
      setReplyText("");
      setReplyTo(null);
    } catch (error) {
      console.error("Reply failed:", error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const res = await api.delete(`/places/${placeId}/comments/${commentId}`);
      syncPlace(res.data.place);
    } catch (error) {
      console.error("Delete comment failed:", error);
    }
  };

  const handleTogglePlaceVisibility = async () => {
    try {
      const res = await api.patch(`/admin/places/${placeId}/visibility`);
      const updatedPlace = res.data.place || {
        ...place!,
        isPublished: !place?.isPublished,
      };
      syncPlace(updatedPlace);
      setShowMenu(false);
    } catch (error) {
      console.error("Toggle visibility failed:", error);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/admin/places?open=${placeId}`
      );
      setShowMenu(false);
    } catch (error) {
      console.error("Copy link failed:", error);
    }
  };

  const handleDeletePlace = async () => {
    try {
      await api.delete(`/places/${placeId}`);
      onPlaceDeleted(placeId);
      onClose();
    } catch (error) {
      console.error("Delete place failed:", error);
    }
  };

  const handleEditOpen = () => {
    setShowMenu(false);
    setShowEditModal(true);
  };

  const handlePlaceEdited = (updatedPlace: EditablePlace) => {
    const mergedPlace = {
      ...place!,
      ...updatedPlace,
    };
    syncPlace(mergedPlace);
  };

  if (loading || !place) {
    return (
      <div className="admin-post-modal-backdrop" onClick={onClose}>
        <div
          className="admin-post-modal admin-post-modal--loading"
          onClick={(e) => e.stopPropagation()}
        >
          Loading...
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="admin-post-modal-backdrop" onClick={onClose}>
        {onPrev && (
          <button
            type="button"
            className="admin-modal-arrow admin-modal-arrow--left"
            onClick={(e) => {
              e.stopPropagation();
              onPrev();
            }}
          >
            <FiChevronLeft />
          </button>
        )}

        {onNext && (
          <button
            type="button"
            className="admin-modal-arrow admin-modal-arrow--right"
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
          >
            <FiChevronRight />
          </button>
        )}

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
                  <button type="button" onClick={handleEditOpen}>
                    <FiEdit2 />
                    Edit
                  </button>

                  <button type="button" onClick={handleCopyLink}>
                    <FiCopy />
                    Copy link
                  </button>

                  <button type="button" onClick={handleTogglePlaceVisibility}>
                    {place.isPublished ? <FiEyeOff /> : <FiEye />}
                    {place.isPublished ? "Hide from users" : "Unhide from users"}
                  </button>

                  <button
                    type="button"
                    onClick={handleDeletePlace}
                    className="danger"
                  >
                    <FiTrash2 />
                    Delete
                  </button>

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
            <img src={getImageSrc(place.imageUrl)} alt={place.placeName} />
          </div>

          <div className="admin-post-modal__content">
            <div className="admin-post-modal__header">
              <div>
                <h3>{place.placeName}</h3>
                <p>
                  <FiMapPin />
                  {place.location}
                </p>
              </div>
            </div>

            <div className="admin-post-modal__caption">
              <p>{place.caption}</p>

              <div className="admin-post-modal__tags">
                {place.moodTags?.map((tag) => (
                  <span key={tag}>#{tag}</span>
                ))}
              </div>
            </div>

            <div className="admin-post-modal__stats">
              <span>
                <FiHeart />
                {place.likesCount || 0}
              </span>

              <span>
                <FiMessageCircle />
                {place.commentsCount || 0}
              </span>

              <span>
                <FiBookmark />
                {place.savesCount || 0}
              </span>

              {!place.isPublished && <span>Hidden</span>}
            </div>

            <div className="admin-post-date">{formatPostDate(place.createdAt || "")}</div>

            <div className="admin-post-comments">
              {rootComments.map((comment) => (
                <div key={comment._id} className="admin-comment-block">
                  <div className="admin-comment-block__main">
                    <div>
                      <strong>{comment.user?.username || "user"}</strong>
                      <p>{comment.text}</p>
                    </div>

                    <div className="admin-comment-block__actions">
                      <button
                        type="button"
                        onClick={() => setReplyTo(comment._id)}
                      >
                        Reply
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteComment(comment._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {childReplies(comment._id).map((reply) => (
                    <div key={reply._id} className="admin-comment-reply">
                      <strong>{reply.user?.username || "admin"}</strong>
                      <p>{reply.text}</p>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {replyTo && (
              <div className="admin-post-reply-box">
                <input
                  type="text"
                  placeholder="Write a reply..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                />

                <button type="button" onClick={handleReply}>
                  Reply
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showEditModal && (
        <EditPlaceModal
          place={place}
          onClose={() => setShowEditModal(false)}
          onPlaceUpdated={handlePlaceEdited}
        />
      )}
    </>
  );
}