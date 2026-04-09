"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/lib/axios";
import { useParams, useRouter, useSearchParams } from "next/navigation";
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
  FiClock,
  FiAlertCircle,
  FiShield,
  FiStar,
} from "react-icons/fi";
import TravelPickPaymentModal from "@/components/home/TravelPickPaymentModal";

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
  createdBy?: { _id?: string; username?: string };
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

const formatCurrency = (value?: number) =>
  `Rs. ${Number(value || 0).toLocaleString()}`;

const getDurationLabel = (startDate?: string, endDate?: string) => {
  if (!startDate || !endDate) return "Trip package";

  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();

  if (Number.isNaN(start) || Number.isNaN(end)) return "Trip package";

  const diffDays =
    Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1);
  const nights = Math.max(0, diffDays - 1);

  return `${diffDays} Day${diffDays > 1 ? "s" : ""}, ${nights} Night${
    nights !== 1 ? "s" : ""
  }`;
};

export default function TravelPickDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const travelPickId =
    typeof params?.id === "string"
      ? params.id
      : Array.isArray(params?.id)
      ? params.id[0]
      : "";

  const [pick, setPick] = useState<TravelPick | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState("");
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    const fetchTravelPick = async () => {
      if (
        !travelPickId ||
        travelPickId === "new" ||
        travelPickId === "undefined" ||
        travelPickId === "null" ||
        travelPickId.length !== 24
      ) {
        console.error("Invalid travelPickId:", travelPickId);
        setPick(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await api.get(`/travel-picks/admin/${travelPickId}`);
        setPick(res.data?.travelPick || null);
      } catch (error: any) {
        console.error(
          "Failed to load travel pick details:",
          error?.response?.data || error
        );
        setPick(null);
      } finally {
        setLoading(false);
      }
    };

    fetchTravelPick();
  }, [travelPickId]);

  useEffect(() => {
    const paymentState = searchParams.get("payment");
    const sessionId = searchParams.get("session_id");

    if (paymentState === "cancelled") {
      setPaymentMessage("Payment was cancelled.");
      return;
    }

    if (paymentState !== "success" || !sessionId || !travelPickId) return;

    const verifyPayment = async () => {
      try {
        setVerifyingPayment(true);
        const res = await api.get(
          `/payments/verify-session?sessionId=${sessionId}`
        );

        setPaymentMessage(
          res.data?.payment
            ? "Payment successful. Your booking was confirmed."
            : "Payment completed, but verification is pending."
        );

        router.replace(`/admin/travel-picks/${travelPickId}`);
      } catch (error: any) {
        setPaymentMessage(
          error?.response?.data?.message || "Payment verification failed."
        );
      } finally {
        setVerifyingPayment(false);
      }
    };

    verifyPayment();
  }, [searchParams, router, travelPickId]);

  const imageSrc = useMemo(() => getImageSrc(pick?.imageUrl), [pick?.imageUrl]);
  const durationLabel = useMemo(
    () => getDurationLabel(pick?.startDate, pick?.endDate),
    [pick?.startDate, pick?.endDate]
  );

  const advancePct = pick?.advancePercentage || 0;
  const tabs = ["Overview", "Includes", "Dates & Policies", "Payment"];

  if (loading) {
    return (
      <section className="tpd-page">
        <div className="tpd-shell">
          <div className="tpd-state">
            <div className="tpd-state__spinner" />
            <p>Loading package details…</p>
          </div>
        </div>
      </section>
    );
  }

  if (!pick) {
    return (
      <section className="tpd-page">
        <div className="tpd-shell">
          <div className="tpd-state">
            <FiAlertCircle />
            <p>Travel pick not found.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="tpd-page">
      <div className="tpd-shell">
        <div className="tpd-topnav">
          <button
            type="button"
            className="tpd-back-btn"
            onClick={() => router.back()}
          >
            <FiArrowLeft /> Back
          </button>

          <nav className="tpd-breadcrumb">
            <span>Travel Picks</span>
            <span className="tpd-breadcrumb__sep">/</span>
            <span className="tpd-breadcrumb__current">{pick.title}</span>
          </nav>
        </div>

        {(paymentMessage || verifyingPayment) && (
          <div
            className={`tpd-banner ${
              paymentMessage.includes("successful")
                ? "tpd-banner--success"
                : "tpd-banner--warn"
            }`}
          >
            {verifyingPayment ? (
              <>
                <div className="tpd-state__spinner tpd-state__spinner--sm" />
                Verifying your payment…
              </>
            ) : (
              <>
                <FiCheckCircle /> {paymentMessage}
              </>
            )}
          </div>
        )}

        <div className="tpd-hero">
          <div className="tpd-hero__image-wrap">
            <img src={imageSrc} alt={pick.title} className="tpd-hero__image" />
            <div className="tpd-hero__image-overlay">
              <span className="tpd-eyebrow">Book Now</span>
              <div className="tpd-hero__chips">
                <span className="tpd-chip tpd-chip--dark">
                  <FiClock /> {durationLabel}
                </span>
                <span
                  className={`tpd-chip ${
                    pick.isBookingOpen
                      ? "tpd-chip--open"
                      : "tpd-chip--closed"
                  }`}
                >
                  {pick.isBookingOpen ? "✓ Booking Open" : "✗ Booking Closed"}
                </span>
              </div>
            </div>
          </div>

          <div className="tpd-hero__content">
            <h1 className="tpd-title">{pick.title}</h1>

            <div className="tpd-meta-row">
              <span className="tpd-meta-item">
                <FiMapPin />
                {pick.place}
              </span>
              <span className="tpd-meta-item">
                <FiCalendar />
                {formatShortDate(pick.startDate)} –{" "}
                {formatShortDate(pick.endDate)}
              </span>
              {pick.createdBy?.username && (
                <span className="tpd-meta-item">
                  <FiStar />
                  by {pick.createdBy.username}
                </span>
              )}
            </div>

            <p className="tpd-caption">{pick.caption}</p>
          </div>

          <aside className="tpd-booking-card">
            <div className="tpd-booking-card__price-row">
              <span className="tpd-booking-card__label">Price / person</span>
              <strong className="tpd-booking-card__price">
                {formatCurrency(pick.price)}
              </strong>
            </div>

            <div className="tpd-progress-wrap">
              <div className="tpd-progress-label">
                <span>Advance required</span>
                <span className="tpd-progress-label__pct">{advancePct}%</span>
              </div>
              <div className="tpd-progress-track">
                <div
                  className="tpd-progress-fill"
                  style={{ width: `${advancePct}%` }}
                />
              </div>
            </div>

            <div className="tpd-booking-rows">
              <div className="tpd-booking-row">
                <span>Total</span>
                <strong>{formatCurrency(pick.price)}</strong>
              </div>
              <div className="tpd-booking-row tpd-booking-row--green">
                <span>Advance now</span>
                <strong>{formatCurrency(pick.advanceAmount)}</strong>
              </div>
              <div className="tpd-booking-row tpd-booking-row--amber">
                <span>Balance later</span>
                <strong>{formatCurrency(pick.remainingAmount)}</strong>
              </div>
              {pick.balanceDueDate && (
                <div className="tpd-booking-row tpd-booking-row--muted">
                  <span>
                    <FiClock /> Balance due
                  </span>
                  <strong>{formatShortDate(pick.balanceDueDate)}</strong>
                </div>
              )}
            </div>

            {pick.advancePolicy && (
              <div className="tpd-policy-chip tpd-policy-chip--green">
                <FiShield /> {pick.advancePolicy}
              </div>
            )}

            <button
              type="button"
              className={`tpd-book-btn ${
                !pick.isBookingOpen ? "tpd-book-btn--disabled" : ""
              }`}
              disabled={!pick.isBookingOpen}
              onClick={() => setPaymentModalOpen(true)}
            >
              {pick.isBookingOpen ? "Book Now" : "Booking Closed"}
            </button>

            {pick.bookingCloseDate && (
              <p className="tpd-booking-card__deadline">
                <FiAlertCircle /> Booking closes{" "}
                {formatShortDate(pick.bookingCloseDate)}
              </p>
            )}
          </aside>
        </div>

        <div className="tpd-stat-strip">
          <div className="tpd-stat-strip__item">
            <span className="tpd-stat-strip__label">Total Price</span>
            <span className="tpd-stat-strip__val">
              {formatCurrency(pick.price)}
            </span>
          </div>
          <div className="tpd-stat-strip__divider" />
          <div className="tpd-stat-strip__item tpd-stat-strip__item--green">
            <span className="tpd-stat-strip__label">Advance ({advancePct}%)</span>
            <span className="tpd-stat-strip__val">
              {formatCurrency(pick.advanceAmount)}
            </span>
          </div>
          <div className="tpd-stat-strip__divider" />
          <div className="tpd-stat-strip__item tpd-stat-strip__item--amber">
            <span className="tpd-stat-strip__label">Balance Remaining</span>
            <span className="tpd-stat-strip__val">
              {formatCurrency(pick.remainingAmount)}
            </span>
          </div>
          <div className="tpd-stat-strip__divider" />
          <div className="tpd-stat-strip__item">
            <span className="tpd-stat-strip__label">Duration</span>
            <span className="tpd-stat-strip__val">{durationLabel}</span>
          </div>
        </div>

        <div className="tpd-tabs">
          {tabs.map((tab, i) => (
            <button
              key={tab}
              type="button"
              className={`tpd-tab ${activeTab === i ? "tpd-tab--active" : ""}`}
              onClick={() => setActiveTab(i)}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="tpd-body">
          {activeTab === 0 && (
            <div className="tpd-grid">
              <div className="tpd-col-main">
                <div className="tpd-card">
                  <h2 className="tpd-card__title">About This Trip</h2>
                  <p className="tpd-card__text">{pick.caption}</p>
                </div>

                {pick.placesToVisit?.length ? (
                  <div className="tpd-card">
                    <h2 className="tpd-card__title">
                      Places You&apos;ll Visit
                    </h2>
                    <div className="tpd-places-grid">
                      {pick.placesToVisit.map((place, index) => (
                        <div className="tpd-place-card" key={`${place}-${index}`}>
                          <div className="tpd-place-card__img">
                            <img src={imageSrc} alt={place} />
                          </div>
                          <div className="tpd-place-card__body">
                            <h3>{place}</h3>
                            <p>Part of this package itinerary.</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="tpd-col-side">
                <div className="tpd-card tpd-card--sticky">
                  <h2 className="tpd-card__title">Quick Info</h2>
                  <div className="tpd-info-list">
                    <div className="tpd-info-row">
                      <span className="tpd-info-icon">
                        <FiMapPin />
                      </span>
                      <div>
                        <strong>Destination</strong>
                        <p>{pick.place}</p>
                      </div>
                    </div>
                    <div className="tpd-info-row">
                      <span className="tpd-info-icon">
                        <FiCalendar />
                      </span>
                      <div>
                        <strong>Duration</strong>
                        <p>{durationLabel}</p>
                      </div>
                    </div>
                    <div className="tpd-info-row">
                      <span className="tpd-info-icon">
                        <FiCalendar />
                      </span>
                      <div>
                        <strong>Travel Dates</strong>
                        <p>
                          {formatDate(pick.startDate)} –{" "}
                          {formatDate(pick.endDate)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 1 && (
            <div className="tpd-includes-grid">
              {[
                { icon: <FiHome />, label: "Accommodation", value: pick.accommodation },
                { icon: <FiCoffee />, label: "Meals", value: pick.meals },
                { icon: <FiTruck />, label: "Transportation", value: pick.transportation },
                { icon: <FiUsers />, label: "Tour Guide", value: pick.tourGuide },
                { icon: <FiCalendar />, label: "Trip Duration", value: durationLabel },
              ].map((item) =>
                item.value ? (
                  <div className="tpd-include-card" key={item.label}>
                    <span className="tpd-include-card__icon">{item.icon}</span>
                    <h3>{item.label}</h3>
                    <p>{item.value}</p>
                  </div>
                ) : null
              )}
            </div>
          )}

          {activeTab === 2 && (
            <div className="tpd-grid">
              <div className="tpd-col-main">
                <div className="tpd-card">
                  <h2 className="tpd-card__title">Trip Dates</h2>
                  <div className="tpd-dates-timeline">
                    <div className="tpd-date-node tpd-date-node--start">
                      <span className="tpd-date-node__dot" />
                      <div>
                        <strong>Trip Starts</strong>
                        <p>{formatDate(pick.startDate)}</p>
                      </div>
                    </div>
                    <div className="tpd-date-node__line" />
                    <div className="tpd-date-node tpd-date-node--end">
                      <span className="tpd-date-node__dot" />
                      <div>
                        <strong>Trip Ends</strong>
                        <p>{formatDate(pick.endDate)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="tpd-card">
                  <h2 className="tpd-card__title">Important Deadlines</h2>
                  <div className="tpd-deadline-list">
                    {pick.bookingCloseDate && (
                      <div className="tpd-deadline-row tpd-deadline-row--red">
                        <FiAlertCircle />
                        <div>
                          <strong>Booking Closes</strong>
                          <p>{formatDate(pick.bookingCloseDate)}</p>
                        </div>
                      </div>
                    )}
                    {pick.balanceDueDate && (
                      <div className="tpd-deadline-row tpd-deadline-row--amber">
                        <FiClock />
                        <div>
                          <strong>Balance Due Date</strong>
                          <p>{formatDate(pick.balanceDueDate)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="tpd-col-side">
                {pick.cancellationPolicy && (
                  <div className="tpd-policy-card tpd-policy-card--red">
                    <h3>
                      <FiAlertCircle /> Cancellation Policy
                    </h3>
                    <p>{pick.cancellationPolicy}</p>
                  </div>
                )}
                {pick.refundPolicy && (
                  <div className="tpd-policy-card tpd-policy-card--amber">
                    <h3>
                      <FiShield /> Refund Policy
                    </h3>
                    <p>{pick.refundPolicy}</p>
                  </div>
                )}
                {pick.advancePolicy && (
                  <div className="tpd-policy-card tpd-policy-card--green">
                    <h3>
                      <FiCheckCircle /> Advance Payment Policy
                    </h3>
                    <p>{pick.advancePolicy}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 3 && (
            <div className="tpd-grid">
              <div className="tpd-col-main">
                <div className="tpd-card">
                  <h2 className="tpd-card__title">Payment Breakdown</h2>

                  <div className="tpd-payment-breakdown">
                    <div className="tpd-payment-breakdown__bar">
                      <div
                        className="tpd-payment-breakdown__fill"
                        style={{ width: `${advancePct}%` }}
                      />
                    </div>
                    <div className="tpd-payment-breakdown__legend">
                      <span className="tpd-legend-dot tpd-legend-dot--green" />
                      <span>Advance ({advancePct}%) — Pay now to confirm</span>
                      <span className="tpd-legend-dot tpd-legend-dot--amber" />
                      <span>Balance ({100 - advancePct}%) — Pay later</span>
                    </div>
                  </div>

                  <div className="tpd-payment-table">
                    <div className="tpd-payment-row">
                      <span>Package Price</span>
                      <strong>{formatCurrency(pick.price)}</strong>
                    </div>
                    <div className="tpd-payment-row tpd-payment-row--green">
                      <span>Advance Amount ({advancePct}%)</span>
                      <strong>{formatCurrency(pick.advanceAmount)}</strong>
                    </div>
                    <div className="tpd-payment-row tpd-payment-row--amber">
                      <span>Remaining Balance</span>
                      <strong>{formatCurrency(pick.remainingAmount)}</strong>
                    </div>
                    {pick.balanceDueDate && (
                      <div className="tpd-payment-row tpd-payment-row--muted">
                        <span>Balance Due By</span>
                        <strong>{formatDate(pick.balanceDueDate)}</strong>
                      </div>
                    )}
                  </div>
                </div>

                {(pick.paymentInfo || pick.moreDetails) && (
                  <div className="tpd-card">
                    <h2 className="tpd-card__title">Payment Info</h2>
                    {pick.paymentInfo && (
                      <div className="tpd-info-row">
                        <span className="tpd-info-icon">
                          <FiCreditCard />
                        </span>
                        <div>
                          <strong>Payment Information</strong>
                          <p>{pick.paymentInfo}</p>
                        </div>
                      </div>
                    )}
                    {pick.moreDetails && (
                      <div className="tpd-info-row" style={{ marginTop: "12px" }}>
                        <span className="tpd-info-icon">
                          <FiFileText />
                        </span>
                        <div>
                          <strong>More Details</strong>
                          <p>{pick.moreDetails}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="tpd-col-side">
                <div className="tpd-cta-card">
                  <p className="tpd-cta-card__subtitle">Ready to book?</p>
                  <strong className="tpd-cta-card__price">
                    {formatCurrency(pick.price)}
                  </strong>
                  <p className="tpd-cta-card__note">
                    Pay only {formatCurrency(pick.advanceAmount)} now to confirm
                    your spot.
                  </p>
                  <button
                    type="button"
                    className={`tpd-book-btn ${
                      !pick.isBookingOpen ? "tpd-book-btn--disabled" : ""
                    }`}
                    disabled={!pick.isBookingOpen}
                    onClick={() => setPaymentModalOpen(true)}
                  >
                    {pick.isBookingOpen ? "Book Now" : "Booking Closed"}
                  </button>
                  {pick.bookingCloseDate && (
                    <p className="tpd-cta-card__deadline">
                      <FiAlertCircle /> Closes{" "}
                      {formatShortDate(pick.bookingCloseDate)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <TravelPickPaymentModal
        open={paymentModalOpen}
        pick={pick}
        onClose={() => setPaymentModalOpen(false)}
      />
    </section>
  );
}