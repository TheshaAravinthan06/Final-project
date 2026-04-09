"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/lib/axios";

type BookingItinerary = {
  _id: string;
  name: string;
  email: string;
  phoneNumber: string;
  mood: string;
  status: string;
  adminNote?: string;
  selectedPlaces: string[];
  days: number;
  adults?: number;
  children?: number;
  accommodationType?: string;
  foodType?: string;
  transportPreference?: string;
  budgetPreference?: string;
  notes?: string;
  itineraryText: string;
  createdAt: string;
};

type DaySection = {
  title: string;
  content: string;
};

const splitItineraryByDays = (text: string): DaySection[] => {
  if (!text) return [];

  const cleaned = text.replace(/\r\n/g, "\n").trim();
  const matches = [...cleaned.matchAll(/(Day\s*\d+\s*:?[^\n]*)/gi)];

  if (matches.length === 0) {
    return [{ title: "Trip Plan", content: cleaned }];
  }

  return matches.map((match, index) => {
    const title = match[0].trim();
    const start = match.index ?? 0;
    const end =
      index + 1 < matches.length
        ? matches[index + 1].index ?? cleaned.length
        : cleaned.length;

    const fullSection = cleaned.slice(start, end).trim();
    const content = fullSection.replace(title, "").trim();

    return {
      title,
      content,
    };
  });
};

export default function SentToAdminList() {
  const [items, setItems] = useState<BookingItinerary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<BookingItinerary | null>(null);
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);

  const fetchSent = async () => {
    try {
      setLoading(true);
      const res = await api.get("/booking-itineraries/user");
      setItems(res.data.bookings || res.data.itineraries || []);
    } catch (error) {
      console.error("Failed to fetch sent itineraries:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSent();
  }, []);

  const handleView = (item: BookingItinerary) => {
    setSelectedItem(item);
  };

  const handleCloseModal = () => {
    setSelectedItem(null);
  };

  const handleDelete = async (id: string) => {
    const ok = window.confirm("Are you sure you want to delete this sent itinerary?");
    if (!ok) return;

    try {
      setDeleteLoadingId(id);
      await api.delete(`/booking-itineraries/${id}`);
      setItems((prev) => prev.filter((item) => item._id !== id));

      if (selectedItem?._id === id) {
        setSelectedItem(null);
      }
    } catch (error: any) {
      console.error("Delete sent itinerary failed:", error?.response?.data || error);
      alert(error?.response?.data?.message || "Failed to delete sent itinerary.");
    } finally {
      setDeleteLoadingId(null);
    }
  };

  const daySections = useMemo(() => {
    if (!selectedItem?.itineraryText) return [];
    return splitItineraryByDays(selectedItem.itineraryText);
  }, [selectedItem]);

  if (loading) {
    return (
      <div className="sent-admin-wrap">
        <h2>Sent to Admin</h2>
        <p>Loading sent itineraries...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="sent-admin-wrap empty">
        <h2>Sent to Admin</h2>
        <p>No itineraries sent to admin yet.</p>
      </div>
    );
  }

  return (
    <>
      <div className="sent-admin-wrap">
        <div className="sent-admin-scroll">
          <div className="sent-admin-grid">
            {items.map((item) => (
              <div key={item._id} className="sent-admin-card">
                <div className="sent-admin-top">
                  <div>
                    <p className="sent-admin-label">Trip Request</p>
                    <h3>{item.mood} Trip</h3>
                  </div>

                  <span className={`sent-admin-status ${item.status}`}>
                    {item.status}
                  </span>
                </div>

                <div className="sent-admin-meta">
                  <p><strong>Places:</strong> {item.selectedPlaces?.join(", ")}</p>
                  <p><strong>Days:</strong> {item.days}</p>
                  <p><strong>Adults:</strong> {item.adults ?? "-"}</p>
                  <p><strong>Children:</strong> {item.children ?? 0}</p>
                  <p><strong>Accommodation:</strong> {item.accommodationType || "-"}</p>
                  <p><strong>Food:</strong> {item.foodType || "-"}</p>
                  <p><strong>Transport:</strong> {item.transportPreference || "-"}</p>
                  <p><strong>Budget:</strong> {item.budgetPreference || "-"}</p>
                </div>

                <div className="sent-admin-preview">
                  <h4>Itinerary Preview</h4>
                  <p>
                    {item.itineraryText?.length > 180
                      ? `${item.itineraryText.slice(0, 180)}...`
                      : item.itineraryText}
                  </p>
                </div>

                {item.notes ? (
                  <div className="sent-admin-note user-note">
                    <span>Your Notes</span>
                    <p>{item.notes}</p>
                  </div>
                ) : null}

                {item.adminNote ? (
                  <div className="sent-admin-note admin-note">
                    <span>Admin Note</span>
                    <p>{item.adminNote}</p>
                  </div>
                ) : null}

                <div className="sent-admin-actions">
                  <button
                    type="button"
                    className="sent-admin-btn outline"
                    onClick={() => handleView(item)}
                  >
                    View
                  </button>

                  <button
                    type="button"
                    className="sent-admin-btn danger"
                    onClick={() => handleDelete(item._id)}
                    disabled={deleteLoadingId === item._id}
                  >
                    {deleteLoadingId === item._id ? "Deleting..." : "Delete"}
                  </button>
                </div>

                <div className="sent-admin-footer">
                  <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedItem && (
        <div className="sent-admin-modal-backdrop" onClick={handleCloseModal}>
          <div
            className="sent-admin-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="sent-admin-modal-close"
              onClick={handleCloseModal}
            >
              ×
            </button>

            <div className="sent-admin-modal-top">
              <div>
                <p className="sent-admin-label">Trip Request</p>
                <h2>{selectedItem.mood} Trip</h2>
              </div>

              <span className={`sent-admin-status ${selectedItem.status}`}>
                {selectedItem.status}
              </span>
            </div>

            <div className="sent-admin-modal-meta">
              <div className="sent-admin-modal-meta-card">
                <span>Places</span>
                <p>{selectedItem.selectedPlaces?.join(", ")}</p>
              </div>

              <div className="sent-admin-modal-meta-card">
                <span>Days</span>
                <p>{selectedItem.days}</p>
              </div>

              <div className="sent-admin-modal-meta-card">
                <span>Email</span>
                <p>{selectedItem.email}</p>
              </div>

              <div className="sent-admin-modal-meta-card">
                <span>Phone</span>
                <p>{selectedItem.phoneNumber}</p>
              </div>

              <div className="sent-admin-modal-meta-card">
                <span>Adults</span>
                <p>{selectedItem.adults ?? "-"}</p>
              </div>

              <div className="sent-admin-modal-meta-card">
                <span>Children</span>
                <p>{selectedItem.children ?? 0}</p>
              </div>
            </div>

            <div className="sent-admin-modal-section">
              <h4>Full Itinerary</h4>

              <div className="sent-admin-days-list">
                {daySections.map((section, index) => (
                  <div key={index} className="sent-admin-day-card">
                    <div className="sent-admin-day-card-header">
                      <span className="sent-admin-day-badge">{section.title}</span>
                    </div>
                    <div className="sent-admin-day-card-content">
                      {section.content || "No details added for this day."}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selectedItem.notes ? (
              <div className="sent-admin-note user-note">
                <span>Your Notes</span>
                <p>{selectedItem.notes}</p>
              </div>
            ) : null}

            {selectedItem.adminNote ? (
              <div className="sent-admin-note admin-note">
                <span>Admin Note</span>
                <p>{selectedItem.adminNote}</p>
              </div>
            ) : null}

            <div className="sent-admin-modal-actions">
              <button
                type="button"
                className="sent-admin-btn danger"
                onClick={() => handleDelete(selectedItem._id)}
                disabled={deleteLoadingId === selectedItem._id}
              >
                {deleteLoadingId === selectedItem._id ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}