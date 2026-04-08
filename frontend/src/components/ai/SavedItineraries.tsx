"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import SendItineraryModal from "@/components/ai/SendItineraryModal";

type SelectedActivity = {
  place: string;
  activities: string[];
};

type Itinerary = {
  _id: string;
  mood: string;
  selectedPlaces: string[];
  selectedActivities: SelectedActivity[];
  days: number;
  specificDate?: string;
  peopleCount: number;
  travelCompanions: string[];
  customCompanionNote?: string;
  extraNotes?: string;
  itineraryText: string;
  createdAt: string;
};

export default function SavedItineraries() {
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItinerary, setSelectedItinerary] = useState<Itinerary | null>(null);
  const [showFullModal, setShowFullModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);

  const fetchItineraries = async () => {
    try {
      setLoading(true);
      const res = await api.get("/ai/saved-itineraries");
      setItineraries(res.data.itineraries || []);
    } catch (error: any) {
      console.error("Failed to fetch saved itineraries:", error?.response?.data || error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItineraries();
  }, []);

  const handleViewFull = (item: Itinerary) => {
    setSelectedItinerary(item);
    setShowFullModal(true);
  };

  const handleOpenSendModal = (item: Itinerary) => {
    setSelectedItinerary(item);
    setShowSendModal(true);
  };

  const handleDeleteItinerary = async (id: string) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this saved itinerary?"
    );

    if (!confirmDelete) return;

    try {
      setDeleteLoadingId(id);
      await api.delete(`/itineraries/${id}`);

      setItineraries((prev) => prev.filter((item) => item._id !== id));

      if (selectedItinerary?._id === id) {
        setSelectedItinerary(null);
        setShowFullModal(false);
        setShowSendModal(false);
      }
    } catch (error: any) {
      console.error("Failed to delete itinerary:", error?.response?.data || error);
      alert(error?.response?.data?.message || "Failed to delete itinerary.");
    } finally {
      setDeleteLoadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="saved-itineraries">
        <h2>Saved Itineraries</h2>
        <p>Loading saved itineraries...</p>
      </div>
    );
  }

  if (itineraries.length === 0) {
    return (
      <div className="saved-itineraries empty">
        <h2>Saved Itineraries</h2>
        <p>No saved itineraries yet.</p>
      </div>
    );
  }

  return (
    <>
      <div className="saved-itineraries">
        <h2>Saved Itineraries</h2>

        <div className="saved-grid">
          {itineraries.map((item) => (
            <div key={item._id} className="saved-card">
              <div className="saved-card__top">
                <h3>{item.mood} Trip</h3>
                <span>{new Date(item.createdAt).toLocaleDateString()}</span>
              </div>

              <p>
                <strong>Places:</strong>{" "}
                {item.selectedPlaces?.length
                  ? item.selectedPlaces.join(", ")
                  : "No places selected"}
              </p>

              <p>
                <strong>Days:</strong> {item.days}
              </p>

              <p>
                <strong>People:</strong> {item.peopleCount}
              </p>

              {item.specificDate ? (
                <p>
                  <strong>Date:</strong> {item.specificDate}
                </p>
              ) : null}

              <p className="saved-preview">
                {item.itineraryText.length > 140
                  ? `${item.itineraryText.slice(0, 140)}...`
                  : item.itineraryText}
              </p>

              <div className="saved-card__actions saved-itinerary-card__actions">
                <button
                  type="button"
                  className="view-btn"
                  onClick={() => handleViewFull(item)}
                >
                  View Full
                </button>

                <button
                  type="button"
                  className="delete-btn"
                  onClick={() => handleDeleteItinerary(item._id)}
                  disabled={deleteLoadingId === item._id}
                >
                  {deleteLoadingId === item._id ? "Deleting..." : "Delete"}
                </button>

                <button
                  type="button"
                  className="send-btn"
                  onClick={() => handleOpenSendModal(item)}
                >
                  Send to Admin
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showFullModal && selectedItinerary && (
        <div
          className="saved-itinerary-modal-backdrop"
          onClick={() => {
            setShowFullModal(false);
            setSelectedItinerary(null);
          }}
        >
          <div
            className="saved-itinerary-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="saved-itinerary-modal__close"
              onClick={() => {
                setShowFullModal(false);
                setSelectedItinerary(null);
              }}
            >
              ×
            </button>

            <h2>{selectedItinerary.mood} Trip</h2>

            <div className="saved-itinerary-modal__meta">
              <span>
                <strong>Places:</strong>{" "}
                {selectedItinerary.selectedPlaces?.join(", ") || "No places selected"}
              </span>
              <span>
                <strong>Days:</strong> {selectedItinerary.days}
              </span>
              <span>
                <strong>People:</strong> {selectedItinerary.peopleCount}
              </span>
              {selectedItinerary.specificDate ? (
                <span>
                  <strong>Date:</strong> {selectedItinerary.specificDate}
                </span>
              ) : null}
            </div>

            <div className="saved-itinerary-modal__content">
              {selectedItinerary.itineraryText}
            </div>

            <div className="saved-itinerary-modal__actions">
              <button
                type="button"
                className="delete-btn"
                onClick={() => handleDeleteItinerary(selectedItinerary._id)}
                disabled={deleteLoadingId === selectedItinerary._id}
              >
                {deleteLoadingId === selectedItinerary._id ? "Deleting..." : "Delete"}
              </button>

              <button
                type="button"
                className="send-btn"
                onClick={() => {
                  setShowFullModal(false);
                  setShowSendModal(true);
                }}
              >
                Send to Admin
              </button>
            </div>
          </div>
        </div>
      )}

      {showSendModal && selectedItinerary && (
        <SendItineraryModal
          isOpen={showSendModal}
          onClose={() => {
            setShowSendModal(false);
            setSelectedItinerary(null);
          }}
          onSuccess={() => {
            setItineraries((prev) =>
              prev.filter((item) => item._id !== selectedItinerary._id)
            );
          }}
          itineraryText={selectedItinerary.itineraryText}
          mood={selectedItinerary.mood}
          selectedPlaces={selectedItinerary.selectedPlaces || []}
          selectedActivities={selectedItinerary.selectedActivities || []}
          days={selectedItinerary.days}
          specificDate={selectedItinerary.specificDate || ""}
          peopleCount={selectedItinerary.peopleCount}
          travelCompanions={selectedItinerary.travelCompanions || []}
          customCompanionNote={selectedItinerary.customCompanionNote || ""}
          extraNotes={selectedItinerary.extraNotes || ""}
        />
      )}
    </>
  );
}