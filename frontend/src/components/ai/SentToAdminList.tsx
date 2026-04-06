"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";

type SentBooking = {
  _id: string;
  itineraryText: string;
  mood: string;
  selectedPlaces: string[];
  days: number;
  specificDate: string;
  peopleCount: number;
  name: string;
  phoneNumber: string;
  email: string;
  adults: number;
  children: number;
  accommodationType: string;
  foodType: string;
  budgetPreference: string;
  preferredTransport: string;
  status: "pending" | "reviewed" | "approved" | "rejected";
  createdAt: string;
};

export default function SentToAdminList() {
  const [items, setItems] = useState<SentBooking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSentItineraries = async () => {
    try {
      setLoading(true);
      const res = await api.get("/booking-itineraries/user");
      setItems(res.data.bookings || []);
    } catch (error) {
      console.error("fetch sent itineraries error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSentItineraries();

    const handler = () => fetchSentItineraries();
    window.addEventListener("bookingItinerarySent", handler);

    return () => window.removeEventListener("bookingItinerarySent", handler);
  }, []);

  if (loading) {
    return (
      <div className="sent-admin-list">
        <h2>Sent to Admin</h2>
        <p>Loading sent itineraries...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="sent-admin-list empty">
        <h2>Sent to Admin</h2>
        <p>No itineraries sent to admin yet.</p>
      </div>
    );
  }

  return (
    <div className="sent-admin-list">
      <h2>Sent to Admin</h2>

      <div className="sent-admin-grid">
        {items.map((item) => (
          <div key={item._id} className="sent-admin-card">
            <div className="sent-admin-card__top">
              <div>
                <h3>{item.name}</h3>
                <p>{item.mood} trip</p>
              </div>

              <span className={`status-badge ${item.status}`}>
                {item.status}
              </span>
            </div>

            <div className="sent-admin-card__meta">
              <p>
                <strong>Email:</strong> {item.email}
              </p>
              <p>
                <strong>Phone:</strong> {item.phoneNumber}
              </p>
              <p>
                <strong>Places:</strong> {item.selectedPlaces.join(", ")}
              </p>
              <p>
                <strong>Days:</strong> {item.days}
              </p>
              <p>
                <strong>Adults:</strong> {item.adults}
              </p>
              <p>
                <strong>Children:</strong> {item.children}
              </p>
              <p>
                <strong>Accommodation:</strong> {item.accommodationType}
              </p>
              <p>
                <strong>Food:</strong> {item.foodType}
              </p>
              <p>
                <strong>Transport:</strong> {item.preferredTransport}
              </p>
              {item.budgetPreference && (
                <p>
                  <strong>Budget:</strong> {item.budgetPreference}
                </p>
              )}
            </div>

            <div className="sent-admin-card__preview">
              <strong>Itinerary Preview</strong>
              <p>
                {item.itineraryText.length > 180
                  ? `${item.itineraryText.slice(0, 180)}...`
                  : item.itineraryText}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}