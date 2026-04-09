"use client";

import { FormEvent, useState } from "react";
import api from "@/lib/axios";

type SelectedActivity = {
  place: string;
  activities: string[];
};

type SendItineraryModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  itineraryId?: string;
  itineraryText: string;
  mood: string;
  selectedPlaces: string[];
  selectedActivities: SelectedActivity[];
  days: number;
  specificDate?: string;
  peopleCount: number;
  travelCompanions: string[];
  customCompanionNote?: string;
  extraNotes?: string;
};

export default function SendItineraryModal({
  isOpen,
  onClose,
  onSuccess,
  itineraryId,
  itineraryText,
  mood,
  selectedPlaces,
  selectedActivities,
  days,
  specificDate = "",
  peopleCount,
  travelCompanions,
  customCompanionNote = "",
  extraNotes = "",
}: SendItineraryModalProps) {
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [adults, setAdults] = useState(peopleCount || 1);
  const [children, setChildren] = useState(0);
  const [accommodationType, setAccommodationType] = useState("Hotel / Rooms");
  const [foodType, setFoodType] = useState("Non-Veg");
  const [transportPreference, setTransportPreference] = useState("Car");
  const [budgetPreference, setBudgetPreference] = useState("10,000 - 20,000");
  const [notes, setNotes] = useState(extraNotes || "");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      await api.post("/booking-itineraries", {
        name,
        phoneNumber,
        email,
        mood,
        itineraryText,
        selectedPlaces,
        selectedActivities,
        days,
        specificDate,
        peopleCount,
        travelCompanions,
        customCompanionNote,
        extraNotes,
        adults,
        children,
        accommodationType,
        foodType,
        transportPreference,
        budgetPreference,
        notes,
      });

      // remove from saved itineraries too
      if (itineraryId) {
        try {
          await api.delete(`/itineraries/my-itineraries/${itineraryId}`);
        } catch (deleteError) {
          console.error("Failed to remove saved itinerary after send:", deleteError);
        }
      }

      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error("send itinerary modal error:", error?.response?.data || error);
      alert(error?.response?.data?.message || "Failed to send itinerary to admin");
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
          className="send-itinerary-close"
          onClick={onClose}
        >
          ×
        </button>

        <div className="send-itinerary-header">
          <h2>Send to Admin</h2>
          <p>Add your trip details so our team can review your request.</p>
        </div>

        <form className="send-itinerary-form" onSubmit={handleSubmit}>
          <div className="send-itinerary-grid">
            <div className="send-itinerary-preview">
              <h4>Itinerary Preview</h4>

              <div className="send-itinerary-preview-box">
                <p>{itineraryText}</p>
              </div>

              <div className="send-itinerary-tags">
                <span>Mood: {mood}</span>
                <span>Days: {days}</span>
                <span>People: {peopleCount}</span>
              </div>
            </div>

            <div className="send-itinerary-fields">
              <h4>Travel Preferences</h4>

              <div className="send-itinerary-row">
                <input
                  type="text"
                  placeholder="Full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="send-itinerary-row">
                <input
                  type="text"
                  placeholder="Phone number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                />
                <input
                  type="text"
                  placeholder="Specific date (optional)"
                  value={specificDate}
                  readOnly
                />
              </div>

              <div className="send-itinerary-row">
                <div className="field-block">
                  <label>Adults</label>
                  <input
                    type="number"
                    min={1}
                    value={adults}
                    onChange={(e) => setAdults(Number(e.target.value))}
                  />
                </div>

                <div className="field-block">
                  <label>Children</label>
                  <input
                    type="number"
                    min={0}
                    value={children}
                    onChange={(e) => setChildren(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="send-itinerary-row">
                <div className="field-block">
                  <label>Accommodation Type</label>
                  <select
                    value={accommodationType}
                    onChange={(e) => setAccommodationType(e.target.value)}
                  >
                    <option>Hotel / Rooms</option>
                    <option>Villa</option>
                    <option>Resort</option>
                    <option>Guest House</option>
                  </select>
                </div>

                <div className="field-block">
                  <label>Food Type</label>
                  <select
                    value={foodType}
                    onChange={(e) => setFoodType(e.target.value)}
                  >
                    <option>Non-Veg</option>
                    <option>Veg</option>
                    <option>Mixed</option>
                  </select>
                </div>
              </div>

              <div className="field-block full">
                <label>Notes / Questions</label>
                <textarea
                  placeholder="Any notes, special requests or questions?"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="send-itinerary-row">
                <div className="field-block">
                  <label>Budget Preference</label>
                  <select
                    value={budgetPreference}
                    onChange={(e) => setBudgetPreference(e.target.value)}
                  >
                    <option>10,000 - 20,000</option>
                    <option>20,000 - 40,000</option>
                    <option>40,000 - 60,000</option>
                    <option>60,000+</option>
                  </select>
                </div>

                <div className="field-block">
                  <label>Preferred Transport</label>
                  <select
                    value={transportPreference}
                    onChange={(e) => setTransportPreference(e.target.value)}
                  >
                    <option>Car</option>
                    <option>Van</option>
                    <option>Bus</option>
                    <option>Train</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="send-itinerary-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? "Sending..." : "Send to Admin"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}