"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import "@/styles/floating-ai.scss";
import { FiSend, FiX, FiMessageCircle, FiBookmark, FiShare2 } from "react-icons/fi";
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

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const initialMessages: Message[] = [
  {
    id: "m1",
    sender: "ai",
    text: "Hi! I’m Trip AI 👋 How are you feeling today?",
  },
];

export default function FloatingAIChat({ isOpen, onClose }: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [showActions, setShowActions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const conversation = useMemo(
    () =>
      messages.map((msg) => ({
        role: msg.sender === "ai" ? "assistant" : "user",
        content: msg.text,
      })),
    [messages]
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen, loading]);

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

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    pushMessage("user", userMessage);
    setInput("");
    setLoading(true);

    try {
      const res = await api.post("/ai/chat", {
        message: userMessage,
        conversation: [...conversation, { role: "user", content: userMessage }],
      });

      const data = res.data;

      if (data?.reply) {
        pushMessage("ai", data.reply);
      }

      if (data?.isComplete && data?.itinerary) {
        setItinerary(data.itinerary);
        setShowActions(true);

        pushMessage(
          "ai",
          "Your itinerary is ready. You can save it or send it to admin."
        );
      }
    } catch (error: any) {
      pushMessage(
        "ai",
        error?.response?.data?.message ||
          "Something went wrong while talking to Trip AI."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!itinerary) return;

    try {
      await api.post("/ai/save-itinerary", { itinerary });
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
      await api.post("/ai/send-itinerary-to-admin", { itinerary });
      pushMessage("ai", "Your itinerary has been sent to admin.");
      setShowActions(false);
    } catch (error: any) {
      pushMessage(
        "ai",
        error?.response?.data?.message || "Failed to send itinerary to admin."
      );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="floating-ai-chatbox">
      <div className="floating-ai-header">
        <div>
          <h3>Trip AI</h3>
          <p>Mood-based trip planner</p>
        </div>

        <button className="floating-ai-close-btn" onClick={onClose} type="button">
          <FiX />
        </button>
      </div>

      <div className="floating-ai-messages">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`floating-ai-message ${
              message.sender === "ai" ? "ai" : "user"
            }`}
          >
            <div className="floating-ai-bubble">{message.text}</div>
          </div>
        ))}

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
                    <strong>Activities:</strong>{" "}
                    {day.activities?.join(", ") || "-"}
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
          </div>
        ) : null}

        {loading ? (
          <div className="floating-ai-message ai">
            <div className="floating-ai-bubble floating-ai-bubble--typing">
              Trip AI is typing...
            </div>
          </div>
        ) : null}

        <div ref={messagesEndRef} />
      </div>

      <div className="floating-ai-inputbar">
        <input
          type="text"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button type="button" onClick={handleSend} disabled={loading}>
          <FiSend />
        </button>
      </div>
    </div>
  );
}

export function FloatingAIButton({
  onClick,
}: {
  onClick: () => void;
}) {
  return (
    <button className="floating-ai-btn" onClick={onClick} type="button">
      <FiMessageCircle />
    </button>
  );
}