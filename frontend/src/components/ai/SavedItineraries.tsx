"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";

type Itinerary = {
  _id: string;
  mood: string;
  selectedPlaces: string[];
  days: number;
  itineraryText: string;
  createdAt: string;
};

export default function SavedItineraries() {
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItineraries = async () => {
    try {
      const res = await api.get("/ai/saved-itineraries");
      setItineraries(res.data.itineraries || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItineraries();
  }, []);

  if (loading) return <p>Loading saved itineraries...</p>;

  if (itineraries.length === 0) {
    return <p>No saved itineraries yet.</p>;
  }

  return (
    <div className="saved-itineraries">
      <h2>Saved Itineraries</h2>

      <div className="saved-grid">
        {itineraries.map((item) => (
          <div key={item._id} className="saved-card">
            <h3>{item.mood} Trip</h3>

            <p>
              <strong>Places:</strong> {item.selectedPlaces.join(", ")}
            </p>

            <p>
              <strong>Days:</strong> {item.days}
            </p>

            <p className="saved-preview">
              {item.itineraryText.slice(0, 120)}...
            </p>

            <button
              onClick={() =>
                alert(item.itineraryText)
              }
            >
              View Full
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}