"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/lib/axios";
import {
  FiCalendar,
  FiCreditCard,
  FiSearch,
  FiUser,
  FiMapPin,
  FiMail,
  FiPhone,
  FiUsers,
  FiChevronDown,
  FiChevronUp,
  FiPackage,
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

const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

function getImageSrc(imageUrl?: string) {
  if (!imageUrl) return null;
  if (imageUrl.startsWith("http")) return imageUrl;
  return `${BACKEND_URL}${imageUrl}`;
}

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

function getBookingStatusMeta(status?: string) {
  switch (status) {
    case "confirmed": return { label: "Confirmed", cls: "booking-status--confirmed" };
    case "completed": return { label: "Completed", cls: "booking-status--completed" };
    case "cancelled": return { label: "Cancelled", cls: "booking-status--cancelled" };
    default:          return { label: "Pending",   cls: "booking-status--pending"   };
  }
}

function getPaymentStatusMeta(status?: string) {
  switch (status) {
    case "paid":         return { label: "Fully Paid",   cls: "payment-status--paid"     };
    case "advance_paid": return { label: "Advance Paid", cls: "payment-status--advance"  };
    case "refunded":     return { label: "Refunded",     cls: "payment-status--refunded" };
    default:             return { label: "Unpaid",       cls: "payment-status--unpaid"   };
  }
}

function PaymentBar({ booking }: { booking: BookingItem }) {
  const paid = booking.advanceAmount || 0;
  const total = booking.totalPrice || 1;
  const isPaid = booking.paymentStatus === "paid";
  const pct = isPaid ? 100 : Math.min(99, Math.round((paid / total) * 100));

  return (
    <div className="bk-payment-bar">
      <div className="bk-payment-bar__track">
        <div
          className={`bk-payment-bar__fill ${isPaid ? "bk-payment-bar__fill--full" : ""}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span>{pct}%</span>
    </div>
  );
}

function BookingRow({ booking }: { booking: BookingItem }) {
  const [open, setOpen] = useState(false);
  const bkMeta = getBookingStatusMeta(booking.bookingStatus);
  const pmMeta = getPaymentStatusMeta(booking.paymentStatus);
  const imgSrc = getImageSrc(booking.travelPick?.imageUrl);

  return (
    <div className={`bk-row ${open ? "bk-row--open" : ""}`}>
      <button
        type="button"
        className="bk-row__main"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        {/* Package */}
        <div className="bk-row__pkg">
          <div className="bk-row__thumb">
            {imgSrc ? (
              <img src={imgSrc} alt={booking.travelPick?.title} />
            ) : (
              <div className="bk-row__thumb-fallback"><FiPackage /></div>
            )}
          </div>
          <div className="bk-row__pkg-info">
            <strong>{booking.travelPick?.title || "Travel Package"}</strong>
            <span><FiMapPin />{booking.travelPick?.place || "—"}</span>
          </div>
        </div>

        {/* Customer */}
        <div className="bk-row__customer">
          <strong>{booking.fullName}</strong>
          <span>{booking.user?.username || booking.email}</span>
        </div>

        {/* Trip dates */}
        <div className="bk-row__dates">
          <span>{formatDate(booking.travelPick?.startDate)}</span>
          <span className="bk-row__dates-sep">→</span>
          <span>{formatDate(booking.travelPick?.endDate)}</span>
        </div>

        {/* Total + payment progress bar */}
        <div className="bk-row__total">
          <strong>{formatMoney(booking.totalPrice)}</strong>
          <PaymentBar booking={booking} />
        </div>

        {/* Status chips */}
        <div className="bk-row__statuses">
          <span className={`bk-chip ${bkMeta.cls}`}>{bkMeta.label}</span>
          <span className={`bk-chip ${pmMeta.cls}`}>{pmMeta.label}</span>
        </div>

        {/* Expand toggle */}
        <div className="bk-row__toggle">
          {open ? <FiChevronUp /> : <FiChevronDown />}
        </div>
      </button>

      {/* Expanded detail panel */}
      {open && (
        <div className="bk-row__detail">
          <div className="bk-detail-grid">

            <div className="bk-detail-section">
              <h4 className="bk-detail-section__title">Customer</h4>
              <div className="bk-detail-rows">
                <div className="bk-detail-row">
                  <span><FiUser /> Full Name</span>
                  <strong>{booking.fullName}</strong>
                </div>
                <div className="bk-detail-row">
                  <span><FiMail /> Email</span>
                  <strong>{booking.email}</strong>
                </div>
                <div className="bk-detail-row">
                  <span><FiPhone /> Phone</span>
                  <strong>{booking.phone}</strong>
                </div>
                <div className="bk-detail-row">
                  <span><FiUsers /> Travelers</span>
                  <strong>{booking.travelersCount}</strong>
                </div>
              </div>
            </div>

            <div className="bk-detail-section">
              <h4 className="bk-detail-section__title">Payment Breakdown</h4>
              <div className="bk-detail-rows">
                <div className="bk-detail-row">
                  <span><FiCreditCard /> Total</span>
                  <strong className="bk-detail-row__amount">{formatMoney(booking.totalPrice)}</strong>
                </div>
                <div className="bk-detail-row">
                  <span>Advance Paid</span>
                  <strong className="bk-detail-row__amount bk-detail-row__amount--paid">
                    {formatMoney(booking.advanceAmount)}
                  </strong>
                </div>
                <div className="bk-detail-row">
                  <span>Remaining</span>
                  <strong className="bk-detail-row__amount bk-detail-row__amount--due">
                    {formatMoney(booking.remainingAmount)}
                  </strong>
                </div>
                <div className="bk-detail-row">
                  <span>Balance Due</span>
                  <strong>{formatDate(booking.balanceDueDate)}</strong>
                </div>
              </div>
            </div>

            <div className="bk-detail-section">
              <h4 className="bk-detail-section__title">Trip Info</h4>
              <div className="bk-detail-rows">
                <div className="bk-detail-row">
                  <span><FiCalendar /> Start</span>
                  <strong>{formatDate(booking.travelPick?.startDate)}</strong>
                </div>
                <div className="bk-detail-row">
                  <span><FiCalendar /> End</span>
                  <strong>{formatDate(booking.travelPick?.endDate)}</strong>
                </div>
                <div className="bk-detail-row">
                  <span>Booked On</span>
                  <strong>{formatDate(booking.createdAt)}</strong>
                </div>
                <div className="bk-detail-row">
                  <span>Booking ID</span>
                  <strong className="bk-detail-row__id">#{booking._id.slice(-8).toUpperCase()}</strong>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
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
      const s = query.toLowerCase();
      data = data.filter((item) =>
        item.fullName?.toLowerCase().includes(s) ||
        item.email?.toLowerCase().includes(s) ||
        item.phone?.toLowerCase().includes(s) ||
        item.user?.username?.toLowerCase().includes(s) ||
        item.travelPick?.title?.toLowerCase().includes(s) ||
        item.travelPick?.place?.toLowerCase().includes(s)
      );
    }
    switch (activeFilter) {
      case "pending":      data = data.filter((i) => i.bookingStatus === "pending"); break;
      case "confirmed":    data = data.filter((i) => i.bookingStatus === "confirmed"); break;
      case "paid":         data = data.filter((i) => i.paymentStatus === "paid"); break;
      case "advance_paid": data = data.filter((i) => i.paymentStatus === "advance_paid"); break;
      case "unpaid":       data = data.filter((i) => i.paymentStatus === "unpaid"); break;
    }
    return data;
  }, [bookings, query, activeFilter]);

  const counts = useMemo(() => ({
    all:          bookings.length,
    pending:      bookings.filter((i) => i.bookingStatus === "pending").length,
    confirmed:    bookings.filter((i) => i.bookingStatus === "confirmed").length,
    paid:         bookings.filter((i) => i.paymentStatus === "paid").length,
    advance_paid: bookings.filter((i) => i.paymentStatus === "advance_paid").length,
    unpaid:       bookings.filter((i) => i.paymentStatus === "unpaid").length,
  }), [bookings]);

  const filters: { key: FilterType; label: string; count: number; cls: string }[] = [
    { key: "all",          label: "All",          count: counts.all,          cls: "" },
    { key: "pending",      label: "Pending",      count: counts.pending,      cls: "bk-filter--pending" },
    { key: "confirmed",    label: "Confirmed",    count: counts.confirmed,    cls: "bk-filter--confirmed" },
    { key: "paid",         label: "Paid",         count: counts.paid,         cls: "bk-filter--paid" },
    { key: "advance_paid", label: "Advance Paid", count: counts.advance_paid, cls: "bk-filter--advance" },
    { key: "unpaid",       label: "Unpaid",       count: counts.unpaid,       cls: "bk-filter--unpaid" },
  ];

  return (
    <section className="admin-bookings-page">

      <div className="admin-page-head">
        <div>
          <h1>Bookings</h1>
          <p>Manage all travel package bookings, balances, and payment progress.</p>
        </div>
        <div className="admin-page-head__meta">
          <span>{filteredBookings.length} booking{filteredBookings.length !== 1 ? "s" : ""}</span>
        </div>
      </div>

      {/* Summary stat pills */}
      <div className="bk-summary-row">
        <div className="bk-summary-pill bk-summary-pill--blue">
          <span className="bk-summary-pill__num">{counts.all}</span>
          <span>Total</span>
        </div>
        <div className="bk-summary-pill bk-summary-pill--orange">
          <span className="bk-summary-pill__num">{counts.pending}</span>
          <span>Pending</span>
        </div>
        <div className="bk-summary-pill bk-summary-pill--green">
          <span className="bk-summary-pill__num">{counts.confirmed}</span>
          <span>Confirmed</span>
        </div>
        <div className="bk-summary-pill bk-summary-pill--teal">
          <span className="bk-summary-pill__num">{counts.paid}</span>
          <span>Fully Paid</span>
        </div>
        <div className="bk-summary-pill bk-summary-pill--amber">
          <span className="bk-summary-pill__num">{counts.advance_paid}</span>
          <span>Advance Paid</span>
        </div>
        <div className="bk-summary-pill bk-summary-pill--red">
          <span className="bk-summary-pill__num">{counts.unpaid}</span>
          <span>Unpaid</span>
        </div>
      </div>

      {/* Search + filters */}
      <div className="bk-toolbar">
        <div className="bk-search">
          <FiSearch />
          <input
            type="text"
            placeholder="Search by customer, package, place, email..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button type="button" className="bk-search__clear" onClick={() => setQuery("")}>×</button>
          )}
        </div>
        <div className="bk-filters">
          {filters.map((f) => (
            <button
              key={f.key}
              type="button"
              className={`bk-filter-btn ${f.cls} ${activeFilter === f.key ? "bk-filter-btn--active" : ""}`}
              onClick={() => setActiveFilter(f.key)}
            >
              {f.label}
              <span className="bk-filter-btn__count">{f.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="bk-empty-state">
          <div className="bk-empty-state__spinner" />
          <p>Loading bookings...</p>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="bk-empty-state">
          <FiPackage />
          <p>No bookings found{query ? ` for "${query}"` : ""}.</p>
        </div>
      ) : (
        <div className="bk-table">
          <div className="bk-table__head">
            <div>Package</div>
            <div>Customer</div>
            <div>Trip Dates</div>
            <div>Total / Paid</div>
            <div>Status</div>
            <div />
          </div>
          <div className="bk-table__body">
            {filteredBookings.map((booking) => (
              <BookingRow key={booking._id} booking={booking} />
            ))}
          </div>
        </div>
      )}

    </section>
  );
}