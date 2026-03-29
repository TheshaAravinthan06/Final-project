"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/lib/axios";
import { FiHeart, FiMessageCircle, FiPlus } from "react-icons/fi";
import PlaceAdminModal from "@/components/admin/ PlaceAdminModal";
import AddPlaceModal, { AdminPlace } from "@/components/admin/AddPlaceModal";

type PlaceComment = {
  _id: string;
  text: string;
  createdAt: string;
  replyTo?: string | null;
  isAdminReply?: boolean;
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
  likesCount: number;
  commentsCount: number;
  savesCount?: number;
  isPublished: boolean;
  comments: PlaceComment[];
  createdAt: string;
};

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

const getImageSrc = (imageUrl?: string) => {
  if (!imageUrl) return "/images/ella.jpg";
  if (imageUrl.startsWith("http")) return imageUrl;
  return `${BACKEND_URL}${imageUrl}`;
};

export default function AdminPlacesPage() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlaces = async () => {
      try {
        const res = await api.get("/places/admin/all");
        setPlaces(res.data.places || []);
      } catch (error) {
        console.error("Failed to load admin places:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlaces();
  }, []);

  const selectedIndex = useMemo(
    () => places.findIndex((item) => item._id === selectedPlaceId),
    [places, selectedPlaceId]
  );

  const selectedPlace =
    selectedIndex >= 0 && selectedIndex < places.length
      ? places[selectedIndex]
      : null;

  const handlePlaceUpdated = (updatedPlace: Place) => {
    setPlaces((prev) =>
      prev.map((item) => (item._id === updatedPlace._id ? updatedPlace : item))
    );
  };

  const handlePlaceDeleted = (placeId: string) => {
    const nextPlaces = places.filter((item) => item._id !== placeId);
    setPlaces(nextPlaces);

    if (!nextPlaces.length) {
      setSelectedPlaceId(null);
      return;
    }

    const fallbackIndex =
      selectedIndex >= nextPlaces.length ? nextPlaces.length - 1 : selectedIndex;

    setSelectedPlaceId(nextPlaces[fallbackIndex]?._id || null);
  };

  const handlePlaceCreated = (newPlace: AdminPlace) => {
    setPlaces((prev) => [newPlace as Place, ...prev]);
  };

  if (loading) {
    return (
      <section className="admin-places-page">
        <div className="admin-page-head">
          <div>
            <h1>Places Posts</h1>
            <p>Loading admin places...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="admin-places-page">
      <div className="admin-page-head">
        <div>
          <h1>Places Posts</h1>
          <p>Hover to see likes and comments. Click any post to manage it.</p>
        </div>

        <button
          type="button"
          className="admin-page-add-btn"
          onClick={() => setShowAddModal(true)}
        >
          <FiPlus />
          Add Place
        </button>
      </div>

      <div className="admin-place-grid">
        {places.map((place) => (
          <button
            key={place._id}
            type="button"
            className="admin-place-grid__item"
            onClick={() => setSelectedPlaceId(place._id)}
          >
            <img src={getImageSrc(place.imageUrl)} alt={place.placeName} />

            <div className="admin-place-grid__overlay">
              <div className="admin-place-grid__stats">
                <span>
                  <FiHeart />
                  {place.likesCount || 0}
                </span>
                <span>
                  <FiMessageCircle />
                  {place.commentsCount || 0}
                </span>
              </div>
            </div>

            {!place.isPublished && (
              <span className="admin-place-grid__hidden-badge">Hidden</span>
            )}
          </button>
        ))}
      </div>

      {showAddModal && (
        <AddPlaceModal
          onClose={() => setShowAddModal(false)}
          onPlaceCreated={handlePlaceCreated}
        />
      )}

      {selectedPlace && (
        <PlaceAdminModal
          placeId={selectedPlace._id}
          onClose={() => setSelectedPlaceId(null)}
          onPlaceUpdated={handlePlaceUpdated}
          onPlaceDeleted={handlePlaceDeleted}
          onPrev={
            selectedIndex > 0
              ? () => setSelectedPlaceId(places[selectedIndex - 1]._id)
              : undefined
          }
          onNext={
            selectedIndex < places.length - 1
              ? () => setSelectedPlaceId(places[selectedIndex + 1]._id)
              : undefined
          }
        />
      )}
    </section>
  );
}