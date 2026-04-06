"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { FiSend } from "react-icons/fi";
import api from "@/lib/axios";
import "@/styles/floating-ai.scss";
import SendItineraryModal from "@/components/ai/SendItineraryModal";

type ChatStep =
  | "greeting"
  | "askMood"
  | "selectPlaces"
  | "selectActivities"
  | "askDays"
  | "askDate"
  | "askPeople"
  | "askCompanions"
  | "askCustomCompanionNote"
  | "askExtraNotes"
  | "confirmCreate"
  | "showItinerary"
  | "done";

type Place = {
  name: string;
  district: string;
  reason: string;
};

type ActivityGroup = {
  place: string;
  activities: string[];
};

type SelectedActivitiesGroup = {
  place: string;
  activities: string[];
};

type Message = {
  id: number;
  sender: "ai" | "user";
  text: string;
};

type FloatingAIChatProps = {
  isOpen: boolean;
  onClose: () => void;
  fullPage?: boolean;
};

export default function FloatingAIChat({
  isOpen,
  onClose,
  fullPage = false,
}: FloatingAIChatProps) {
  const [input, setInput] = useState("");

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: "ai",
      text: "Hi, this is PackPalz 👋 Nice to meet you.",
    },
  ]);

  const [step, setStep] = useState<ChatStep>("greeting");
  const [loading, setLoading] = useState(false);

  const [mood, setMood] = useState("");
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedPlaces, setSelectedPlaces] = useState<string[]>([]);

  const [activitiesByPlace, setActivitiesByPlace] = useState<ActivityGroup[]>([]);
  const [selectedActivities, setSelectedActivities] = useState<
    SelectedActivitiesGroup[]
  >([]);

  const [days, setDays] = useState("");
  const [specificDate, setSpecificDate] = useState("");
  const [peopleCount, setPeopleCount] = useState("");

  const [travelCompanions, setTravelCompanions] = useState<string[]>([]);
  const [customCompanionNote, setCustomCompanionNote] = useState("");
  const [extraNotes, setExtraNotes] = useState("");

  const [itineraryText, setItineraryText] = useState("");

  const [showSendToAdminModal, setShowSendToAdminModal] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const moodOptions = [
    "Relaxed",
    "Adventurous",
    "Peaceful",
    "Romantic",
    "Fun",
    "Nature",
    "Luxury",
    "Cultural",
    "Healing",
    "Beach vibes",
  ];

  const addMessage = (sender: "ai" | "user", text: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now() + Math.floor(Math.random() * 1000),
        sender,
        text,
      },
    ]);
  };

  const parseCompanions = (value: string) => {
    return value
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, places, activitiesByPlace, step, itineraryText]);

  const selectedActivitiesCount = useMemo(() => {
    return selectedActivities.reduce((sum, item) => sum + item.activities.length, 0);
  }, [selectedActivities]);

  const handleGetPlaces = async (userMood: string) => {
    try {
      setLoading(true);

      const res = await api.post("/ai/places-by-mood", { mood: userMood });

      const aiMessage =
        res.data.message ||
        "These are some places in Sri Lanka that match your mood. Please select one or more places.";

      setPlaces(res.data.places || []);
      addMessage("ai", aiMessage);
      setStep("selectPlaces");
    } catch (error) {
      console.error("handleGetPlaces error:", error);
      addMessage("ai", "Sorry, I couldn't generate places right now.");
    } finally {
      setLoading(false);
    }
  };

  const handleGetActivities = async () => {
    try {
      setLoading(true);

      const res = await api.post("/ai/activities-by-places", {
        places: selectedPlaces,
      });

      const groups: ActivityGroup[] = res.data.activitiesByPlace || [];

      setActivitiesByPlace(groups);
      setSelectedActivities(
        groups.map((group) => ({
          place: group.place,
          activities: [],
        }))
      );

      addMessage(
        "ai",
        res.data.message ||
          "Nice choices. Now select the activities you would like to do."
      );
      setStep("selectActivities");
    } catch (error) {
      console.error("handleGetActivities error:", error);
      addMessage("ai", "Sorry, I couldn't generate activities right now.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateItinerary = async () => {
    try {
      setLoading(true);

      const res = await api.post("/ai/create-itinerary", {
        mood,
        selectedPlaces,
        selectedActivities,
        days: Number(days),
        specificDate,
        peopleCount: Number(peopleCount),
        travelCompanions,
        customCompanionNote,
        extraNotes,
      });

      setItineraryText(res.data.itineraryText || "");
      addMessage(
        "ai",
        res.data.message || "Great! I created your itinerary. Please review it below."
      );
      setStep("showItinerary");
    } catch (error) {
      console.error("handleCreateItinerary error:", error);
      addMessage("ai", "Sorry, I couldn't create the itinerary right now.");
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceToggle = (placeName: string) => {
    setSelectedPlaces((prev) =>
      prev.includes(placeName)
        ? prev.filter((item) => item !== placeName)
        : [...prev, placeName]
    );
  };

  const handleActivityToggle = (place: string, activity: string) => {
    setSelectedActivities((prev) =>
      prev.map((item) => {
        if (item.place !== place) return item;

        const exists = item.activities.includes(activity);

        return {
          ...item,
          activities: exists
            ? item.activities.filter((a) => a !== activity)
            : [...item.activities, activity],
        };
      })
    );
  };

  const handleMoodSelect = async (moodItem: string) => {
    if (loading) return;

    addMessage("user", moodItem);
    setMood(moodItem);
    await handleGetPlaces(moodItem);
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      await api.post("/ai/save-itinerary", {
        mood,
        selectedPlaces,
        selectedActivities,
        days: Number(days),
        specificDate,
        peopleCount: Number(peopleCount),
        travelCompanions,
        customCompanionNote,
        extraNotes,
        itineraryText,
      });

      window.dispatchEvent(new Event("itinerarySaved"));
      addMessage("ai", "Your itinerary has been saved successfully.");
      setStep("done");
    } catch (error) {
      console.error("handleSave error:", error);
      addMessage("ai", "Sorry, I couldn't save the itinerary.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendToAdmin = async () => {
    try {
      setLoading(true);

      await api.post("/ai/send-itinerary-to-admin", {
        mood,
        selectedPlaces,
        selectedActivities,
        days: Number(days),
        specificDate,
        peopleCount: Number(peopleCount),
        travelCompanions,
        customCompanionNote,
        extraNotes,
        itineraryText,
      });

      addMessage("ai", "Your itinerary has been sent to admin successfully.");
      setStep("done");
    } catch (error) {
      console.error("handleSendToAdmin error:", error);
      addMessage("ai", "Sorry, I couldn't send the itinerary to admin.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!input.trim() || loading) return;

    const value = input.trim();
    addMessage("user", value);
    setInput("");

    if (step === "greeting") {
      addMessage(
        "ai",
        "How are you feeling for this trip? You can choose a mood below or type your own."
      );
      setStep("askMood");
      return;
    }

    if (step === "askMood") {
      setMood(value);
      await handleGetPlaces(value);
      return;
    }

    if (step === "askDays") {
      setDays(value);
      addMessage(
        "ai",
        "If you have a specific date, please mention it. If not, type 'no'."
      );
      setStep("askDate");
      return;
    }

    if (step === "askDate") {
      setSpecificDate(value.toLowerCase() === "no" ? "" : value);
      addMessage("ai", "How many people are traveling?");
      setStep("askPeople");
      return;
    }

    if (step === "askPeople") {
      setPeopleCount(value);
      addMessage(
        "ai",
        "Who would you like to travel with? You can type one or more options like solo, friends, strangers, family, or your own preference. Separate multiple options with commas."
      );
      setStep("askCompanions");
      return;
    }

    if (step === "askCompanions") {
      const companions = parseCompanions(value);

      if (companions.length === 0) {
        addMessage(
          "ai",
          "Please type at least one option such as solo, friends, strangers, family, or your own preference."
        );
        return;
      }

      setTravelCompanions(companions);
      addMessage(
        "ai",
        "Do you want to add any specific companion preference? For example kids-friendly, women-only group, peaceful company. If not, type 'no'."
      );
      setStep("askCustomCompanionNote");
      return;
    }

    if (step === "askCustomCompanionNote") {
      setCustomCompanionNote(value.toLowerCase() === "no" ? "" : value);
      addMessage(
        "ai",
        "Do you want to add anything specifically here? For example budget, hotel style, food preference, transport choice, peaceful places, less crowded spots, or anything else. If not, type 'no'."
      );
      setStep("askExtraNotes");
      return;
    }

    if (step === "askExtraNotes") {
      setExtraNotes(value.toLowerCase() === "no" ? "" : value);
      addMessage("ai", "Can I create the itinerary now? Please type yes.");
      setStep("confirmCreate");
      return;
    }

    if (step === "confirmCreate") {
      if (value.toLowerCase() === "yes") {
        await handleCreateItinerary();
      } else {
        addMessage("ai", "Okay. Tell me when you are ready to create it.");
      }
    }
  };

  const handleConfirmPlaces = async () => {
    if (selectedPlaces.length === 0) {
      addMessage("ai", "Please select at least one place.");
      return;
    }

    addMessage("user", `Selected places: ${selectedPlaces.join(", ")}`);
    await handleGetActivities();
  };

  const handleConfirmActivities = () => {
    if (selectedActivitiesCount === 0) {
      addMessage("ai", "Please select at least one activity.");
      return;
    }

    addMessage("user", "I selected my activities.");
    addMessage("ai", "How many days do you want to travel?");
    setStep("askDays");
  };

  if (!isOpen) return null;

  return (
    <div className={`floating-ai-chat ${fullPage ? "full-page" : ""}`}>
      <div className="floating-ai-messages">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`floating-ai-message-row ${
              message.sender === "user" ? "user" : "ai"
            }`}
          >
            <div className={`floating-ai-message-bubble ${message.sender}`}>
              <p>{message.text}</p>
            </div>
          </div>
        ))}

        {step === "askMood" && (
          <div className="floating-ai-option-card">
            <h4>Choose your mood</h4>

            <div className="floating-ai-mood-grid">
              {moodOptions.map((moodItem) => (
                <button
                  key={moodItem}
                  type="button"
                  className="floating-ai-mood-chip"
                  onClick={() => handleMoodSelect(moodItem)}
                  disabled={loading}
                >
                  {moodItem}
                </button>
              ))}
            </div>

            <p className="floating-ai-helper-text">
              Or type your own mood in the chat box below.
            </p>
          </div>
        )}

        {step === "selectPlaces" && places.length > 0 && (
          <div className="floating-ai-option-card">
            <h4>Select one or more places</h4>

            <div className="floating-ai-options-grid">
              {places.map((place) => (
                <label key={place.name} className="floating-ai-check-card">
                  <input
                    type="checkbox"
                    checked={selectedPlaces.includes(place.name)}
                    onChange={() => handlePlaceToggle(place.name)}
                  />
                  <div>
                    <strong>{place.name}</strong>
                    <span>{place.district}</span>
                    <p>{place.reason}</p>
                  </div>
                </label>
              ))}
            </div>

            <button
              type="button"
              className="floating-ai-action-btn"
              onClick={handleConfirmPlaces}
              disabled={loading}
            >
              {loading ? "Loading..." : "Continue"}
            </button>
          </div>
        )}

        {step === "selectActivities" && activitiesByPlace.length > 0 && (
          <div className="floating-ai-option-card">
            <h4>Select activities</h4>

            {activitiesByPlace.map((group) => (
              <div key={group.place} className="floating-ai-activity-group">
                <h5>{group.place}</h5>

                <div className="floating-ai-options-grid">
                  {group.activities.map((activity) => {
                    const placeState = selectedActivities.find(
                      (item) => item.place === group.place
                    );

                    const checked = placeState?.activities.includes(activity) || false;

                    return (
                      <label
                        key={`${group.place}-${activity}`}
                        className="floating-ai-check-card"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleActivityToggle(group.place, activity)}
                        />
                        <div>
                          <strong>{activity}</strong>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}

            <button
              type="button"
              className="floating-ai-action-btn"
              onClick={handleConfirmActivities}
            >
              Continue
            </button>
          </div>
        )}

        {step === "showItinerary" && itineraryText && (
          <div className="floating-ai-option-card">
            <h4>Your itinerary</h4>

            <div className="floating-ai-itinerary-box">{itineraryText}</div>

            <p className="floating-ai-confirm-text">Is this itinerary okay to you?</p>

            <div className="floating-ai-final-actions">
              <button
                type="button"
                className="floating-ai-action-btn"
                onClick={handleSave}
                disabled={loading}
              >
                Save It
              </button>
             <button
    type="button"
    className="floating-ai-action-btn secondary"
    onClick={() => setShowSendToAdminModal(true)}
    disabled={loading}
  >
    Send to Admin
  </button>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {step !== "selectPlaces" &&
        step !== "selectActivities" &&
        step !== "showItinerary" &&
        step !== "done" && (
          <form className="floating-ai-inputbar" onSubmit={handleSubmit}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={loading ? "Please wait..." : "Type your reply here..."}
              disabled={loading}
            />
            <button type="submit" disabled={loading || !input.trim()}>
              <FiSend />
            </button>
          </form>
        )}

        <SendItineraryModal
  isOpen={showSendToAdminModal}
  onClose={() => setShowSendToAdminModal(false)}
  onSuccess={() => {
    addMessage("ai", "Your itinerary has been sent to admin successfully.");
    setStep("done");
  }}
  itineraryText={itineraryText}
  mood={mood}
  selectedPlaces={selectedPlaces}
  selectedActivities={selectedActivities}
  days={Number(days)}
  specificDate={specificDate}
  peopleCount={Number(peopleCount)}
  travelCompanions={travelCompanions}
  customCompanionNote={customCompanionNote}
  extraNotes={extraNotes}
/>
    </div>
  );
}

