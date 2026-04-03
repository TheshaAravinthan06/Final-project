"use client";

import { useEffect, useRef, useState } from "react";
import "@/styles/floating-ai.scss";
import {
  FiSend,
  FiX,
  FiMessageCircle,
  FiBookmark,
  FiShare2,
} from "react-icons/fi";
import api from "@/lib/axios";

type Message = {
  id: string;
  sender: "ai" | "user";
  text: string;
};

type ItineraryDay = {
  dayNumber: number;
  title: string;
  activities: string[];
  stay: string;
  meals: string;
  transport: string;
  notes: string;
};

type Itinerary = {
  generatedTitle?: string;
  generatedSummary?: string;
  estimatedCost?: number | string;
  generatedItinerary?: ItineraryDay[];
};

type PlannerForm = {
  mood: string;
  destination: string;
  days: number;
  budget: number;
  travelersCount: number;
  travelWithStrangers: boolean;
  preferences: string[];
  specialNote: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  fullPage?: boolean;
};

const initialForm: PlannerForm = {
  mood: "",
  destination: "",
  days: 2,
  budget: 0,
  travelersCount: 1,
  travelWithStrangers: false,
  preferences: [],
  specialNote: "",
};

const steps = [
  {
    key: "mood",
    question: "Hi! I’m PackPalz 👋 How are you feeling for this trip?",
  },
  {
    key: "destination",
    question: "Nice. Where do you want to go?",
  },
  {
    key: "days",
    question: "How many days do you want for this trip?",
  },
  {
    key: "budget",
    question: "What is your budget for this trip?",
  },
  {
    key: "travelersCount",
    question: "How many people are traveling?",
  },
  {
    key: "travelWithStrangers",
    question: "Do you want to travel with strangers? Reply yes or no.",
  },
  {
    key: "preferences",
    question:
      "Any preferences? For example beach, food, calm, adventure, hiking. You can type comma separated.",
  },
  {
    key: "specialNote",
    question: "Any special note for the trip? If not, type no.",
  },
] as const;

export default function FloatingAIChat({
  isOpen,
  onClose,
  fullPage = false,
}: Props) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "m1",
      sender: "ai",
      text: steps[0].question,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [showActions, setShowActions] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [formData, setFormData] = useState<PlannerForm>(initialForm);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, itinerary, isOpen]);

  const pushMessage = (sender: "ai" | "user", text: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `${sender}-${Date.now()}-${Math.random()}`,
        sender,
        text,
      },
    ]);
  };

  const parseValueForStep = (stepKey: string, raw: string) => {
    const value = raw.trim();

    switch (stepKey) {
      case "days": {
        const num = Number(value);
        return Number.isNaN(num) || num < 1 ? 1 : num;
      }

      case "budget": {
        const num = Number(value);
        return Number.isNaN(num) || num < 0 ? 0 : num;
      }

      case "travelersCount": {
        const num = Number(value);
        return Number.isNaN(num) || num < 1 ? 1 : num;
      }

      case "travelWithStrangers":
        return ["yes", "y", "true"].includes(value.toLowerCase());

      case "preferences":
        return value.toLowerCase() === "no"
          ? []
          : value
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean);

      case "specialNote":
        return value.toLowerCase() === "no" ? "" : value;

      default:
        return value;
    }
  };

  const handleGenerate = async (finalData: PlannerForm) => {
    try {
      setLoading(true);

      const res = await api.post("/ai/generate", {
        ...finalData,
        saveToDb: false,
      });

      const result = res?.data?.result || null;
      setItinerary(result);
      setShowActions(true);

      pushMessage(
        "ai",
        "Your itinerary is ready ✨ You can save it or send it to admin."
      );
    } catch (error: any) {
      pushMessage(
        "ai",
        error?.response?.data?.message || "Failed to generate itinerary."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading || itinerary) return;

    const userMessage = input.trim();
    const currentStep = steps[stepIndex];

    pushMessage("user", userMessage);
    setInput("");

    const parsedValue = parseValueForStep(currentStep.key, userMessage);
    const updatedForm = {
      ...formData,
      [currentStep.key]: parsedValue,
    } as PlannerForm;

    setFormData(updatedForm);

    const nextStepIndex = stepIndex + 1;

    if (nextStepIndex < steps.length) {
      setStepIndex(nextStepIndex);
      setTimeout(() => {
        pushMessage("ai", steps[nextStepIndex].question);
      }, 250);
      return;
    }

    await handleGenerate(updatedForm);
  };

  const handleSave = async () => {
    if (!itinerary) return;

    try {
      await api.post("/ai/save-itinerary", {
        formData,
        itinerary,
      });

      pushMessage("ai", "Your itinerary has been saved successfully.");
      setShowActions(false);
    } catch (error: any) {
      pushMessage(
        "ai",
        error?.response?.data?.message || "Failed to save itinerary."
      );
    }
  };

  const handleSendToAdmin = async () => {
    if (!itinerary) return;

    try {
      await api.post("/ai/send-itinerary-to-admin", {
        formData,
        itinerary,
      });

      pushMessage("ai", "Your itinerary has been sent to admin successfully.");
      setShowActions(false);
    } catch (error: any) {
      pushMessage(
        "ai",
        error?.response?.data?.message || "Failed to send itinerary to admin."
      );
    }
  };

  const handleRestart = () => {
    setMessages([
      {
        id: "m1",
        sender: "ai",
        text: steps[0].question,
      },
    ]);
    setInput("");
    setLoading(false);
    setItinerary(null);
    setShowActions(false);
    setStepIndex(0);
    setFormData(initialForm);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`floating-ai-chatbox ${fullPage ? "floating-ai-chatbox--page" : ""}`}>
      <div className="floating-ai-header">
        <div>
          <h3>PackPalz</h3>
          <p>Mood-based trip planner</p>
        </div>

        {!fullPage && (
          <button className="floating-ai-close-btn" onClick={onClose} type="button">
            <FiX />
          </button>
        )}
      </div>

      <div className="floating-ai-messages">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`floating-ai-message ${message.sender === "ai" ? "ai" : "user"}`}
          >
            <div className="floating-ai-bubble">{message.text}</div>
          </div>
        ))}

        {loading ? (
          <div className="floating-ai-message ai">
            <div className="floating-ai-bubble floating-ai-bubble--typing">
              PackPalz is creating your itinerary...
            </div>
          </div>
        ) : null}

        {itinerary ? (
          <div className="floating-ai-itinerary-card">
            <h4>{itinerary.generatedTitle || "Your Itinerary"}</h4>

            {itinerary.generatedSummary ? (
              <p className="floating-ai-itinerary-summary">
                {itinerary.generatedSummary}
              </p>
            ) : null}

            {itinerary.estimatedCost !== undefined ? (
              <div className="floating-ai-cost">
                Estimated Cost: {itinerary.estimatedCost}
              </div>
            ) : null}

            <div className="floating-ai-days">
              {itinerary.generatedItinerary?.map((day) => (
                <div key={day.dayNumber} className="floating-ai-day-card">
                  <h5>
                    Day {day.dayNumber}: {day.title}
                  </h5>
                  <p>
                    <strong>Activities:</strong> {day.activities?.join(", ") || "-"}
                  </p>
                  <p>
                    <strong>Stay:</strong> {day.stay || "-"}
                  </p>
                  <p>
                    <strong>Meals:</strong> {day.meals || "-"}
                  </p>
                  <p>
                    <strong>Transport:</strong> {day.transport || "-"}
                  </p>
                  <p>
                    <strong>Notes:</strong> {day.notes || "-"}
                  </p>
                </div>
              ))}
            </div>

            {showActions ? (
              <div className="floating-ai-actions">
                <button type="button" onClick={handleSave}>
                  <FiBookmark />
                  Save
                </button>

                <button type="button" onClick={handleSendToAdmin}>
                  <FiShare2 />
                  Send to Admin
                </button>
              </div>
            ) : null}

            <button type="button" className="floating-ai-restart-btn" onClick={handleRestart}>
              Plan another trip
            </button>
          </div>
        ) : null}

        <div ref={messagesEndRef} />
      </div>

      {!itinerary && (
        <div className="floating-ai-inputbar">
          <input
            type="text"
            placeholder="Type your answer..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button type="button" onClick={handleSend} disabled={loading}>
            <FiSend />
          </button>
        </div>
      )}
    </div>
  );
}

export function FloatingAIButton({ onClick }: { onClick: () => void }) {
  return (
    <button className="floating-ai-btn" onClick={onClick} type="button">
      <FiMessageCircle />
    </button>
  );
}