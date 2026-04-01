"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/lib/axios";
import { useParams, useRouter } from "next/navigation";
import {
  FiArrowLeft,
  FiBookmark,
  FiCalendar,
  FiCheckCircle,
  FiMapPin,
  FiTruck,
  FiUsers,
  FiXCircle,
  FiCreditCard,
  FiHome,
  FiCoffee,
  FiFileText,
} from "react-icons/fi";

type TravelPick = {
  _id: string;
  title: string;
  place: string;
  imageUrl: string;
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
  price: number;
  advanceAmount?: number;
  remainingAmount?: number;
  bookingCloseDate?: string;
  balanceDueDate?: string;
  isBookingOpen?: boolean;
  createdBy?: {
    _id?: string;
    username?: string;
  };
};

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

const getImageSrc = (imageUrl?: string) => {
  if (!imageUrl) return "/images/ella.jpg";
  if (imageUrl.startsWith("http")) return imageUrl;
  return `${BACKEND_URL}${imageUrl}`;
};

const formatDate = (dateString?: string) => {
  if (!dateString) return "-";

  return new Date(dateString).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const formatShortDate = (dateString?: string) => {
  if (!dateString) return "-";

  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatCurrency = (value?: number) => {
  return `Rs. ${Number(value || 0).toLocaleString()}`;
};

export default function TravelPickDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const travelPickId = params?.id;

  const [pick, setPick] = useState<TravelPick | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTravelPick = async () => {
      if (!travelPickId) return;

      try {
        setLoading(true);
        const res = await api.get(`/travel-picks/${travelPickId}`);
        setPick(res.data?.travelPick || null);
      } catch (error) {
        console.error("Failed to load travel pick details:", error);
        setPick(null);
      } finally {
        setLoading(false);
      }
    };

    fetchTravelPick();
  }, [travelPickId]);

  const imageSrc = useMemo(() => getImageSrc(pick?.imageUrl), [pick?.imageUrl]);

  if (loading) {
    return (
      <section className="travel-pick-detail-page">
        <div className="travel-pick-detail-shell">
          <div className="travel-pick-detail-state">
            Loading package details...
          </div>
        </div>
      </section>
    );
  }

  if (!pick) {
    return (
      <section className="travel-pick-detail-page">
        <div className="travel-pick-detail-shell">
          <div className="travel-pick-detail-state">
            Travel pick not found.
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="travel-pick-detail-page">
      <div className="travel-pick-detail-shell">
        {/* TOP BAR */}
        <div className="travel-pick-detail-topbar">
          <button
            type="button"
            className="travel-pick-detail-back-btn"
            onClick={() => router.back()}
          >
            <FiArrowLeft />
            Back
          </button>

          <div className="travel-pick-detail-breadcrumb">
            <span>Travel Picks</span>
            <span>/</span>
            <span>{pick.title}</span>
          </div>
        </div>

        {/* HEADER */}
        <div className="travel-pick-detail-head">
          <div>
            <span className="travel-pick-detail-eyebrow">Book Now</span>
            <h1>{pick.title}</h1>

            <div className="travel-pick-detail-meta">
              <span>
                <FiMapPin />
                {pick.place}
              </span>

              <span>
                <FiCalendar />
                {formatShortDate(pick.startDate)} -{" "}
                {formatShortDate(pick.endDate)}
              </span>

              {/* KEEP "by username" */}
              {pick.createdBy?.username && (
                <span>by {pick.createdBy.username}</span>
              )}
            </div>
          </div>
        </div>

        {/* IMAGE */}
        <div className="travel-pick-detail-hero">
          <img src={imageSrc} alt={pick.title} />
        </div>

        {/* MAIN */}
        <div className="travel-pick-detail-main">
          {/* LEFT SIDE */}
          <div className="travel-pick-detail-left">
            {/* OVERVIEW */}
            <div className="travel-pick-detail-card">
              <div className="travel-pick-detail-card__head">
                <h2>Package overview</h2>
              </div>

              <p className="travel-pick-detail-caption">{pick.caption}</p>
            </div>

            {/* DETAILS */}
            <div className="travel-pick-detail-card">
              <div className="travel-pick-detail-card__head">
                <h2>Trip details</h2>
              </div>

              <div className="travel-pick-detail-list">
                {/* Places */}
                {pick.placesToVisit?.length > 0 && (
                  <div className="travel-pick-detail-item">
                    <span className="travel-pick-detail-item__icon">
                      <FiMapPin />
                    </span>
                    <div>
                      <h3>Places to visit</h3>
                      <p>{pick.placesToVisit.join(", ")}</p>
                    </div>
                  </div>
                )}

                {/* Date */}
                <div className="travel-pick-detail-item">
                  <span className="travel-pick-detail-item__icon">
                    <FiCalendar />
                  </span>
                  <div>
                    <h3>Date</h3>
                    <p>
                      {formatDate(pick.startDate)} -{" "}
                      {formatDate(pick.endDate)}
                    </p>
                  </div>
                </div>

                {/* Accommodation */}
                {pick.accommodation && (
                  <div className="travel-pick-detail-item">
                    <span className="travel-pick-detail-item__icon">
                      <FiHome />
                    </span>
                    <div>
                      <h3>Accommodation</h3>
                      <p>{pick.accommodation}</p>
                    </div>
                  </div>
                )}

                {/* Meals */}
                {pick.meals && (
                  <div className="travel-pick-detail-item">
                    <span className="travel-pick-detail-item__icon">
                      <FiCoffee />
                    </span>
                    <div>
                      <h3>Meals</h3>
                      <p>{pick.meals}</p>
                    </div>
                  </div>
                )}

                {/* Transport */}
                {pick.transportation && (
                  <div className="travel-pick-detail-item">
                    <span className="travel-pick-detail-item__icon">
                      <FiTruck />
                    </span>
                    <div>
                      <h3>Transportation</h3>
                      <p>{pick.transportation}</p>
                    </div>
                  </div>
                )}

                {/* Guide */}
                {pick.tourGuide && (
                  <div className="travel-pick-detail-item">
                    <span className="travel-pick-detail-item__icon">
                      <FiUsers />
                    </span>
                    <div>
                      <h3>Tour guide</h3>
                      <p>{pick.tourGuide}</p>
                    </div>
                  </div>
                )}

                {/* Payment */}
                {pick.paymentInfo && (
                  <div className="travel-pick-detail-item">
                    <span className="travel-pick-detail-item__icon">
                      <FiCreditCard />
                    </span>
                    <div>
                      <h3>Payment info</h3>
                      <p>{pick.paymentInfo}</p>
                    </div>
                  </div>
                )}

                {/* More */}
                {pick.moreDetails && (
                  <div className="travel-pick-detail-item">
                    <span className="travel-pick-detail-item__icon">
                      <FiFileText />
                    </span>
                    <div>
                      <h3>More details</h3>
                      <p>{pick.moreDetails}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT SIDE */}
          <aside className="travel-pick-detail-right">
            <div className="travel-pick-booking-card">
              <div className="travel-pick-booking-card__top">
                <p className="travel-pick-booking-card__label">
                  Package price
                </p>
                <h2>{formatCurrency(pick.price)}</h2>
              </div>

              <div className="travel-pick-booking-card__section">
                <div className="travel-pick-booking-row">
                  <span>Advance ({pick.advancePercentage || 0}%)</span>
                  <strong>{formatCurrency(pick.advanceAmount)}</strong>
                </div>

                <div className="travel-pick-booking-row">
                  <span>Remaining</span>
                  <strong>{formatCurrency(pick.remainingAmount)}</strong>
                </div>
              </div>

              {/* POLICIES */}
              {pick.advancePolicy && (
                <div className="travel-pick-policy-box travel-pick-policy-box--good">
                  <p>{pick.advancePolicy}</p>
                </div>
              )}

              {pick.cancellationPolicy && (
                <div className="travel-pick-policy-box travel-pick-policy-box--warn">
                  <p>{pick.cancellationPolicy}</p>
                </div>
              )}

              {pick.refundPolicy && (
                <div className="travel-pick-policy-box travel-pick-policy-box--muted">
                  <p>{pick.refundPolicy}</p>
                </div>
              )}

              <button
                className="travel-pick-detail-book-btn"
                disabled={!pick.isBookingOpen}
              >
                {pick.isBookingOpen ? "Book now" : "Booking closed"}
              </button>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}