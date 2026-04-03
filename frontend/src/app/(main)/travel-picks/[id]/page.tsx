"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/lib/axios";
import { useParams, useRouter } from "next/navigation";
import {
  FiArrowLeft,
  FiCalendar,
  FiCheckCircle,
  FiMapPin,
  FiTruck,
  FiUsers,
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

const getDurationLabel = (startDate?: string, endDate?: string) => {
  if (!startDate || !endDate) return "Trip package";

  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();

  if (Number.isNaN(start) || Number.isNaN(end)) return "Trip package";

  const diffDays = Math.max(
    1,
    Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1
  );
  const nights = Math.max(0, diffDays - 1);

  return `${diffDays} Day${diffDays > 1 ? "s" : ""}, ${nights} Night${
    nights !== 1 ? "s" : ""
  }`;
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
  const durationLabel = useMemo(
    () => getDurationLabel(pick?.startDate, pick?.endDate),
    [pick?.startDate, pick?.endDate]
  );

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

        <div className="travel-pick-detail-hero-card">
          <div className="travel-pick-detail-hero-card__image">
            <img src={imageSrc} alt={pick.title} />
          </div>

          <div className="travel-pick-detail-hero-card__content">
            <div className="travel-pick-detail-head">
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

                {pick.createdBy?.username && <span>by {pick.createdBy.username}</span>}
              </div>
            </div>

            <div className="travel-pick-detail-summary-row">
              <span className="travel-pick-detail-chip">{durationLabel}</span>
              <span className="travel-pick-detail-chip">
                {formatCurrency(pick.price)}
              </span>
            </div>

            <p className="travel-pick-detail-caption">{pick.caption}</p>

            <div className="travel-pick-detail-mini-grid">
              <div className="travel-pick-detail-mini-card">
                <span>Total Price</span>
                <strong>{formatCurrency(pick.price)}</strong>
              </div>

              <div className="travel-pick-detail-mini-card">
                <span>Advance ({pick.advancePercentage || 0}%)</span>
                <strong>{formatCurrency(pick.advanceAmount)}</strong>
              </div>

              <div className="travel-pick-detail-mini-card">
                <span>Remaining</span>
                <strong>{formatCurrency(pick.remainingAmount)}</strong>
              </div>
            </div>
          </div>

          <aside className="travel-pick-booking-card">
            <div className="travel-pick-booking-card__top">
              <p className="travel-pick-booking-card__label">Book Now / person</p>
              <h2>{formatCurrency(pick.price)}</h2>
            </div>

            <div className="travel-pick-booking-card__section">
              <div className="travel-pick-booking-row">
                <span>Total Price</span>
                <strong>{formatCurrency(pick.price)}</strong>
              </div>

              <div className="travel-pick-booking-row">
                <span>Advance ({pick.advancePercentage || 0}%)</span>
                <strong>{formatCurrency(pick.advanceAmount)}</strong>
              </div>

              <div className="travel-pick-booking-row">
                <span>Balance</span>
                <strong>{formatCurrency(pick.remainingAmount)}</strong>
              </div>
            </div>

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
          </aside>
        </div>

        <div className="travel-pick-detail-tabs">
          <span className="active">Overview</span>
          <span>What&apos;s Included</span>
          <span>Trip Details</span>
          <span>Payment Details</span>
          <span>Important Notes</span>
        </div>

        <div className="travel-pick-detail-main">
          <div className="travel-pick-detail-left">
            <div className="travel-pick-detail-card">
              <div className="travel-pick-detail-card__head">
                <h2>About This Trip</h2>
              </div>

              <p className="travel-pick-detail-caption">{pick.caption}</p>
            </div>

            {pick.placesToVisit?.length ? (
              <div className="travel-pick-detail-card">
                <div className="travel-pick-detail-card__head">
                  <h2>Places You’ll Visit</h2>
                </div>

                <div className="travel-pick-places-grid">
                  {pick.placesToVisit.map((place, index) => (
                    <div className="travel-pick-place-card" key={`${place}-${index}`}>
                      <div className="travel-pick-place-card__thumb">
                        <img src={imageSrc} alt={place} />
                      </div>
                      <div className="travel-pick-place-card__content">
                        <h3>{place}</h3>
                        <p>Part of this package itinerary.</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {(pick.paymentInfo || pick.moreDetails) && (
              <div className="travel-pick-detail-card">
                <div className="travel-pick-detail-card__head">
                  <h2>Extra Details</h2>
                </div>

                <div className="travel-pick-detail-list">
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
            )}
          </div>

          <div className="travel-pick-detail-right">
            <div className="travel-pick-detail-card">
              <div className="travel-pick-detail-card__head">
                <h2>What’s Included</h2>
              </div>

              <div className="travel-pick-detail-list">
                <div className="travel-pick-detail-item">
                  <span className="travel-pick-detail-item__icon">
                    <FiCalendar />
                  </span>
                  <div>
                    <h3>Trip duration</h3>
                    <p>{durationLabel}</p>
                  </div>
                </div>

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
              </div>
            </div>

            <div className="travel-pick-detail-card">
              <div className="travel-pick-detail-card__head">
                <h2>Trip Details</h2>
              </div>

              <div className="travel-pick-detail-list">
                <div className="travel-pick-detail-item">
                  <span className="travel-pick-detail-item__icon">
                    <FiMapPin />
                  </span>
                  <div>
                    <h3>Destination</h3>
                    <p>{pick.place}</p>
                  </div>
                </div>

                <div className="travel-pick-detail-item">
                  <span className="travel-pick-detail-item__icon">
                    <FiCalendar />
                  </span>
                  <div>
                    <h3>Travel dates</h3>
                    <p>
                      {formatDate(pick.startDate)} - {formatDate(pick.endDate)}
                    </p>
                  </div>
                </div>

                {pick.bookingCloseDate && (
                  <div className="travel-pick-detail-item">
                    <span className="travel-pick-detail-item__icon">
                      <FiCheckCircle />
                    </span>
                    <div>
                      <h3>Booking closes</h3>
                      <p>{formatDate(pick.bookingCloseDate)}</p>
                    </div>
                  </div>
                )}

                {pick.balanceDueDate && (
                  <div className="travel-pick-detail-item">
                    <span className="travel-pick-detail-item__icon">
                      <FiCheckCircle />
                    </span>
                    <div>
                      <h3>Balance due date</h3>
                      <p>{formatDate(pick.balanceDueDate)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}