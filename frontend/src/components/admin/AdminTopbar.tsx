"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/lib/axios";
import { FiBell, FiSearch } from "react-icons/fi";
import { useRouter } from "next/navigation";

type AdminUser = {
  _id?: string;
  username?: string;
  name?: string;
  email?: string;
  role?: string;
  profileImage?: string;
};

type AdminSearchResult = {
  users: Array<{
    _id: string;
    username: string;
    name?: string;
    email?: string;
    role?: string;
    profileImage?: string;
    isActive?: boolean;
  }>;
  places: Array<{
    _id: string;
    placeName: string;
    location?: string;
  }>;
  travelPicks: Array<{
    _id: string;
    title: string;
    place?: string;
  }>;
  itineraries: Array<{
    _id: string;
    title?: string;
    destination?: string;
  }>;
  bookings: Array<{
    _id: string;
    user?: { username: string } | null;
    travelPick?: { title: string } | null;
  }>;
};

function getImageUrl(path?: string) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
  return `${base}${path}`;
}

function getInitialLetter(name?: string, username?: string) {
  return (name?.trim()?.charAt(0) || username?.trim()?.charAt(0) || "U").toUpperCase();
}

export default function AdminTopbar() {
  const router = useRouter();

  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AdminSearchResult | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchAdmin = async () => {
    try {
      const res = await api.get("/users/me");
      setAdmin(res.data?.user || null);
    } catch (error) {
      console.error("Failed to fetch admin profile:", error);
    }
  };

  const fetchUnread = async () => {
    try {
      const res = await api.get("/admin/notifications?unreadOnly=true&limit=5");
      setUnreadCount(res.data?.unreadCount || 0);
    } catch (error) {
      console.error("Failed to fetch unread notifications:", error);
    }
  };

  useEffect(() => {
    fetchAdmin();
    fetchUnread();

    const handleProfileUpdate = () => {
      fetchAdmin();
    };

    window.addEventListener("admin-profile-updated", handleProfileUpdate);

    return () => {
      window.removeEventListener("admin-profile-updated", handleProfileUpdate);
    };
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      setShowResults(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/admin/search?q=${encodeURIComponent(query)}`);
        setResults(res.data);
        setShowResults(true);
      } catch (error) {
        console.error("Admin search failed:", error);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".admin-search-wrap")) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayName =
    admin?.name?.trim() || admin?.username?.trim() || "Admin";

  const displaySubText =
    admin?.role === "admin"
      ? "Trip AI"
      : admin?.email?.trim() || "Trip AI";

  const imageUrl = getImageUrl(admin?.profileImage);
  const fallbackLetter = displayName.charAt(0).toUpperCase();

  const hasResults = useMemo(() => {
    return !!results &&
      (
        results.users?.length ||
        results.places?.length ||
        results.travelPicks?.length ||
        results.itineraries?.length ||
        results.bookings?.length
      );
  }, [results]);

  const handleUserOpen = (userId: string) => {
    setShowResults(false);
    setQuery("");
    router.push(`/admin/users/${userId}`);
  };

  return (
    <header className="admin-topbar">
      <div className="admin-search-wrap">
        <div className="admin-search">
          <FiSearch />
          <input
            type="text"
            placeholder="Search users, places, packages..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              if (query.trim()) setShowResults(true);
            }}
            autoComplete="off"
          />
        </div>

        {showResults && query.trim() && (
          <div className="admin-search-dropdown">
            {!hasResults && (
              <div className="admin-search-empty">No matching results found.</div>
            )}

            {results?.users?.length ? (
              <div className="admin-search-group">
                <h5>Profiles</h5>

                {results.users.map((item) => {
                  const profileImg = getImageUrl(item.profileImage);
                  const profileName = item.name?.trim() || item.username;

                  return (
                    <button
                      key={item._id}
                      type="button"
                      className="admin-search-item admin-search-item--user"
                      onClick={() => handleUserOpen(item._id)}
                    >
                      <div className="admin-search-item__avatar">
                        {profileImg ? (
                          <img src={profileImg} alt={profileName} />
                        ) : (
                          <span>{getInitialLetter(item.name, item.username)}</span>
                        )}
                      </div>

                      <div className="admin-search-item__content">
                        <strong>{item.username}</strong>
                        <span>{profileName}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : null}

            {results?.places?.length ? (
              <div className="admin-search-group">
                <h5>Places</h5>
                {results.places.map((item) => (
                  <button
                    key={item._id}
                    type="button"
                    className="admin-search-item"
                    onClick={() => {
                      setShowResults(false);
                      setQuery("");
                      router.push("/admin/places");
                    }}
                  >
                    <strong>{item.placeName}</strong>
                    <span>{item.location || "Place"}</span>
                  </button>
                ))}
              </div>
            ) : null}

            {results?.travelPicks?.length ? (
              <div className="admin-search-group">
                <h5>Travel Picks</h5>
                {results.travelPicks.map((item) => (
                  <button
                    key={item._id}
                    type="button"
                    className="admin-search-item"
                    onClick={() => {
                      setShowResults(false);
                      setQuery("");
                      router.push("/admin/travel-picks");
                    }}
                  >
                    <strong>{item.title}</strong>
                    <span>{item.place || "Package"}</span>
                  </button>
                ))}
              </div>
            ) : null}

            {results?.itineraries?.length ? (
              <div className="admin-search-group">
                <h5>Itineraries</h5>
                {results.itineraries.map((item) => (
                  <button
                    key={item._id}
                    type="button"
                    className="admin-search-item"
                    onClick={() => {
                      setShowResults(false);
                      setQuery("");
                      router.push("/admin/itineraries");
                    }}
                  >
                    <strong>{item.title || "Untitled itinerary"}</strong>
                    <span>{item.destination || "Itinerary"}</span>
                  </button>
                ))}
              </div>
            ) : null}

            {results?.bookings?.length ? (
              <div className="admin-search-group">
                <h5>Bookings</h5>
                {results.bookings.map((item) => (
                  <button
                    key={item._id}
                    type="button"
                    className="admin-search-item"
                    onClick={() => {
                      setShowResults(false);
                      setQuery("");
                      router.push("/admin/bookings");
                    }}
                  >
                    <strong>{item.user?.username || "User"}</strong>
                    <span>{item.travelPick?.title || "Booking"}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        )}
      </div>

      <div className="admin-topbar__right">
        <button
          type="button"
          className="admin-topbar__icon-btn"
          onClick={() => router.push("/admin/notifications")}
        >
          <FiBell />
          {unreadCount > 0 && (
            <span className="admin-topbar__badge">{unreadCount}</span>
          )}
        </button>

        <div className="admin-topbar__profile">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={displayName}
              className="admin-topbar__avatar admin-topbar__avatar-image"
            />
          ) : (
            <div className="admin-topbar__avatar">{fallbackLetter}</div>
          )}

          <div>
            <h4>{displayName}</h4>
            <p>{displaySubText}</p>
          </div>
        </div>
      </div>
    </header>
  );
}