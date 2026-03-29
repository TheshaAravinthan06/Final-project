"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/lib/axios";
import TravelPickModal from "@/components/admin/TravelPickModal";

type TravelPick = {
  _id: string;
  title: string;
  place: string;
  imageUrl: string;
  price: number;
  startDate: string;
  endDate: string;
  caption: string;
  isPublished?: boolean;
};

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

const getImageSrc = (imageUrl?: string) => {
  if (!imageUrl) return "/images/ella.jpg";
  if (imageUrl.startsWith("http")) return imageUrl;
  return `${BACKEND_URL}${imageUrl}`;
};

export default function AdminTravelPicksPage() {
  const [picks, setPicks] = useState<TravelPick[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchPicks = async () => {
      try {
        const res = await api.get("/travel-picks/admin/all");
        setPicks(res.data.travelPicks || []);
      } catch (error) {
        console.error("Failed to load travel picks:", error);
      }
    };

    fetchPicks();
  }, []);

  const selectedIndex = useMemo(
    () => picks.findIndex((item) => item._id === selectedId),
    [picks, selectedId]
  );

  const selectedPick =
    selectedIndex >= 0 && selectedIndex < picks.length
      ? picks[selectedIndex]
      : null;

  const handlePickUpdated = (updatedPick: TravelPick) => {
    setPicks((prev) =>
      prev.map((item) => (item._id === updatedPick._id ? updatedPick : item))
    );
  };

  const handlePickDeleted = (pickId: string) => {
    const nextPicks = picks.filter((item) => item._id !== pickId);
    setPicks(nextPicks);

    if (!nextPicks.length) {
      setSelectedId(null);
      return;
    }

    const fallbackIndex =
      selectedIndex >= nextPicks.length ? nextPicks.length - 1 : selectedIndex;

    setSelectedId(nextPicks[fallbackIndex]?._id || null);
  };

  return (
    <section className="admin-places-page">
      <div className="admin-page-head">
        <div>
          <h1>Travel Picks</h1>
          <p>Manage your packages</p>
        </div>
      </div>

      <div className="admin-place-grid">
        {picks.map((pick) => (
          <div
            key={pick._id}
            className="admin-place-grid__item"
            onClick={() => setSelectedId(pick._id)}
          >
            <img src={getImageSrc(pick.imageUrl)} alt={pick.title} />

            <div className="admin-place-grid__overlay">
              <div className="admin-place-grid__stats">
                <span>{pick.title}</span>
              </div>
            </div>

            {!pick.isPublished && (
              <span className="admin-place-grid__hidden-badge">Hidden</span>
            )}
          </div>
        ))}
      </div>

      {selectedPick && (
        <TravelPickModal
          pickId={selectedPick._id}
          onClose={() => setSelectedId(null)}
          onTravelPickUpdated={handlePickUpdated}
          onTravelPickDeleted={handlePickDeleted}
          onPrev={
            selectedIndex > 0
              ? () => setSelectedId(picks[selectedIndex - 1]._id)
              : undefined
          }
          onNext={
            selectedIndex < picks.length - 1
              ? () => setSelectedId(picks[selectedIndex + 1]._id)
              : undefined
          }
        />
      )}
    </section>
  );
}