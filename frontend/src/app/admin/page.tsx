"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/lib/axios";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  FiUsers,
  FiShoppingBag,
  FiMapPin,
  FiClipboard,
  FiCalendar,
  FiTrendingUp,
} from "react-icons/fi";

type Summary = {
  totalUsers: number;
  totalBookings: number;
  totalPackages: number;
  totalPlaces: number;
  pendingItineraries: number;
  totalRevenue: number;
};

type BookingTrendItem = {
  month: string;
  bookings: number;
  revenue: number;
};

type TopPackageItem = {
  name: string;
  bookings: number;
};

type PaymentStatusItem = {
  name: string;
  value: number;
};

type RecentBooking = {
  _id: string;
  fullName: string;
  totalPrice: number;
  paymentStatus: string;
  bookingStatus: string;
  createdAt: string;
  travelPick?: {
    title?: string;
  } | null;
};

type RecentPlace = {
  _id: string;
  placeName: string;
  location: string;
  createdAt: string;
  imageUrl: string;
};

type RecentTravelPick = {
  _id: string;
  title: string;
  place: string;
  createdAt: string;
  imageUrl: string;
  bookingCount?: number;
};

type PendingItinerary = {
  _id: string;
  generatedTitle?: string;
  mood?: string;
  destination?: string;
  createdAt: string;
  user?: {
    username?: string;
  } | null;
};

type DashboardResponse = {
  summary: Summary;
  bookingTrend: BookingTrendItem[];
  topPackages: TopPackageItem[];
  paymentStatus: PaymentStatusItem[];
  recentBookings: RecentBooking[];
  recentPlaces: RecentPlace[];
  recentTravelPicks: RecentTravelPick[];
  pendingItineraries: PendingItinerary[];
};

const GRAPH_COLORS = ["#5e9f7c", "#7db59a", "#25473d", "#9fc7a9"];

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return value;
  }
}

function getImageUrl(path?: string) {
  if (!path) return "/images/ella.jpg";

  if (path.startsWith("http")) return path;

  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
  return `${base}${path}`;
}

function StatCard({
  title,
  value,
  icon,
  accentClass,
  subText,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  accentClass: string;
  subText?: string;
}) {
  return (
    <div className={`admin-stat-card ${accentClass}`}>
      <div className="admin-stat-card__icon">{icon}</div>
      <div className="admin-stat-card__content">
        <p>{title}</p>
        <h3>{value}</h3>
        {subText ? <span>{subText}</span> : null}
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get("/admin/dashboard");
        setData(res.data);
      } catch (error) {
        console.error("Failed to load admin dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const summary = useMemo<Summary>(
    () =>
      data?.summary || {
        totalUsers: 0,
        totalBookings: 0,
        totalPackages: 0,
        totalPlaces: 0,
        pendingItineraries: 0,
        totalRevenue: 0,
      },
    [data]
  );

  if (loading) {
    return (
      <section className="admin-dashboard">
        <div className="admin-page-head">
          <div>
            <h1>Admin Dashboard</h1>
            <p>Loading dashboard overview...</p>
          </div>
        </div>

        <div className="admin-loading-card">Loading admin dashboard...</div>
      </section>
    );
  }

  return (
    <section className="admin-dashboard">
      <div className="admin-page-head">
        <div>
          <h1>Admin Dashboard</h1>
          <p>
            Track bookings, packages, places, pending itineraries, and platform
            activity.
          </p>
        </div>

        <div className="admin-page-head__meta">
          <span>Trip AI Admin Panel</span>
        </div>
      </div>

      <div className="admin-stats-grid">
        <StatCard
          title="Total Users"
          value={summary.totalUsers}
          subText="Registered users"
          icon={<FiUsers />}
          accentClass="blue"
        />
        <StatCard
          title="Total Bookings"
          value={summary.totalBookings}
          subText="All package bookings"
          icon={<FiCalendar />}
          accentClass="purple"
        />
        <StatCard
          title="Travel Picks"
          value={summary.totalPackages}
          subText="Published packages"
          icon={<FiShoppingBag />}
          accentClass="orange"
        />
        <StatCard
          title="Places Posted"
          value={summary.totalPlaces}
          subText="Explore posts"
          icon={<FiMapPin />}
          accentClass="green"
        />
        <StatCard
          title="Pending Itineraries"
          value={summary.pendingItineraries}
          subText="Need review"
          icon={<FiClipboard />}
          accentClass="red"
        />
        <StatCard
          title="Revenue"
          value={formatMoney(summary.totalRevenue)}
          subText="Completed payments"
          icon={<FiTrendingUp />}
          accentClass="dark"
        />
      </div>

      <div className="admin-dashboard-grid">
        <div className="admin-panel admin-panel--chart">
          <div className="admin-panel__head">
            <div>
              <h3>Bookings Overview</h3>
              <p>Monthly bookings and revenue trend</p>
            </div>
          </div>

          <div className="admin-chart-wrap">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data?.bookingTrend || []}>
                <defs>
                  <linearGradient id="bookingArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#5e9f7c" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#5e9f7c" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#dce7df" />
                <XAxis dataKey="month" stroke="#6a7d75" />
                <YAxis stroke="#6a7d75" />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="bookings"
                  stroke="#25473d"
                  strokeWidth={3}
                  fill="url(#bookingArea)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="admin-panel admin-panel--chart">
          <div className="admin-panel__head">
            <div>
              <h3>Top Booked Packages</h3>
              <p>Most selected packages right now</p>
            </div>
          </div>

          <div className="admin-chart-wrap">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={data?.topPackages || []}
                layout="vertical"
                margin={{ top: 10, right: 18, left: 10, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e3ece5" />
                <XAxis type="number" stroke="#6a7d75" />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={120}
                  stroke="#6a7d75"
                />
                <Tooltip />
                <Bar dataKey="bookings" radius={[0, 10, 10, 0]}>
                  {(data?.topPackages || []).map((entry, index) => (
                    <Cell
                      key={`${entry.name}-${index}`}
                      fill={GRAPH_COLORS[index % GRAPH_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="admin-panel">
          <div className="admin-panel__head">
            <div>
              <h3>Booking Status</h3>
              <p>Payment split overview</p>
            </div>
          </div>

          <div className="admin-pie-section">
            <div className="admin-pie-chart">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={data?.paymentStatus || []}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={62}
                    outerRadius={92}
                    paddingAngle={4}
                  >
                    {(data?.paymentStatus || []).map((entry, index) => (
                      <Cell
                        key={`${entry.name}-${index}`}
                        fill={GRAPH_COLORS[index % GRAPH_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="admin-pie-legend">
              {(data?.paymentStatus || []).map((item, index) => (
                <div key={item.name} className="admin-legend-row">
                  <span
                    className="admin-legend-dot"
                    style={{ backgroundColor: GRAPH_COLORS[index % GRAPH_COLORS.length] }}
                  />
                  <span>{item.name}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="admin-panel">
          <div className="admin-panel__head">
            <div>
              <h3>Recent Bookings</h3>
              <p>Latest booking activity</p>
            </div>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Package</th>
                  <th>Amount</th>
                  <th>Payment</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(data?.recentBookings || []).map((booking) => (
                  <tr key={booking._id}>
                    <td>{booking.fullName}</td>
                    <td>{booking.travelPick?.title || "Package"}</td>
                    <td>{formatMoney(booking.totalPrice)}</td>
                    <td>
                      <span className={`admin-badge ${booking.paymentStatus}`}>
                        {booking.paymentStatus.replace("_", " ")}
                      </span>
                    </td>
                    <td>
                      <span className={`admin-badge ${booking.bookingStatus}`}>
                        {booking.bookingStatus}
                      </span>
                    </td>
                  </tr>
                ))}
                {(data?.recentBookings || []).length === 0 && (
                  <tr>
                    <td colSpan={5}>No bookings yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="admin-side-stack">
          <div className="admin-panel">
            <div className="admin-panel__head">
              <div>
                <h3>Recently Posted Places</h3>
                <p>Latest Explore Places posts</p>
              </div>
            </div>

            <div className="admin-mini-list">
              {(data?.recentPlaces || []).map((place) => (
                <div key={place._id} className="admin-mini-card">
                  <img
                    src={getImageUrl(place.imageUrl)}
                    alt={place.placeName}
                  />
                  <div>
                    <h4>{place.placeName}</h4>
                    <p>{place.location}</p>
                    <span>{formatDate(place.createdAt)}</span>
                  </div>
                </div>
              ))}
              {(data?.recentPlaces || []).length === 0 && (
                <p className="admin-empty-text">No place posts yet.</p>
              )}
            </div>
          </div>

          <div className="admin-panel">
            <div className="admin-panel__head">
              <div>
                <h3>Recent Travel Picks</h3>
                <p>Latest package posts</p>
              </div>
            </div>

            <div className="admin-mini-list">
              {(data?.recentTravelPicks || []).map((item) => (
                <div key={item._id} className="admin-mini-card">
                  <img
                    src={getImageUrl(item.imageUrl)}
                    alt={item.title}
                  />
                  <div>
                    <h4>{item.title}</h4>
                    <p>{item.place}</p>
                    <span>
                      {item.bookingCount || 0} bookings • {formatDate(item.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
              {(data?.recentTravelPicks || []).length === 0 && (
                <p className="admin-empty-text">No travel picks yet.</p>
              )}
            </div>
          </div>

          <div className="admin-panel">
            <div className="admin-panel__head">
              <div>
                <h3>Pending Itineraries</h3>
                <p>AI itineraries waiting for admin review</p>
              </div>
            </div>

            <div className="admin-mini-list">
              {(data?.pendingItineraries || []).map((item) => (
                <div key={item._id} className="admin-itinerary-row">
                  <div className="admin-itinerary-row__dot" />
                  <div>
                    <h4>
                      {item.generatedTitle || item.destination || "New itinerary"}
                    </h4>
                    <p>
                      {item.user?.username || "User"} • {item.mood || "Mood not set"}
                    </p>
                  </div>
                </div>
              ))}
              {(data?.pendingItineraries || []).length === 0 && (
                <p className="admin-empty-text">No pending itineraries.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}