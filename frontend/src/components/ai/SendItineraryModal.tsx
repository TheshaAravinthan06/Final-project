"use client";

import { FormEvent, useEffect, useState } from "react";
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

  const [accommodationType, setAccommodationType] = useState("hotel_or_rooms");
  const [foodType, setFoodType] = useState("non_veg");
  const [transportPreference, setTransportPreference] = useState("car");
  const [budgetPreference, setBudgetPreference] = useState("10,000 - 20,000");
  const [notes, setNotes] = useState(extraNotes || "");

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setName("");
    setPhoneNumber("");
    setEmail("");
    setAdults(peopleCount || 1);
    setChildren(0);
    setAccommodationType("hotel_or_rooms");
    setFoodType("non_veg");
    setTransportPreference("car");
    setBudgetPreference("10,000 - 20,000");
    setNotes(extraNotes || "");
  }, [isOpen, peopleCount, extraNotes]);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();
    const trimmedPhone = phoneNumber.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName || !trimmedPhone || !trimmedEmail) {
      alert("Name, phone number, and email are required.");
      return;
    }

    try {
      setLoading(true);

      await api.post("/booking-itineraries", {
        name: trimmedName,
        phoneNumber: trimmedPhone,
        email: trimmedEmail,

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

      if (itineraryId) {
        try {
          await api.delete(`/itineraries/my-itineraries/${itineraryId}`);
        } catch (deleteError) {
          console.error(
            "Failed to remove saved itinerary after send:",
            deleteError
          );
        }
      }

      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error(
        "send itinerary modal error:",
        error?.response?.data || error
      );
      alert(
        error?.response?.data?.message || "Failed to send itinerary to admin"
      );
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
          aria-label="Close"
        >
          ×
        </button>

        <div className="send-itinerary-modal__header">
          <h2>Send to Admin</h2>
          <p>
            Add your details and travel preferences so our team can review your
            itinerary request.
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
              <span>Date: {specificDate || "Flexible"}</span>
            </div>
          </div>

          <form className="send-itinerary-modal__form" onSubmit={handleSubmit}>
            <div className="send-itinerary-modal__section">
              <h4>Contact Details</h4>

              <div className="send-itinerary-modal__grid">
                <div className="field">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    className="send-itinerary-modal__input"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="field">
                  <label>Email *</label>
                  <input
                    type="email"
                    className="send-itinerary-modal__input"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="field">
                  <label>Phone Number *</label>
                  <input
                    type="tel"
                    className="send-itinerary-modal__input"
                    placeholder="Enter your phone number"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                  />
                </div>

                <div className="field">
                  <label>Specific Date</label>
                  <input
                    type="text"
                    className="send-itinerary-modal__input"
                    value={specificDate || "Flexible"}
                    readOnly
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
                    className="send-itinerary-modal__input"
                    min={1}
                    value={adults}
                    onChange={(e) => setAdults(Number(e.target.value))}
                  />
                </div>

                <div className="field">
                  <label>Children</label>
                  <input
                    type="number"
                    className="send-itinerary-modal__input"
                    min={0}
                    value={children}
                    onChange={(e) => setChildren(Number(e.target.value))}
                  />
                </div>

                <div className="field">
                  <label>Accommodation Type</label>
                  <select
                    className="send-itinerary-modal__select"
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
                    className="send-itinerary-modal__select"
                    value={foodType}
                    onChange={(e) => setFoodType(e.target.value)}
                  >
                    <option value="non_veg">Non-Veg</option>
                    <option value="veg">Veg</option>
                  </select>
                </div>

                <div className="field">
                  <label>Budget Preference</label>
                  <select
                    className="send-itinerary-modal__select"
                    value={budgetPreference}
                    onChange={(e) => setBudgetPreference(e.target.value)}
                  >
                    <option value="10,000 - 20,000">10,000 - 20,000</option>
                    <option value="20,000 - 40,000">20,000 - 40,000</option>
                    <option value="40,000 - 60,000">40,000 - 60,000</option>
                    <option value="60,000+">60,000+</option>
                  </select>
                </div>

                <div className="field">
                  <label>Preferred Transport</label>
                  <select
                    className="send-itinerary-modal__select"
                    value={transportPreference}
                    onChange={(e) => setTransportPreference(e.target.value)}
                  >
                    <option value="car">Car</option>
                    <option value="van">Van</option>
                    <option value="bus">Bus</option>
                    <option value="train">Train</option>
                  </select>
                </div>

                <div className="field full">
                  <label>Notes / Questions</label>
                  <textarea
                    className="send-itinerary-modal__textarea"
                    placeholder="Any notes, special requests, or questions?"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                  />
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

              <button
                type="submit"
                className="primary-btn"
                disabled={
                  loading ||
                  !name.trim() ||
                  !phoneNumber.trim() ||
                  !email.trim()
                }
              >
                {loading ? "Sending..." : "Send to Admin"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}