"use client";

import { FormEvent, useState } from "react";
import api from "@/lib/axios";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  itineraryText: string;
  mood: string;
  selectedPlaces: string[];
  selectedActivities: { place: string; activities: string[] }[];
  days: number;
  specificDate: string;
  peopleCount: number;
  travelCompanions: string[];
  customCompanionNote: string;
  extraNotes: string;
};

export default function SendItineraryModal({
  isOpen,
  onClose,
  onSuccess,
  itineraryText,
  mood,
  selectedPlaces,
  selectedActivities,
  days,
  specificDate,
  peopleCount,
  travelCompanions,
  customCompanionNote,
  extraNotes,
}: Props) {
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [adults, setAdults] = useState("1");
  const [children, setChildren] = useState("0");
  const [accommodationType, setAccommodationType] = useState("hotel");
  const [foodType, setFoodType] = useState("non_veg");
  const [budgetPreference, setBudgetPreference] = useState("");
  const [preferredTransport, setPreferredTransport] = useState("car");

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      await api.post("/booking-itineraries", {
        itineraryText,
        mood,
        selectedPlaces,
        selectedActivities,
        days,
        specificDate,
        peopleCount,
        travelCompanions,
        customCompanionNote,
        extraNotes,
        name,
        phoneNumber,
        email,
        adults: Number(adults),
        children: Number(children),
        accommodationType,
        foodType,
        budgetPreference,
        preferredTransport,
      });

      window.dispatchEvent(new Event("bookingItinerarySent"));
      onSuccess();
      onClose();
    } catch (error) {
      console.error("send itinerary modal error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="send-itinerary-modal-backdrop">
      <div className="send-itinerary-modal">
        <button
          type="button"
          className="send-itinerary-modal__close"
          onClick={onClose}
        >
          ×
        </button>

        <h2>Send Itinerary to Admin</h2>

        <div className="send-itinerary-modal__preview">
          <h3>Your Itinerary</h3>
          <div className="send-itinerary-modal__itinerary-box">{itineraryText}</div>
        </div>

        <form onSubmit={handleSubmit} className="send-itinerary-modal__form">
          <input
            type="text"
            placeholder="Your name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <input
            type="text"
            placeholder="Phone number *"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            required
          />

          <input
            type="email"
            placeholder="Email *"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="number"
            placeholder="Adults"
            value={adults}
            onChange={(e) => setAdults(e.target.value)}
          />

          <input
            type="number"
            placeholder="Children"
            value={children}
            onChange={(e) => setChildren(e.target.value)}
          />

          <select
            value={accommodationType}
            onChange={(e) => setAccommodationType(e.target.value)}
          >
            <option value="hotel">Hotel</option>
            <option value="private_room">Room - Private</option>
            <option value="shared_room">Room - Shared</option>
            <option value="rented_house">Rented House</option>
            <option value="rest_inn">Rest Inn</option>
            <option value="dome">Dome</option>
            <option value="hostel">Hostel</option>
            <option value="camping">Camping</option>
          </select>

          <select value={foodType} onChange={(e) => setFoodType(e.target.value)}>
            <option value="veg">Veg</option>
            <option value="non_veg">Non Veg</option>
          </select>

          <input
            type="text"
            placeholder="Budget preference"
            value={budgetPreference}
            onChange={(e) => setBudgetPreference(e.target.value)}
          />

          <select
            value={preferredTransport}
            onChange={(e) => setPreferredTransport(e.target.value)}
          >
            <option value="car">Car</option>
            <option value="van">Van</option>
            <option value="bus">Bus</option>
          </select>

          <button type="submit" disabled={loading}>
            {loading ? "Sending..." : "Send to Admin"}
          </button>
        </form>
      </div>
    </div>
  );
}