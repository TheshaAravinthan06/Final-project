"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { FiSearch, FiX, FiMapPin, FiHeart, FiCompass, FiSmile } from "react-icons/fi";

type SearchOverlayProps = {
  isOpen: boolean;
  onClose: () => void;
};

type SearchUser = {
  id: string;
  username: string;
  name: string;
  avatar: string;
  moodTags: string[];
  interests: string[];
  places: string[];
  bio: string;
};

const users: SearchUser[] = [
  {
    id: "u1",
    username: "thesha_6",
    name: "Thesh",
    avatar: "/images/profile1.jpg",
    moodTags: ["calm", "healing", "sunset"],
    interests: ["solo travel", "beach", "nature"],
    places: ["Trincomalee", "Ella", "Jaffna"],
    bio: "Relaxed escapes and sunset travel vibes",
  },
  {
    id: "u2",
    username: "logika_ka",
    name: "Logika",
    avatar: "/images/profile2.jpg",
    moodTags: ["adventure", "fun", "energetic"],
    interests: ["hiking", "camping", "group travel"],
    places: ["Knuckles", "Ella", "Sigiriya"],
    bio: "Adventure lover and travel vibe seeker",
  },
  {
    id: "u3",
    username: "keth_ces",
    name: "Keth",
    avatar: "/images/ella.jpg",
    moodTags: ["calm", "cozy", "nature"],
    interests: ["mountains", "tea estates", "photography"],
    places: ["Nuwara Eliya", "Ella", "Haputale"],
    bio: "Travel vibes with nature and cozy stays",
  },
  {
    id: "u4",
    username: "branavi",
    name: "Branavi",
    avatar: "/images/about-photo.jpg",
    moodTags: ["healing", "peaceful", "slow"],
    interests: ["wellness", "beach", "girls trip"],
    places: ["Arugam Bay", "Mirissa", "Pasikudah"],
    bio: "Healing trips and peaceful escapes",
  },
  {
    id: "u5",
    username: "mecnu_si",
    name: "Mecnu",
    avatar: "/images/hero-bg.jpg",
    moodTags: ["romantic", "soft", "sunset"],
    interests: ["couple travel", "cafes", "luxury"],
    places: ["Galle", "Bentota", "Colombo"],
    bio: "Soft escapes and memorable travel moments",
  },
];

const initialRecent = [
  "healing trip",
  "Ella",
  "group travel",
  "beach vibes",
  "sunset mood",
];

function matchesQuery(user: SearchUser, query: string) {
  const q = query.toLowerCase().trim();
  if (!q) return true;

  const combined = [
    user.username,
    user.name,
    user.bio,
    ...user.moodTags,
    ...user.interests,
    ...user.places,
  ]
    .join(" ")
    .toLowerCase();

  return combined.includes(q);
}

export default function SearchOverlay({
  isOpen,
  onClose,
}: SearchOverlayProps) {
  const [query, setQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState(initialRecent);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => matchesQuery(user, query));
  }, [query]);

  const addRecent = (value: string) => {
    const v = value.trim();
    if (!v) return;
    setRecentSearches((prev) => [v, ...prev.filter((item) => item !== v)].slice(0, 8));
  };

  const clearAll = () => setRecentSearches([]);
  const removeRecent = (value: string) => {
    setRecentSearches((prev) => prev.filter((item) => item !== value));
  };

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
              placeholder="Search"
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
                <div className="search-overlay-empty">No recent searches.</div>
              )}

              <div className="search-overlay-hint-list">
                <div className="search-overlay-hint">
                  <FiSmile />
                  <span>Search by mood like healing, calm, romantic</span>
                </div>
                <div className="search-overlay-hint">
                  <FiHeart />
                  <span>Search by travel interest like beach, solo travel, hiking</span>
                </div>
                <div className="search-overlay-hint">
                  <FiMapPin />
                  <span>Search by place like Ella, Jaffna, Trincomalee</span>
                </div>
                <div className="search-overlay-hint">
                  <FiCompass />
                  <span>Find users related to the same travel vibe</span>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="search-overlay-result-meta">
                Search by user ID, mood, travel interest, or place
              </div>

              <div className="search-overlay-result-list">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      className="search-overlay-user-item"
                      onClick={() => addRecent(query)}
                    >
                      <div className="search-overlay-user-item__left">
                        <Image
                          src={user.avatar}
                          alt={user.username}
                          width={52}
                          height={52}
                          className="search-overlay-avatar"
                        />
                        <div>
                          <h4>{user.username}</h4>
                          <p>{user.name}</p>
                          <span>{user.bio}</span>
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="search-overlay-empty">
                    No matching users, moods, interests, or places found.
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </aside>
    </>
  );
}