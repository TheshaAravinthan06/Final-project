"use client";

import { useEffect, useMemo, useState } from "react";
import { FiSearch, FiX, FiMapPin } from "react-icons/fi";
import api from "@/lib/axios";

type SearchOverlayProps = {
  isOpen: boolean;
  onClose: () => void;
};

type SearchUser = {
  _id: string;
  username: string;
  name: string;
  profileImage: string;
  bio: string;
  location: string;
  work: string;
  followersCount: number;
  followingCount: number;
};

const getImageUrl = (path?: string) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
  return `${base}${path}`;
};

export default function SearchOverlay({
  isOpen,
  onClose,
}: SearchOverlayProps) {
  const [query, setQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("trip_recent_searches");
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("trip_recent_searches", JSON.stringify(recentSearches));
  }, [recentSearches]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || !query.trim()) {
      setUsers([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await api.get(`/search/users?q=${encodeURIComponent(query)}`);
        setUsers(res.data.users || []);
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query, isOpen]);

  const addRecent = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;

    setRecentSearches((prev) =>
      [trimmed, ...prev.filter((item) => item !== trimmed)].slice(0, 8)
    );
  };

  const clearAll = () => setRecentSearches([]);
  const removeRecent = (value: string) => {
    setRecentSearches((prev) => prev.filter((item) => item !== value));
  };

  const emptyState = useMemo(() => {
    if (!query.trim()) return "Search travelers by username, bio, location...";
    if (loading) return "Searching...";
    if (!users.length) return "No matching users found.";
    return "";
  }, [query, loading, users.length]);

  return (
    <>
      <div
        className={`search-overlay-backdrop ${isOpen ? "open" : ""}`}
        onClick={onClose}
      />

      <aside className={`search-overlay-panel ${isOpen ? "open" : ""}`}>
        <div className="search-overlay-panel__header">
          <div className="search-overlay-panel__title-row">
            <h2>Search</h2>

            <button
              type="button"
              className="search-overlay-panel__close"
              onClick={onClose}
              aria-label="Close search"
            >
              <FiX />
            </button>
          </div>

          <div className="search-overlay-input">
            <FiSearch className="search-overlay-input__icon" />

            <input
              type="text"
              placeholder="Search users, moods, locations..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addRecent(query);
              }}
            />

            {query && (
              <button
                type="button"
                className="search-overlay-input__clear"
                onClick={() => setQuery("")}
                aria-label="Clear search"
              >
                <FiX />
              </button>
            )}
          </div>
        </div>

        <div className="search-overlay-panel__body">
          {!query.trim() ? (
            <>
              <div className="search-overlay-section-head">
                <h3>Recent</h3>
                {recentSearches.length > 0 && (
                  <button type="button" onClick={clearAll}>
                    Clear all
                  </button>
                )}
              </div>

              {recentSearches.length > 0 ? (
                <div className="search-overlay-recent-list">
                  {recentSearches.map((item) => (
                    <div key={item} className="search-overlay-recent-item">
                      <button
                        type="button"
                        className="search-overlay-recent-item__main"
                        onClick={() => setQuery(item)}
                      >
                        <span className="search-overlay-recent-item__icon">
                          <FiSearch />
                        </span>
                        <span className="search-overlay-recent-item__text">
                          {item}
                        </span>
                      </button>

                      <button
                        type="button"
                        className="search-overlay-recent-item__remove"
                        onClick={() => removeRecent(item)}
                        aria-label={`Remove ${item}`}
                      >
                        <FiX />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="search-overlay-empty">{emptyState}</div>
              )}
            </>
          ) : (
            <div className="search-overlay-results">
              {loading && <div className="search-overlay-empty">Searching...</div>}

              {!loading && users.length === 0 && (
                <div className="search-overlay-empty">No matching users found.</div>
              )}

              {!loading &&
                users.map((user) => (
                  <button
                    key={user._id}
                    type="button"
                    className="search-result-card"
                    onClick={() => addRecent(query)}
                  >
                    <div className="search-result-card__left">
                      {user.profileImage ? (
                        <img
                          src={getImageUrl(user.profileImage)}
                          alt={user.username}
                          className="search-result-card__avatar"
                        />
                      ) : (
                        <div className="search-result-card__avatar search-result-card__avatar--fallback">
                          {user.username?.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className="search-result-card__content">
                      <h4>{user.username}</h4>
                      {user.name && <p>{user.name}</p>}
                      {user.bio && <span>{user.bio}</span>}
                      {user.location && (
                        <small>
                          <FiMapPin /> {user.location}
                        </small>
                      )}
                    </div>
                  </button>
                ))}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}