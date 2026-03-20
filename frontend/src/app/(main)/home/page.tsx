"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import FeedPostCard from "@/components/home/FeedPostCard";
import ExplorePlacesCard from "@/components/home/ExplorePlacesCard";
import RightPanel from "@/components/home/RightPanel";

type PlaceComment = {
  _id: string;
  text: string;
  createdAt: string;
  user: {
    _id: string;
    username: string;
  } | null;
};

type Place = {
  _id: string;
  placeName: string;
  location: string;
  imageUrl: string;
  caption: string;
  moodTags: string[];
  activities: string[];
  bestTime: string;
  weather: string;
  vibe: string;
  travelTip: string;
  createdBy?: {
    username?: string;
  };
  createdAt?: string;
  likesCount?: number;
  savesCount?: number;
  commentsCount?: number;
  shareCount?: number;
  isLiked?: boolean;
  isSaved?: boolean;
  comments?: PlaceComment[];
};

type MockPost = {
  id: number;
  username: string;
  handle: string;
  avatar: string;
  image: string;
  caption: string;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  time: string;
};

const mockPosts: MockPost[] = [
  {
    id: 1,
    username: "nethmi_travels",
    handle: "@nethmi",
    avatar: "/images/ella.jpg",
    image: "/images/mirissa.jpg",
    caption: "Sunset moments and sea breeze. This trip felt like peace.",
    likes: 214,
    comments: 18,
    shares: 7,
    saves: 16,
    time: "2h",
  },
  {
    id: 2,
    username: "sajee_journey",
    handle: "@sajee",
    avatar: "/images/sigiriya.jpg",
    image: "/images/ella.jpg",
    caption: "Morning train rides, mountain air, and the best calm vibe.",
    likes: 172,
    comments: 11,
    shares: 4,
    saves: 9,
    time: "5h",
  },
  {
    id: 3,
    username: "vibe_with_anu",
    handle: "@anu",
    avatar: "/images/mirissa.jpg",
    image: "/images/nuwareliya.jpg",
    caption: "Cold weather, tea lands, and memories with new people.",
    likes: 296,
    comments: 23,
    shares: 8,
    saves: 19,
    time: "8h",
  },
];

export default function HomePage() {
  const [activeFeed, setActiveFeed] = useState<"travel-diaries" | "explore-places">(
    "travel-diaries"
  );
  const [places, setPlaces] = useState<Place[]>([]);
  const [loadingPlaces, setLoadingPlaces] = useState(true);

  useEffect(() => {
    const fetchPlaces = async () => {
      try {
        const res = await api.get("/places");

        const placesData = Array.isArray(res.data)
          ? res.data
          : res.data?.places || res.data?.data || res.data?.allPlaces || [];

        setPlaces(placesData);
      } catch (error) {
        console.error("Failed to fetch places:", error);
      } finally {
        setLoadingPlaces(false);
      }
    };

    fetchPlaces();
  }, []);

  const updatePlaceInState = (updatedPlace: Place) => {
    setPlaces((prev) =>
      prev.map((place) =>
        place._id === updatedPlace._id ? updatedPlace : place
      )
    );
  };

  return (
    <section className="home-page">
      <div className="home-content">
        <div className="home-main">
          <div className="feed-switcher">
            <button
              type="button"
              className={activeFeed === "travel-diaries" ? "active" : ""}
              onClick={() => setActiveFeed("travel-diaries")}
            >
              Travel Diaries
            </button>

            <button
              type="button"
              className={activeFeed === "explore-places" ? "active" : ""}
              onClick={() => setActiveFeed("explore-places")}
            >
              Explore Places
            </button>
          </div>

          <div className="feed-section-head">
            <div>
              <h2>
                {activeFeed === "travel-diaries"
                  ? "Travel Diaries"
                  : "Explore Places"}
              </h2>
              <p>
                {activeFeed === "travel-diaries"
                  ? "See travel moments shared by users."
                  : "Discover places posted by admin."}
              </p>
            </div>
          </div>

          <div className="feed-list">
            {activeFeed === "travel-diaries" &&
              mockPosts.map((post) => (
                <FeedPostCard key={post.id} post={post} />
              ))}

            {activeFeed === "explore-places" && loadingPlaces && (
              <div className="feed-loading-card">Loading explore places...</div>
            )}

            {activeFeed === "explore-places" &&
              !loadingPlaces &&
              places.length === 0 && (
                <div className="feed-loading-card">
                  No explore places found yet.
                </div>
              )}

            {activeFeed === "explore-places" &&
              !loadingPlaces &&
              places.map((place) => (
                <ExplorePlacesCard
                  key={place._id}
                  place={place}
                  onPlaceUpdated={updatePlaceInState}
                />
              ))}
          </div>
        </div>

        <RightPanel />
      </div>
    </section>
  );
}