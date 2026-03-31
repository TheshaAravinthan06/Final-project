"use client";

import { useState } from "react";
import "@/styles/ai-page.scss";
import { generateMoodItinerary } from "@/lib/ai";

type ItineraryDay = {
  dayNumber: number;
  title: string;
  activities: string[];
  stay: string;
  meals: string;
  transport: string;
  notes: string;
};

type ItineraryResult = {
  generatedTitle?: string;
  generatedSummary?: string;
  estimatedCost?: number | string;
  generatedItinerary?: ItineraryDay[];
};

export default function AIPlannerPage() {
  const [mood, setMood] = useState("");
  const [destination, setDestination] = useState("");
  const [days, setDays] = useState(2);
  const [budget, setBudget] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ItineraryResult | null>(null);

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setError("");
      setResult(null);

      const res = await generateMoodItinerary({
        mood,
        destination,
        days,
        budget,
        travelersCount: 1,
        travelWithStrangers: false,
        preferences: [],
        specialNote: "",
        saveToDb: false,
      });

      setResult(res?.result || res || null);
    } catch (err: any) {
      setError(
        err?.response?.data?.message || "Failed to generate itinerary."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-page">
      <div className="ai-page__container">
        <div className="ai-page__header">
          <span className="ai-page__eyebrow">Smart Travel Planning</span>
          <h1>AI Trip Planner</h1>
          <p>
            Tell us your mood and travel style, and get a trip plan that feels
            right for you.
          </p>
        </div>

        <div className="ai-layout">
          <div className="ai-card ai-form-card">
            <h2>Plan your trip</h2>

            <div className="ai-form-grid">
              <div className="ai-field">
                <label htmlFor="mood">Mood</label>
                <input
                  id="mood"
                  type="text"
                  placeholder="Calm, excited, tired, adventurous..."
                  value={mood}
                  onChange={(e) => setMood(e.target.value)}
                />
              </div>

              <div className="ai-field">
                <label htmlFor="destination">Destination</label>
                <input
                  id="destination"
                  type="text"
                  placeholder="Ella, Trinco, Kandy..."
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                />
              </div>

              <div className="ai-field">
                <label htmlFor="days">Number of days</label>
                <input
                  id="days"
                  type="number"
                  min={1}
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                />
              </div>

              <div className="ai-field">
                <label htmlFor="budget">Budget</label>
                <input
                  id="budget"
                  type="number"
                  min={0}
                  placeholder="Enter budget"
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                />
              </div>
            </div>

            <button
              className="ai-submit-btn"
              onClick={handleGenerate}
              disabled={loading}
            >
              {loading ? "Generating..." : "Generate Itinerary"}
            </button>

            {error ? <div className="ai-message ai-message--error">{error}</div> : null}
          </div>

          <div className="ai-card ai-result-card">
            {!result ? (
              <div className="ai-empty-state">
                <h3>Your itinerary will appear here</h3>
                <p>
                  Fill in your travel mood and details, then click generate to
                  see your personalized trip plan.
                </p>
              </div>
            ) : (
              <div className="ai-result">
                <div className="ai-result__top">
                  <h2>{result.generatedTitle || "Your Mood-Based Itinerary"}</h2>
                  {result.estimatedCost !== undefined && (
                    <span className="ai-price">
                      Estimated Cost: {result.estimatedCost}
                    </span>
                  )}
                </div>

                {result.generatedSummary ? (
                  <p className="ai-summary">{result.generatedSummary}</p>
                ) : null}

                <div className="ai-days">
                  {result.generatedItinerary?.map((day) => (
                    <div className="ai-day-card" key={day.dayNumber}>
                      <div className="ai-day-card__head">
                        <span className="ai-day-badge">Day {day.dayNumber}</span>
                        <h3>{day.title}</h3>
                      </div>

                      <div className="ai-day-card__body">
                        <div className="ai-day-row">
                          <strong>Activities</strong>
                          <p>{day.activities?.join(", ") || "-"}</p>
                        </div>

                        <div className="ai-day-row">
                          <strong>Stay</strong>
                          <p>{day.stay || "-"}</p>
                        </div>

                        <div className="ai-day-row">
                          <strong>Meals</strong>
                          <p>{day.meals || "-"}</p>
                        </div>

                        <div className="ai-day-row">
                          <strong>Transport</strong>
                          <p>{day.transport || "-"}</p>
                        </div>

                        <div className="ai-day-row">
                          <strong>Notes</strong>
                          <p>{day.notes || "-"}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}