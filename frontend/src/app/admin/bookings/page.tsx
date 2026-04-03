"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/lib/axios";
import {
  FiCalendar,
  FiCreditCard,
  FiSearch,
  FiUser,
  FiMapPin,
} from "react-icons/fi";

type BookingItem = {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  travelersCount: number;
  totalPrice: number;
  advanceAmount: number;
  remainingAmount: number;
  bookingStatus: "pending" | "confirmed" | "cancelled" | "completed";
  paymentStatus: "unpaid" | "advance_paid" | "paid" | "refunded";
  createdAt: string;
  balanceDueDate?: string;
  travelPick?: {
    _id: string;
    title?: string;
    place?: string;
    imageUrl?: string;
    startDate?: string;
    endDate?: string;
  } | null;
  user?: {
    _id: string;
    username?: string;
    email?: string;
    role?: string;
  } | null;
};

type FilterType = "all" | "pending" | "confirmed" | "paid" | "advance_paid" | "unpaid";

function formatMoney(value?: number) {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatDate(value?: string) {
  if (!value) return "-";

  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getStatusClass(status?: string) {
  switch (status) {
    case "confirmed":
    case "paid":
      return "success";
    case "advance_paid":
      return "warning";
    case "cancelled":
    case "refunded":
      return "danger";
    default:
      return "neutral";
  }
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const res = await api.get("/bookings/admin/all");
        setBookings(res.data?.bookings || []);
      } catch (error) {
        console.error("Failed to load admin bookings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const filteredBookings = useMemo(() => {
    let data = [...bookings];

    if (query.trim()) {
      const search = query.toLowerCase();

      data = data.filter((item) => {
        return (
          item.fullName?.toLowerCase().includes(search) ||
          item.email?.toLowerCase().includes(search) ||
          item.phone?.toLowerCase().includes(search) ||
          item.user?.username?.toLowerCase().includes(search) ||
          item.travelPick?.title?.toLowerCase().includes(search) ||
          item.travelPick?.place?.toLowerCase().includes(search)
        );
      });
    }

    switch (activeFilter) {
      case "pending":
        data = data.filter((item) => item.bookingStatus === "pending");
        break;
      case "confirmed":
        data = data.filter((item) => item.bookingStatus === "confirmed");
        break;
      case "paid":
        data = data.filter((item) => item.paymentStatus === "paid");
        break;
      case "advance_paid":
        data = data.filter((item) => item.paymentStatus === "advance_paid");
        break;
      case "unpaid":
        data = data.filter((item) => item.paymentStatus === "unpaid");
        break;
      default:
        break;
    }

    return data;
  }, [bookings, query, activeFilter]);

  const counts = useMemo(() => {
    return {
      all: bookings.length,
      pending: bookings.filter((item) => item.bookingStatus === "pending").length,
      confirmed: bookings.filter((item) => item.bookingStatus === "confirmed").length,
      paid: bookings.filter((item) => item.paymentStatus === "paid").length,
      advance_paid: bookings.filter((item) => item.paymentStatus === "advance_paid").length,
      unpaid: bookings.filter((item) => item.paymentStatus === "unpaid").length,
    };
  }, [bookings]);

  return (
    <section className="admin-bookings-page">
      <div className="admin-page-head">
        <div>
          <h1>Bookings</h1>
          <p>Manage all travel package bookings, balances, and payment progress.</p>
        </div>

        <div className="admin-page-head__meta">
          <span>{filteredBookings.length} bookings</span>
        </div>
      </div>

      <div className="admin-bookings-toolbar">
        <div className="admin-bookings-search">
          <FiSearch />
          <input
            type="text"
            placeholder="Search by customer, package, place, email..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="admin-bookings-filters">
          {[
            { key: "all", label: `All (${counts.all})` },
            { key: "pending", label: `Pending (${counts.pending})` },
            { key: "confirmed", label: `Confirmed (${counts.confirmed})` },
            { key: "paid", label: `Paid (${counts.paid})` },
            { key: "advance_paid", label: `Advance Paid (${counts.advance_paid})` },
            { key: "unpaid", label: `Unpaid (${counts.unpaid})` },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              className={`admin-bookings-filter-btn ${
                activeFilter === item.key ? "active" : ""
              }`}
              onClick={() => setActiveFilter(item.key as FilterType)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="admin-loading-card">Loading bookings...</div>
      ) : filteredBookings.length === 0 ? (
        <div className="admin-empty-card">No bookings found.</div>
      ) : (
        <div className="admin-bookings-grid">
          {filteredBookings.map((booking) => (
            <article key={booking._id} className="admin-booking-card">
              <div className="admin-booking-card__top">
                <div>
                  <h3>{booking.travelPick?.title || "Travel Package"}</h3>
                  <p>
                    <FiMapPin />
                    {booking.travelPick?.place || "Place not available"}
                  </p>
                </div>

                <div className="admin-booking-badges">
                  <span className={`admin-badge ${getStatusClass(booking.bookingStatus)}`}>
                    {booking.bookingStatus}
                  </span>
                  <span className={`admin-badge ${getStatusClass(booking.paymentStatus)}`}>
                    {booking.paymentStatus}
                  </span>
                </div>
              </div>

              <div className="admin-booking-card__info">
                <div className="admin-booking-info-row">
                  <span><FiUser /> Customer</span>
                  <strong>{booking.fullName}</strong>
                </div>

                <div className="admin-booking-info-row">
                  <span>Email</span>
                  <strong>{booking.email}</strong>
                </div>

                <div className="admin-booking-info-row">
                  <span>Phone</span>
                  <strong>{booking.phone}</strong>
                </div>

                <div className="admin-booking-info-row">
                  <span>Travelers</span>
                  <strong>{booking.travelersCount}</strong>
                </div>

                <div className="admin-booking-info-row">
                  <span><FiCreditCard /> Total</span>
                  <strong>{formatMoney(booking.totalPrice)}</strong>
                </div>

                <div className="admin-booking-info-row">
                  <span>Advance</span>
                  <strong>{formatMoney(booking.advanceAmount)}</strong>
                </div>

                <div className="admin-booking-info-row">
                  <span>Remaining</span>
                  <strong>{formatMoney(booking.remainingAmount)}</strong>
                </div>

                <div className="admin-booking-info-row">
                  <span><FiCalendar /> Trip date</span>
                  <strong>
                    {formatDate(booking.travelPick?.startDate)} - {formatDate(booking.travelPick?.endDate)}
                  </strong>
                </div>

                <div className="admin-booking-info-row">
                  <span>Balance due</span>
                  <strong>{formatDate(booking.balanceDueDate)}</strong>
                </div>

                <div className="admin-booking-info-row">
                  <span>Created</span>
                  <strong>{formatDate(booking.createdAt)}</strong>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}