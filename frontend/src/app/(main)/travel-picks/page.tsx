"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/lib/axios";
import { useRouter } from "next/navigation";
import { FiHeart, FiMessageCircle } from "react-icons/fi";
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
};

export default function TravelPicksPage() {
  const [travelPicks, setTravelPicks] = useState<TravelPick[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTravelPicks = async () => {
      try {
        const res = await api.get("/travel-picks");
        setTravelPicks(res.data?.travelPicks || []);
      } catch (error) {
        console.error("Failed to load travel picks:", error);
        setTravelPicks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTravelPicks();
  }, []);

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
      <div className="travel-picks-head">
        <h1>Travel Picks</h1>
        <p>Handpicked group travel packages curated just for you.</p>
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