"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import {
  FiChevronLeft,
  FiChevronRight,
  FiCopy,
  FiEdit2,
  FiEye,
  FiEyeOff,
  FiMapPin,
  FiMoreHorizontal,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import EditTravelPickModal, {
  EditableTravelPick,
} from "@/components/admin/EditTravelPickModal";

type TravelPick = EditableTravelPick;

type Props = {
  pickId: string;
  onClose: () => void;
  onTravelPickUpdated: (updatedPick: TravelPick) => void;
  onTravelPickDeleted: (pickId: string) => void;
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

const formatDate = (dateString?: string) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

export default function TravelPickModal({
  pickId,
  onClose,
  onTravelPickUpdated,
  onTravelPickDeleted,
  onPrev,
  onNext,
}: Props) {
  const [pick, setPick] = useState<TravelPick | null>(null);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    const fetchPick = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/travel-picks/admin/${pickId}`);
        setPick(res.data.travelPick);
      } catch (error) {
        console.error("Failed to load travel pick:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPick();
  }, [pickId]);

  const syncPick = (updatedPick: TravelPick) => {
    setPick(updatedPick);
    onTravelPickUpdated(updatedPick);
  };

  const handleToggleVisibility = async () => {
    try {
      const res = await api.patch(`/admin/travel-picks/${pickId}/visibility`);
      const updatedPick = res.data.travelPick || {
        ...pick!,
        isPublished: !pick?.isPublished,
      };
      syncPick(updatedPick);
      setShowMenu(false);
    } catch (error) {
      console.error("Toggle visibility failed:", error);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/admin/travel-picks?open=${pickId}`
      );
      setShowMenu(false);
    } catch (error) {
      console.error("Copy link failed:", error);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/travel-picks/${pickId}`);
      onTravelPickDeleted(pickId);
      onClose();
    } catch (error) {
      console.error("Delete travel pick failed:", error);
    }
  };

  const handleEditOpen = () => {
    setShowMenu(false);
    setShowEditModal(true);
  };

  const handlePickEdited = (updatedTravelPick: EditableTravelPick) => {
    syncPick(updatedTravelPick);
  };

  if (loading || !pick) {
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

                  <button type="button" onClick={handleToggleVisibility}>
                    {pick.isPublished ? <FiEyeOff /> : <FiEye />}
                    {pick.isPublished ? "Hide from users" : "Unhide from users"}
                  </button>

                  <button type="button" onClick={handleDelete} className="danger">
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
            <img src={getImageSrc(pick.imageUrl)} alt={pick.title} />
          </div>

          <div className="admin-post-modal__content admin-post-modal__content--places">
            <div className="admin-post-modal__header">
              <div>
                <h3>{pick.title}</h3>
                <p>
                  <FiMapPin />
                  {pick.place}
                </p>
              </div>
            </div>

            <div className="admin-post-modal__caption admin-post-modal__caption--plain">
              <p>{pick.caption}</p>
            </div>

            <div className="admin-post-modal__stats admin-post-modal__stats--clean">
              <span>Price: Rs. {Number(pick.price || 0).toLocaleString()}</span>
              {!pick.isPublished && (
                <span className="admin-post-hidden-badge">Hidden</span>
              )}
            </div>

            <div className="admin-post-comments admin-post-comments--plain">
              <div className="admin-comment-block">
                <div className="admin-comment-block__main">
                  <div>
                    <strong>Travel Dates</strong>
                    <p>
                      {formatDate(pick.startDate)} - {formatDate(pick.endDate)}
                    </p>
                  </div>
                </div>
              </div>

              {!!pick.placesToVisit?.length && (
                <div className="admin-comment-block">
                  <div className="admin-comment-block__main">
                    <div>
                      <strong>Places to Visit</strong>
                      <p>{pick.placesToVisit.join(", ")}</p>
                    </div>
                  </div>
                </div>
              )}

              {pick.accommodation && (
                <div className="admin-comment-block">
                  <div className="admin-comment-block__main">
                    <div>
                      <strong>Accommodation</strong>
                      <p>{pick.accommodation}</p>
                    </div>
                  </div>
                </div>
              )}

              {pick.meals && (
                <div className="admin-comment-block">
                  <div className="admin-comment-block__main">
                    <div>
                      <strong>Meals</strong>
                      <p>{pick.meals}</p>
                    </div>
                  </div>
                </div>
              )}

              {pick.transportation && (
                <div className="admin-comment-block">
                  <div className="admin-comment-block__main">
                    <div>
                      <strong>Transportation</strong>
                      <p>{pick.transportation}</p>
                    </div>
                  </div>
                </div>
              )}

              {pick.tourGuide && (
                <div className="admin-comment-block">
                  <div className="admin-comment-block__main">
                    <div>
                      <strong>Tour Guide</strong>
                      <p>{pick.tourGuide}</p>
                    </div>
                  </div>
                </div>
              )}

              {pick.paymentInfo && (
                <div className="admin-comment-block">
                  <div className="admin-comment-block__main">
                    <div>
                      <strong>Payment Info</strong>
                      <p>{pick.paymentInfo}</p>
                    </div>
                  </div>
                </div>
              )}

              {pick.moreDetails && (
                <div className="admin-comment-block">
                  <div className="admin-comment-block__main">
                    <div>
                      <strong>More Details</strong>
                      <p>{pick.moreDetails}</p>
                    </div>
                  </div>
                </div>
              )}

              {pick.advancePolicy && (
                <div className="admin-comment-block">
                  <div className="admin-comment-block__main">
                    <div>
                      <strong>Advance Policy</strong>
                      <p>{pick.advancePolicy}</p>
                    </div>
                  </div>
                </div>
              )}

              {pick.cancellationPolicy && (
                <div className="admin-comment-block">
                  <div className="admin-comment-block__main">
                    <div>
                      <strong>Cancellation Policy</strong>
                      <p>{pick.cancellationPolicy}</p>
                    </div>
                  </div>
                </div>
              )}

              {pick.refundPolicy && (
                <div className="admin-comment-block">
                  <div className="admin-comment-block__main">
                    <div>
                      <strong>Refund Policy</strong>
                      <p>{pick.refundPolicy}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="admin-post-date">{formatPostDate(pick.createdAt || "")}</div>
          </div>
        </div>
      </div>

      {showEditModal && (
        <EditTravelPickModal
          travelPick={pick}
          onClose={() => setShowEditModal(false)}
          onTravelPickUpdated={handlePickEdited}
        />
      )}
    </>
  );
}