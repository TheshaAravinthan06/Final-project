"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/lib/axios";
import FeedPostCard from "@/components/home/FeedPostCard";
import ExplorePlacesCard from "@/components/home/ExplorePlacesCard";
import RightPanel from "@/components/home/RightPanel";
import BlogPreview from "@/components/blog/BlogPreview";

type Post = {
  _id: string;
  imageUrl: string;
  caption: string;
  location?: string;
  createdAt: string;
  likesCount: number;
  commentsCount: number;
  savesCount: number;
  shareCount: number;
  isLiked?: boolean;
  isSaved?: boolean;
  createdBy?: {
    _id: string;
    username: string;
    name?: string;
    profileImage?: string;
  } | null;
};

type Blog = {
  _id: string;
  title: string;
  coverImage: string;
  excerpt?: string;
  content: string;
  location?: string;
  createdAt: string;
  author?: {
    _id?: string;
    username?: string;
    profileImage?: string;
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
  createdAt?: string;
};

type FeedItem =
  | (Post & { type: "post" })
  | (Blog & { type: "blog" });

export default function HomePage() {
  const [activeFeed, setActiveFeed] = useState<
    "travel-diaries" | "explore-places"
  >("travel-diaries");

  const [posts, setPosts] = useState<Post[]>([]);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [loadingPlaces, setLoadingPlaces] = useState(true);

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        const [postRes, blogRes] = await Promise.all([
          api.get("/user-posts"),
          api.get("/blogs"),
        ]);

        setPosts(postRes.data.posts || []);
        setBlogs(blogRes.data.blogs || []);
      } catch (err) {
        console.error("Feed fetch error:", err);
      } finally {
        setLoadingFeed(false);
      }
    };

    fetchFeed();
  }, []);

  useEffect(() => {
    const fetchPlaces = async () => {
      try {
        const res = await api.get("/places");

        const placesData = Array.isArray(res.data)
          ? res.data
          : res.data?.places || res.data?.data || [];

        setPlaces(placesData);
      } catch (error) {
        console.error("Failed to fetch places:", error);
      } finally {
        setLoadingPlaces(false);
      }
    };

    fetchPlaces();
  }, []);

  const combinedFeed = useMemo<FeedItem[]>(() => {
    return [
      ...posts.map((p) => ({ ...p, type: "post" as const })),
      ...blogs.map((b) => ({ ...b, type: "blog" as const })),
    ].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [posts, blogs]);

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
                  ? "See travel posts and blogs shared by users."
                  : "Discover places posted by admin."}
              </p>
            </div>
          </div>

          <div className="feed-list">
            {activeFeed === "travel-diaries" && loadingFeed && (
              <div className="feed-loading-card">Loading feed...</div>
            )}

            {activeFeed === "travel-diaries" &&
              !loadingFeed &&
              combinedFeed.length === 0 && (
                <div className="feed-loading-card">
                  No travel diaries found yet.
                </div>
              )}

            {activeFeed === "travel-diaries" &&
              !loadingFeed &&
              combinedFeed.map((item) => {
                if (item.type === "post") {
                  return <FeedPostCard key={item._id} post={item} />;
                }

                return <BlogPreview key={item._id} blog={item} />;
              })}

            {activeFeed === "explore-places" && loadingPlaces && (
              <div className="feed-loading-card">
                Loading explore places...
              </div>
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