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
  isOpen:   boolean;
  onClose:  () => void;
  fullPage?: boolean;
};

const SUGGESTED = [
  "Plan a beach trip 🌊",
  "Budget travel ideas 💰",
  "Weekend getaway 🏕️",
];

export default function FloatingAIChat({
  isOpen,
  onClose,
  fullPage = false,
}: FloatingAIChatProps) {
  const [input,    setInput]    = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: "ai",
      text: "Hi! I'm PackPalz ✦  How are you feeling for your next trip?",
    },
  ]);
  const [typing, setTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const sendMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const userMsg: Message = { id: Date.now(), sender: "user", text: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setTyping(true);

    setTimeout(() => {
      const aiMsg: Message = {
        id: Date.now() + 1,
        sender: "ai",
        text: "Got it ✨  Tell me your destination idea, budget, and how many days you want to travel — I'll build your perfect plan!",
      };
      setMessages((prev) => [...prev, aiMsg]);
      setTyping(false);
    }, 1100);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  if (!isOpen && !fullPage) return null;

  const boxClass = fullPage
    ? "floating-ai-chatbox floating-ai-chatbox--page"
    : "floating-ai-chatbox floating-ai-chatbox--popup";

  return (
    <div className={boxClass}>

      {/* Header — popup only */}
      {!fullPage && (
        <div className="floating-ai-header">
          <h3>PackPalz</h3>
          <p>Mood-based trip planner</p>
        </div>
      )}

      {/* Messages */}
      <div className="floating-ai-messages">

        {/* Full-page hero */}
        {fullPage && (
          <div className="floating-ai-hero">
            <div className="floating-ai-hero__orb"><span>✦</span></div>
            <h1>How can I help you plan your trip today?</h1>
            <p>
              Tell Trip AI your mood, destination idea, travel days, budget, and
              preferences — it will guide you and build a travel plan that fits your style.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`floating-ai-message ${msg.sender}`}>
            <div className="floating-ai-bubble">{msg.text}</div>
          </div>
        ))}

        {/* Typing indicator */}
        {typing && (
          <div className="floating-ai-message ai">
            <div className="floating-ai-bubble floating-ai-typing">
              <span /><span /><span />
            </div>
          </div>
        )}

        {/* Quick suggestion chips — shown only when 1 message */}
        {!fullPage && messages.length === 1 && !typing && (
          <div className="floating-ai-chips">
            {SUGGESTED.map((s) => (
              <button
                key={s}
                type="button"
                className="floating-ai-chip"
                onClick={() => sendMessage(s)}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <form className="floating-ai-inputbar" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder={fullPage ? "Ask me anything about your trip…" : "Type your message…"}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          autoComplete="off"
        />
        <button type="submit" aria-label="Send message" disabled={!input.trim()}>
          <FiSend />
        </button>
      </form>

    </div>
  );
}