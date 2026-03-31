"use client";

import { useEffect, useState } from "react";
import TravelPickCard from "@/components/home/TravelPickCard";
import api from "@/lib/axios";

type TravelPick = {
  _id: string;
  title: string;
  place: string;
  imageUrl: string;
  startDate: string;
  endDate: string;
  price: number;
  isBookingOpen: boolean;
  createdAt?: string;
};

export default function TravelPicksPage() {
  const [travelPicks, setTravelPicks] = useState<TravelPick[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTravelPicks = async () => {
      try {
        setLoading(true);
        const res = await api.get("/travel-picks");
        setTravelPicks(res.data.travelPicks || []);
      } catch (error) {
        console.error("Failed to load travel picks:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTravelPicks();
  }, []);

  return (
    <section className="travel-picks-page">
      <div className="travel-picks-page__header">
        <div>
          <span className="travel-picks-page__eyebrow">Travel Picks</span>
          <h1>Book your trips here </h1>
          <p>Browse the latest travel picks and choose the package you want next.</p>
        </div>
      </div>

      {loading ? (
        <div className="travel-picks-page__state">Loading travel picks...</div>
      ) : !travelPicks.length ? (
        <div className="travel-picks-page__state">
          No travel picks available right now.
        </div>
      ) : (
        <div className="travel-picks-grid">
          {travelPicks.map((pick) => (
            <TravelPickCard key={pick._id} pick={pick} />
          ))}
        </div>
      )}
    </section>
  );
}