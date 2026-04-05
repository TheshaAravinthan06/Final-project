"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { FiSend } from "react-icons/fi";
import "@/styles/floating-ai.scss";

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
      text: "Hi! I’m PackPalz 👋 How are you feeling for this trip?",
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const value = input.trim();
    if (!value) return;

    const userMessage: Message = {
      id: Date.now(),
      sender: "user",
      text: value,
    };

    const aiMessage: Message = {
      id: Date.now() + 1,
      sender: "ai",
      text: "Got it ✨ Tell me your destination idea, budget, and how many days you want to travel.",
    };

    setMessages((prev) => [...prev, userMessage, aiMessage]);
    setInput("");
  };

  if (!isOpen && !fullPage) return null;

  return (
    <div
      className={
        fullPage
          ? "floating-ai-chatbox floating-ai-chatbox--page"
          : "floating-ai-chatbox floating-ai-chatbox--popup"
      }
    >
      {!fullPage && (
        <div className="floating-ai-header">
          <div>
            <h3>PackPalz</h3>
            <p>Mood-based trip planner</p>
          </div>
        </div>
      )}

      <div className="floating-ai-messages">
        {fullPage && (
          <div className="floating-ai-hero">
            <div className="floating-ai-hero__orb">
              <span>✦</span>
            </div>
            <h1>How can I help you plan your trip today?</h1>
            <p>
              Tell Trip AI your mood, destination idea, travel days, budget, and
              preferences. It will guide you and build a travel plan that fits
              your style.
            </p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`floating-ai-message ${message.sender}`}
          >
            <div className="floating-ai-bubble">{message.text}</div>
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      <form className="floating-ai-inputbar" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit" aria-label="Send message">
          <FiSend />
        </button>
      </form>
    </div>
  );
}