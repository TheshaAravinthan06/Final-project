"use client";

import { useState } from "react";

type FloatingAIProps = {
  onOpenLogin: () => void;
};

export default function FloatingAI({ onOpenLogin }: FloatingAIProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="floating-ai-wrapper">
      {isOpen && (
        <div className="floating-ai-chatbox">
          <button
            type="button"
            className="floating-ai-close-btn"
            onClick={() => setIsOpen(false)}
            aria-label="Close AI message"
          >
            ×
          </button>

          <div className="floating-ai-message">
            {/* <span className="floating-ai-message-label">PackPalz</span> */}
            <p>
              Welcome to PackPalz! Planning a trip? 
              How can I assist you today?
            </p>
          </div>

          <div className="floating-ai-suggestions">
            <button type="button" onClick={onOpenLogin}>
              Can you help me plan a trip?
            </button>

            <button type="button" onClick={onOpenLogin}>
              Show me travel packages
            </button>

            <button type="button" onClick={onOpenLogin}>
              Tell me about Sri Lanka tours
            </button>
          </div>
        </div>
      )}

      <div className="floating-ai-button-area">
        {!isOpen && <div className="floating-ai-ring-text">Let&apos;s Trip!</div>}

        <button
          type="button"
          className="floating-ai-btn"
          onClick={isOpen ? onOpenLogin : () => setIsOpen(true)}
          aria-label="Open PackPalz"
        >
          <span className="floating-ai-chat-icon">💬</span>
          <span className="floating-ai-notification">1</span>
        </button>
      </div>
    </div>
  );
}