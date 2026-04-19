"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import TravelPickCard from "@/components/home/TravelPickCard";

type TravelPick = {
  _id: string;
  title: string;
  place: string;
  imageUrl: string;
  startDate: string;
  endDate: string;
  price: number;
  isBookingOpen?: boolean;
  createdAt?: string;
  isSaved?: boolean;
  sourceType?: "manual" | "itinerary_request";
};

export default function TravelPicksPage() {
  const [travelPicks, setTravelPicks] = useState<TravelPick[]>([]);
  const [loading, setLoading] = useState(true);
  const [sourceFilter, setSourceFilter] = useState<
    "all" | "manual" | "itinerary_request"
  >("all");

  useEffect(() => {
    const fetchTravelPicks = async () => {
      try {
        setLoading(true);

        const query =
          sourceFilter === "all" ? "" : `?sourceType=${sourceFilter}`;

        const res = await api.get(`/travel-picks${query}`);
        setTravelPicks(res.data?.travelPicks || []);
      } catch (error) {
        console.error("Failed to load travel picks:", error);
        setTravelPicks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTravelPicks();
  }, [sourceFilter]);

  if (loading) {
    return (
      <section className="travel-picks-page">
        <div className="travel-picks-head">
          <h1>Travel Picks</h1>
          <p>Loading travel picks...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="travel-picks-page">
      <div className="travel-picks-page__header">
        <h1>Travel Picks</h1>
        <p>Handpicked group travel packages curated just for you.</p>
      </div>

      <div className="travel-picks-filter">
        <button
          type="button"
          className={sourceFilter === "all" ? "is-active" : ""}
          onClick={() => setSourceFilter("all")}
        >
          All Packages
        </button>

        <button
          type="button"
          className={sourceFilter === "manual" ? "is-active" : ""}
          onClick={() => setSourceFilter("manual")}
        >
          Admin Packages
        </button>

        <button
          type="button"
          className={sourceFilter === "itinerary_request" ? "is-active" : ""}
          onClick={() => setSourceFilter("itinerary_request")}
        >
          From User Requests
        </button>
      </div>

      <div className="travel-picks-grid">
        {travelPicks.length === 0 ? (
          <p className="travel-picks-empty">No travel picks available right now.</p>
        ) : (
          travelPicks.map((pick) => (
            <TravelPickCard key={pick._id} pick={pick} />
          ))
        )}
      </div>
    </section>
  );
}