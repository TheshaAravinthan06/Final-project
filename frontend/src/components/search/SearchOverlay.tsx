"use client";

import { useEffect, useMemo, useState } from "react";
import { FiSearch, FiX } from "react-icons/fi";
import { useRouter } from "next/navigation";
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
};

const getImageUrl = (path?: string) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const base =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
  return `${base}${path}`;
};

export default function SearchOverlay({
  isOpen,
  onClose,
}: SearchOverlayProps) {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(false);

  // load recent searches
  useEffect(() => {
    const saved = localStorage.getItem("trip_recent_searches");
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // save recent searches
  useEffect(() => {
    localStorage.setItem(
      "trip_recent_searches",
      JSON.stringify(recentSearches)
    );
  }, [recentSearches]);

  // close on ESC
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // search API
  useEffect(() => {
    if (!isOpen || !query.trim()) {
      setUsers([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await api.get(
          `/search/users?q=${encodeURIComponent(query)}`
        );
        setUsers(res.data.users || []);
      } catch (error) {
        console.error("Search error:", error);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query, isOpen]);

  // add recent
  const addRecent = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;

    setRecentSearches((prev) =>
      [trimmed, ...prev.filter((item) => item !== trimmed)].slice(0, 8)
    );
  };

  const clearAll = () => setRecentSearches([]);

  const removeRecent = (value: string) => {
    setRecentSearches((prev) =>
      prev.filter((item) => item !== value)
    );
  };

  // click user
  const handleUserClick = (user: SearchUser) => {
    addRecent(user.username || query);
    onClose();
    router.push(`/user/${user._id}`);
  };

  const emptyState = useMemo(() => {
    if (!query.trim()) return "Search profiles";
    if (loading) return "Searching...";
    if (!users.length) return "No results found";
    return "";
  }, [query, loading, users.length]);

  return (
    <>
      {/* backdrop */}
      <div
        className={`search-overlay-backdrop ${isOpen ? "open" : ""}`}
        onClick={onClose}
      />

      {/* panel */}
      <aside className={`search-overlay-panel ${isOpen ? "open" : ""}`}>
        {/* header */}
        <div className="search-overlay-panel__header">
          <div className="search-overlay-panel__title-row">
            <h2>Search</h2>

            <button
              type="button"
              className="search-overlay-panel__close"
              onClick={onClose}
            >
              <FiX />
            </button>
          </div>

          {/* input */}
          <div className="search-overlay-input">
            <FiSearch className="search-overlay-input__icon" />

            <input
              type="text"
              placeholder="Search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />

            {query && (
              <button
                type="button"
                className="search-overlay-input__clear"
                onClick={() => setQuery("")}
              >
                <FiX />
              </button>
            )}
          </div>
        </div>

        {/* body */}
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
                    <div
                      key={item}
                      className="search-overlay-recent-item"
                    >
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
                      >
                        <FiX />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="search-overlay-empty">
                  {emptyState}
                </div>
              )}
            </>
          ) : (
            <div className="search-users-list">
              {loading && (
                <div className="search-overlay-empty">
                  Searching...
                </div>
              )}

              {!loading && users.length === 0 && (
                <div className="search-overlay-empty">
                  No results found
                </div>
              )}

              {!loading &&
                users.map((user) => (
                  <button
                    key={user._id}
                    type="button"
                    className="search-user-item"
                    onClick={() => handleUserClick(user)}
                  >
                    <div className="search-user-avatar-wrap">
                      {user.profileImage ? (
                        <img
                          src={getImageUrl(user.profileImage)}
                          alt={user.username}
                          className="search-user-avatar"
                        />
                      ) : (
                        <div className="search-user-avatar search-user-avatar--fallback">
                          {user.username
                            ?.charAt(0)
                            .toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className="search-user-text">
                      <div className="search-user-username">
                        {user.username}
                      </div>

                      <div className="search-user-name">
                        {user.name || user.username}
                      </div>
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