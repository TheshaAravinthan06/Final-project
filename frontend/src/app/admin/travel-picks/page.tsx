"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/lib/axios";
import { useRouter } from "next/navigation";
import { FiHeart, FiMessageCircle, FiPlus } from "react-icons/fi";
import TravelPickModal from "@/components/admin/TravelPickModal";

type TravelPick = {
  _id: string;
  title: string;
  place: string;
  imageUrl: string;
  caption: string;
  likesCount?: number;
  commentsCount?: number;
  savesCount?: number;
  isPublished: boolean;
  createdAt: string;
};

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

const getImageSrc = (imageUrl?: string) => {
  if (!imageUrl) return "/images/ella.jpg";
  if (imageUrl.startsWith("http")) return imageUrl;
  return `${BACKEND_URL}${imageUrl}`;
};

export default function AdminTravelPicksPage() {
  const router = useRouter();

  const [travelPicks, setTravelPicks] = useState<TravelPick[]>([]);
  const [selectedPickId, setSelectedPickId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTravelPicks = async () => {
      try {
        const res = await api.get("/travel-picks/admin/all");
        setTravelPicks(res.data?.travelPicks || []);
      } catch (error) {
        console.error("Failed to load admin travel picks:", error);
        setTravelPicks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTravelPicks();
  }, []);

  const selectedIndex = useMemo(
    () => travelPicks.findIndex((item) => item._id === selectedPickId),
    [travelPicks, selectedPickId]
  );

  const selectedPick =
    selectedIndex >= 0 && selectedIndex < travelPicks.length
      ? travelPicks[selectedIndex]
      : null;

  const handleTravelPickUpdated = (updatedPick: TravelPick) => {
    setTravelPicks((prev) =>
      prev.map((item) => (item._id === updatedPick._id ? updatedPick : item))
    );
  };

  const handleTravelPickDeleted = (pickId: string) => {
    const nextTravelPicks = travelPicks.filter((item) => item._id !== pickId);
    setTravelPicks(nextTravelPicks);

    if (!nextTravelPicks.length) {
      setSelectedPickId(null);
      return;
    }

    const fallbackIndex =
      selectedIndex >= nextTravelPicks.length
        ? nextTravelPicks.length - 1
        : selectedIndex;

    setSelectedPickId(nextTravelPicks[fallbackIndex]?._id || null);
  };

  if (loading) {
    return (
      <section className="admin-places-page">
        <div className="admin-page-head">
          <div>
            <h1>Travel Picks</h1>
            <p>Loading admin travel picks...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="admin-places-page">
      <div className="admin-page-head">
        <div>
          <h1>Travel Picks</h1>
          <p>Hover to see likes and comments. Click any package to manage it.</p>
        </div>

        <button
          type="button"
          className="admin-page-add-btn"
          onClick={() => router.push("/admin/travel-picks/new")}
        >
          <FiPlus />
          Add Package
        </button>
      </div>

      <div className="admin-place-grid">
        {travelPicks.map((pick) => (
          <button
            key={pick._id}
            type="button"
            className="admin-place-grid__item"
            onClick={() => setSelectedPickId(pick._id)}
          >
            <img src={getImageSrc(pick.imageUrl)} alt={pick.title} />

            <div className="admin-place-grid__overlay">
              <div className="admin-place-grid__stats">
                <span>
                  <FiHeart />
                  {pick.likesCount || 0}
                </span>
                <span>
                  <FiMessageCircle />
                  {pick.commentsCount || 0}
                </span>
              </div>
            </div>

            {!pick.isPublished && (
              <span className="admin-place-grid__hidden-badge">Hidden</span>
            )}
          </button>
        ))}
      </div>

      {selectedPick && (
        <TravelPickModal
          pickId={selectedPick._id}
          onClose={() => setSelectedPickId(null)}
          onTravelPickUpdated={handleTravelPickUpdated}
          onTravelPickDeleted={handleTravelPickDeleted}
          onPrev={
            selectedIndex > 0
              ? () => setSelectedPickId(travelPicks[selectedIndex - 1]._id)
              : undefined
          }
          onNext={
            selectedIndex < travelPicks.length - 1
              ? () => setSelectedPickId(travelPicks[selectedIndex + 1]._id)
              : undefined
          }
        />
      )}
    </section>
  );
}