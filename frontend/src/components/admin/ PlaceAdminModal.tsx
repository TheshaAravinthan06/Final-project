"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import {
  FiX,
  FiMapPin,
  FiCalendar,
  FiDollarSign,
  FiMoreHorizontal,
  FiTrash2,
  FiEyeOff,
  FiEdit2,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";

type TravelPick = {
  _id: string;
  title: string;
  place: string;
  imageUrl: string;
  price: number;
  startDate: string;
  endDate: string;
  caption: string;
  placesToVisit?: string[];
  accommodation?: string;
  meals?: string;
  transportation?: string;
  tourGuide?: string;
  paymentInfo?: string;
  moreDetails?: string;
  advancePolicy?: string;
  advancePercentage?: number;
  cancellationPolicy?: string;
  refundPolicy?: string;
  isPublished?: boolean;
};

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

const formatDate = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
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
  const router = useRouter();
  const [pick, setPick] = useState<TravelPick | null>(null);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);

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

  const handleDelete = async () => {
    try {
      await api.delete(`/travel-picks/${pickId}`);
      onTravelPickDeleted(pickId);
    } catch (error) {
      console.error("Failed to delete travel pick:", error);
    }
  };

  const handleHide = async () => {
    try {
      const res = await api.patch(`/travel-picks/${pickId}`, {
        isPublished: false,
      });
      const updated = res.data.travelPick || { ...pick, isPublished: false };
      setPick(updated);
      onTravelPickUpdated(updated);
      setShowMenu(false);
    } catch (error) {
      console.error("Failed to hide travel pick:", error);
    }
  };

  const handleEdit = () => {
    router.push(`/admin/travel-picks/edit/${pickId}`);
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

      <div
        className="admin-post-modal admin-post-modal--travel-pick"
        onClick={(e) => e.stopPropagation()}
      >
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
                  className="danger"
                  onClick={handleDelete}
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
          <img src={getImageSrc(pick.imageUrl)} alt={pick.title} />
        </div>

        <div className="admin-post-modal__content">
          <div className="admin-post-modal__header">
            <div>
              <h3>{pick.title}</h3>
              <p>
                <FiMapPin />
                {pick.place}
              </p>
            </div>
          </div>

          <div className="admin-post-modal__caption">
            <p>{pick.caption}</p>
          </div>

          <div className="admin-post-modal__stats">
            <span>
              <FiDollarSign />
              Rs. {pick.price}
            </span>
            <span>
              <FiCalendar />
              {formatDate(pick.startDate)}
              {pick.endDate ? ` - ${formatDate(pick.endDate)}` : ""}
            </span>
            {!pick.isPublished && <span>Hidden</span>}
          </div>

          <div className="admin-travel-pick-details">
            {pick.placesToVisit && pick.placesToVisit.length > 0 && (
              <div className="admin-travel-pick-section">
                <h4>Places to Visit</h4>
                <div className="admin-travel-pick-tags">
                  {pick.placesToVisit.map((placeItem) => (
                    <span key={placeItem}>{placeItem}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="admin-travel-pick-section">
              <h4>Trip Includes</h4>
              <div className="admin-travel-pick-info-grid">
                <div>
                  <strong>Accommodation</strong>
                  <p>{pick.accommodation || "Not added"}</p>
                </div>
                <div>
                  <strong>Meals</strong>
                  <p>{pick.meals || "Not added"}</p>
                </div>
                <div>
                  <strong>Transportation</strong>
                  <p>{pick.transportation || "Not added"}</p>
                </div>
                <div>
                  <strong>Tour Guide</strong>
                  <p>{pick.tourGuide || "Not added"}</p>
                </div>
              </div>
            </div>

            <div className="admin-travel-pick-section">
              <h4>Payment</h4>
              <div className="admin-travel-pick-info-grid">
                <div>
                  <strong>Payment Info</strong>
                  <p>{pick.paymentInfo || "Not added"}</p>
                </div>
                <div>
                  <strong>Advance Policy</strong>
                  <p>{pick.advancePolicy || "Not added"}</p>
                </div>
                <div>
                  <strong>Advance Percentage</strong>
                  <p>
                    {pick.advancePercentage !== undefined &&
                    pick.advancePercentage !== null
                      ? `${pick.advancePercentage}%`
                      : "Not added"}
                  </p>
                </div>
                <div>
                  <strong>Refund Policy</strong>
                  <p>{pick.refundPolicy || "Not added"}</p>
                </div>
              </div>
            </div>

            <div className="admin-travel-pick-section">
              <h4>More Details</h4>
              <p>{pick.moreDetails || "No extra details added yet."}</p>
            </div>

            <div className="admin-travel-pick-section">
              <h4>Cancellation Policy</h4>
              <p>{pick.cancellationPolicy || "Not added"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}