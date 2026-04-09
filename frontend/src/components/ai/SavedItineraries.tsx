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

    const handleSaved = () => fetchItineraries();
    window.addEventListener("itinerarySaved", handleSaved);

    return () => window.removeEventListener("itinerarySaved", handleSaved);
  }, []);

  const handleViewFull = (item: Itinerary) => {
    setSelectedItinerary(item);
    setShowFullModal(true);
  };

  const handleOpenSendModal = (item: Itinerary) => {
    setSelectedItinerary(item);
    setShowSendModal(true);
  };

  const handleCloseFullModal = () => {
    setShowFullModal(false);
    setSelectedItinerary(null);
  };

  const handleCloseSendModal = () => {
    setShowSendModal(false);
    setSelectedItinerary(null);
  };

  const handleDeleteItinerary = async (id: string) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this saved itinerary?"
    );

    if (!confirmDelete) return;

    try {
      setDeleteLoadingId(id);

      // correct backend route
      await api.delete(`/itineraries/my-itineraries/${id}`);

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
      <div className="saved-itinerary-grid">
        {itineraries.map((item) => (
          <div key={item._id} className="saved-itinerary-card">
            <div className="saved-itinerary-card-top">
              <div>
                <p className="saved-itinerary-label">Mood</p>
                <h3>{item.mood}</h3>
              </div>

              <span className="saved-itinerary-days">{item.days} Days</span>
            </div>

            <div className="saved-itinerary-meta">
              <span>
                {item.selectedPlaces?.slice(0, 3).join(", ")}
                {item.selectedPlaces?.length > 3 ? "..." : ""}
              </span>
            </div>

            <p className="saved-itinerary-text">
              {item.itineraryText?.length > 180
                ? `${item.itineraryText.slice(0, 180)}...`
                : item.itineraryText}
            </p>

            <div className="saved-itinerary-footer">
              <span className="saved-itinerary-date">
                {new Date(item.createdAt).toLocaleDateString()}
              </span>

              <div className="saved-itinerary-actions">
                <button
                  type="button"
                  className="saved-itinerary-btn outline"
                  onClick={() => handleViewFull(item)}
                >
                  View
                </button>

                <button
                  type="button"
                  className="saved-itinerary-btn fill"
                  onClick={() => handleOpenSendModal(item)}
                >
                  Send to Admin
                </button>

                <button
                  type="button"
                  className="saved-itinerary-btn danger"
                  onClick={() => handleDeleteItinerary(item._id)}
                  disabled={deleteLoadingId === item._id}
                >
                  {deleteLoadingId === item._id ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showFullModal && selectedItinerary && (
  <div
    className="saved-itinerary-modal-backdrop"
    onClick={handleCloseFullModal}
  >
    <div
      className="saved-itinerary-modal"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        className="saved-itinerary-modal__close"
        onClick={handleCloseFullModal}
      >
        ×
      </button>

      <div className="saved-itinerary-modal__header">
        <div>
          <p className="saved-itinerary-label">Mood</p>
          <h2>{selectedItinerary.mood} Trip</h2>
        </div>

        <span className="saved-itinerary-modal__days">
          {selectedItinerary.days} Days
        </span>
      </div>

      <div className="saved-itinerary-modal__meta-grid">
        <div className="saved-itinerary-modal__meta-card">
          <span className="saved-itinerary-modal__meta-label">Places</span>
          <p>{selectedItinerary.selectedPlaces?.join(", ") || "No places selected"}</p>
        </div>

        <div className="saved-itinerary-modal__meta-card">
          <span className="saved-itinerary-modal__meta-label">People</span>
          <p>{selectedItinerary.peopleCount}</p>
        </div>

        <div className="saved-itinerary-modal__meta-card">
          <span className="saved-itinerary-modal__meta-label">Date</span>
          <p>{selectedItinerary.specificDate || "Flexible"}</p>
        </div>
      </div>

      <div className="saved-itinerary-modal__section">
        <h4>Full Itinerary</h4>
        <div className="saved-itinerary-modal__content">
          {selectedItinerary.itineraryText}
        </div>
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
      setShowSendModal(false);
      setSelectedItinerary(null);
    }}
    itineraryId={selectedItinerary._id}
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