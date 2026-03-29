"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {
  FiSearch,
  FiX,
  FiMapPin,
  FiHeart,
  FiCompass,
  FiSmile,
} from "react-icons/fi";
import styles from "./search.module.scss";

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
  {
    id: "u6",
    username: "travel_with_nethu",
    name: "Nethmi",
    avatar: "/images/profile1.jpg",
    moodTags: ["fun", "energetic", "weekend"],
    interests: ["friends trip", "food", "short trips"],
    places: ["Kandy", "Trincomalee", "Colombo"],
    bio: "Weekend moments and group trip energy",
  },
];

const initialRecent = [
  "the day with bestie",
  "healing trip",
  "Ella",
  "sunset mood",
  "group travel",
  "Trincomalee",
  "beach vibes",
];

const discoverTags = [
  "healing",
  "adventure",
  "nature",
  "sunset",
  "beach",
  "group travel",
  "solo travel",
  "Ella",
  "Jaffna",
  "Trincomalee",
];

function matchesQuery(user: SearchUser, query: string) {
  const q = query.toLowerCase().trim();
  if (!q) return true;

  const haystack = [
    user.username,
    user.name,
    user.bio,
    ...user.moodTags,
    ...user.interests,
    ...user.places,
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(q);
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState(initialRecent);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => matchesQuery(user, query));
  }, [query]);

  const relatedSuggestions = useMemo(() => {
    if (!query.trim()) return users.slice(0, 5);

    const q = query.toLowerCase();
    return users
      .filter((user) => {
        const related =
          user.moodTags.some((tag) => tag.toLowerCase().includes(q)) ||
          user.interests.some((item) => item.toLowerCase().includes(q)) ||
          user.places.some((place) => place.toLowerCase().includes(q));
        return related || user.username.toLowerCase().includes(q);
      })
      .slice(0, 6);
  }, [query]);

  const handleRecentClick = (item: string) => {
    setQuery(item);
  };

  const removeRecent = (item: string) => {
    setRecentSearches((prev) => prev.filter((x) => x !== item));
  };

  const clearAll = () => {
    setRecentSearches([]);
  };

  const addSearchToRecent = (value: string) => {
    const v = value.trim();
    if (!v) return;
    setRecentSearches((prev) => [v, ...prev.filter((item) => item !== v)].slice(0, 8));
  };

  return (
    <div className={styles.searchPage}>
      <aside className={styles.searchPanel}>
        <div className={styles.searchPanelTop}>
          <div className={styles.titleRow}>
            <h1>Search</h1>
            <button className={styles.closeBtn} type="button" aria-label="Close search">
              <FiX />
            </button>
          </div>

          <div className={styles.searchInputWrap}>
            <FiSearch className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addSearchToRecent(query);
              }}
            />
            {query && (
              <button
                type="button"
                className={styles.clearInputBtn}
                onClick={() => setQuery("")}
                aria-label="Clear search input"
              >
                <FiX />
              </button>
            )}
          </div>
        </div>

        {!query.trim() ? (
          <div className={styles.panelBody}>
            <div className={styles.sectionHead}>
              <h3>Recent</h3>
              {recentSearches.length > 0 && (
                <button type="button" onClick={clearAll}>
                  Clear all
                </button>
              )}
            </div>

            <div className={styles.recentList}>
              {recentSearches.length > 0 ? (
                recentSearches.map((item) => (
                  <div key={item} className={styles.recentItem}>
                    <button
                      type="button"
                      className={styles.recentMain}
                      onClick={() => handleRecentClick(item)}
                    >
                      <span className={styles.recentIcon}>
                        <FiSearch />
                      </span>
                      <span className={styles.recentText}>{item}</span>
                    </button>

                    <button
                      type="button"
                      className={styles.removeBtn}
                      onClick={() => removeRecent(item)}
                      aria-label={`Remove ${item}`}
                    >
                      <FiX />
                    </button>
                  </div>
                ))
              ) : (
                <div className={styles.emptyState}>No recent searches yet.</div>
              )}
            </div>

            <div className={styles.discoveryBlock}>
              <h4>Try searching by</h4>

              <div className={styles.tagGrid}>
                {discoverTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className={styles.tagBtn}
                    onClick={() => setQuery(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.panelBody}>
            <div className={styles.resultMeta}>
              Search by user ID, mood, interest, or place
            </div>

            <div className={styles.resultList}>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    className={styles.userResult}
                    onClick={() => addSearchToRecent(query)}
                  >
                    <div className={styles.userLeft}>
                      <Image
                        src={user.avatar}
                        alt={user.username}
                        width={54}
                        height={54}
                        className={styles.avatar}
                      />
                      <div>
                        <h4>{user.username}</h4>
                        <p>{user.name}</p>
                        <span>{user.bio}</span>
                      </div>
                    </div>
                    <FiX className={styles.resultArrow} />
                  </button>
                ))
              ) : (
                <div className={styles.emptyState}>
                  No matching users, moods, interests, or places found.
                </div>
              )}
            </div>
          </div>
        )}
      </aside>

      <section className={styles.discoverArea}>
        <div className={styles.suggestionHeader}>
          <div className={styles.miniProfile}>
            <Image
              src="/images/profile1.jpg"
              alt="Your profile"
              width={54}
              height={54}
              className={styles.avatar}
            />
            <div>
              <h4>thesha_6</h4>
              <p>Thesh</p>
            </div>
          </div>
          <button type="button">Switch</button>
        </div>

        <div className={styles.suggestCard}>
          <div className={styles.suggestHead}>
            <h3>Suggested for you</h3>
            <button type="button">See all</button>
          </div>

          <div className={styles.suggestList}>
            {relatedSuggestions.map((user) => (
              <div key={user.id} className={styles.suggestItem}>
                <div className={styles.suggestLeft}>
                  <Image
                    src={user.avatar}
                    alt={user.username}
                    width={48}
                    height={48}
                    className={styles.avatar}
                  />
                  <div>
                    <h4>{user.username}</h4>
                    <p>{user.moodTags[0]} · {user.places[0]}</p>
                  </div>
                </div>
                <button type="button">Follow</button>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.searchHintCard}>
          <h3>Search ideas</h3>

          <div className={styles.searchIdeaList}>
            <div className={styles.searchIdea}>
              <FiSmile />
              <span>Search by mood like healing, calm, romantic</span>
            </div>
            <div className={styles.searchIdea}>
              <FiHeart />
              <span>Search by travel interest like beach, hiking, solo travel</span>
            </div>
            <div className={styles.searchIdea}>
              <FiMapPin />
              <span>Search by place like Ella, Jaffna, Trincomalee</span>
            </div>
            <div className={styles.searchIdea}>
              <FiCompass />
              <span>Find users related to the same travel vibe</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}