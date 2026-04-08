"use client";

import { FormEvent, useState } from "react";
import api from "@/lib/axios";
import "@/styles/send-itinerary-modal.scss";

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
  const [accommodationType, setAccommodationType] = useState("hotel_or_rooms");
  const [foodType, setFoodType] = useState("non_veg");
  const [allergies, setAllergies] = useState("");
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
        allergies,
        budgetPreference,
        preferredTransport,
      });

      window.dispatchEvent(new Event("bookingItinerarySent"));
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("send itinerary modal error:", error?.response?.data || error);
      alert(error?.response?.data?.message || "Failed to send itinerary.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="send-itinerary-modal-backdrop" onClick={onClose}>
      <div
        className="send-itinerary-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="send-itinerary-modal__close"
          onClick={onClose}
        >
          ×
        </button>

        <div className="send-itinerary-modal__header">
          <h2>Send to Admin</h2>
          <p>
            Add your trip details so our team can review and help arrange your
            plan.
          </p>
        </div>

        <div className="send-itinerary-modal__body">
          <div className="send-itinerary-modal__preview">
            <h3>Itinerary Preview</h3>
            <div className="send-itinerary-modal__preview-box">
              <p>{itineraryText}</p>
            </div>

            <div className="send-itinerary-modal__trip-meta">
              <span>Mood: {mood}</span>
              <span>Days: {days}</span>
              <span>People: {peopleCount}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="send-itinerary-modal__form">
            <div className="send-itinerary-modal__section">
              <h4>Contact Details</h4>

              <div className="send-itinerary-modal__grid">
                <div className="field full">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div className="field">
                  <label>Phone Number *</label>
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Enter phone number"
                    required
                  />
                </div>

                <div className="field">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email address"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="send-itinerary-modal__section">
              <h4>Travel Preferences</h4>

              <div className="send-itinerary-modal__grid">
                <div className="field">
                  <label>Adults</label>
                  <input
                    type="number"
                    value={adults}
                    onChange={(e) => setAdults(e.target.value)}
                    min="0"
                  />
                </div>

                <div className="field">
                  <label>Children</label>
                  <input
                    type="number"
                    value={children}
                    onChange={(e) => setChildren(e.target.value)}
                    min="0"
                  />
                </div>

                <div className="field">
                  <label>Accommodation Type</label>
                  <select
                    value={accommodationType}
                    onChange={(e) => setAccommodationType(e.target.value)}
                  >
                    <option value="hotel_or_rooms">Hotel / Rooms</option>
                    <option value="rented_house">Rented House</option>
                    <option value="hostel_or_dorm">Hostel / Dorm</option>
                    <option value="camping">Camping</option>
                  </select>
                </div>

                <div className="field">
                  <label>Food Type</label>
                  <select
                    value={foodType}
                    onChange={(e) => setFoodType(e.target.value)}
                  >
                    <option value="veg">Veg</option>
                    <option value="non_veg">Non-Veg</option>
                  </select>
                </div>

                <div className="field full">
                  <label>Allergies / Food Notes</label>
                  <input
                    type="text"
                    value={allergies}
                    onChange={(e) => setAllergies(e.target.value)}
                    placeholder="If any allergies mention here"
                  />
                </div>

                <div className="field">
                  <label>Budget Preference</label>
                  <input
                    type="text"
                    value={budgetPreference}
                    onChange={(e) => setBudgetPreference(e.target.value)}
                    placeholder="Enter budget preference"
                  />
                </div>

                <div className="field">
                  <label>Preferred Transport</label>
                  <select
                    value={preferredTransport}
                    onChange={(e) => setPreferredTransport(e.target.value)}
                  >
                    <option value="car">Car</option>
                    <option value="van">Van</option>
                    <option value="bus">Bus</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="send-itinerary-modal__actions">
              <button
                type="button"
                className="secondary-btn"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>

              <button type="submit" className="primary-btn" disabled={loading}>
                {loading ? "Sending..." : "Send to Admin"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}