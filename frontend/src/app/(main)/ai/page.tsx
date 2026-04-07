"use client";

import { useState } from "react";
import "@/styles/ai-page.scss";
import FloatingAIChat from "@/components/ai/FloatingAIChat";
import { FiCompass, FiBookmark, FiSend, FiMapPin } from "react-icons/fi";
import SavedItineraries from "@/components/ai/SavedItineraries";
import SentToAdminList from "@/components/ai/SentToAdminList";

export default function AIPlannerPage() {
  const [activeTab, setActiveTab] = useState("new");

  return (
    <div className="ai-page">
      <div className="ai-page__shell">
        <aside className="ai-page__sidebar">
          <div className="ai-page__brand">
            <div className="ai-page__brand-icon">✦</div>
            <div>
              <h2>PackPalz</h2>
              <p>Mood-based travel planner</p>
            </div>
          </div>

          <div className="ai-page__search">
            <input type="text" placeholder="Search planner tools" />
          </div>

          <div className="ai-page__menu">
            <button
              type="button"
              className={activeTab === "new" ? "active" : ""}
              onClick={() => setActiveTab("new")}
            >
              <FiCompass />
              <span>New Plan</span>
            </button>

            <button
              type="button"
              className={activeTab === "saved" ? "active" : ""}
              onClick={() => setActiveTab("saved")}
            >
              <FiBookmark />
              <span>Saved Itineraries</span>
            </button>

            <button
              type="button"
              className={activeTab === "sent" ? "active" : ""}
              onClick={() => setActiveTab("sent")}
            >
              <FiSend />
              <span>Send to Admin</span>
            </button>

            <button type="button">
              <FiMapPin />
              <span>Places Ideas</span>
            </button>
          </div>

          <div className="ai-page__info-card">
            <h3>How it works</h3>
            <ul>
              <li>Trip AI asks simple questions</li>
              <li>It understands your mood and trip style</li>
              <li>It generates your itinerary</li>
              <li>You can save it or send it to admin</li>
            </ul>
          </div>
        </aside>

        <section className="ai-page__main">
          <div className="ai-page__topbar">
            <div className="ai-page__hero-badge">Smart Trip Planning</div>

            <button type="button" className="ai-page__share-btn">
              Share
            </button>
          </div>

          <div className="ai-page__chat-stream">
            {activeTab === "new" && (
              <FloatingAIChat isOpen={true} onClose={() => {}} fullPage />
            )}

            {activeTab === "saved" && <SavedItineraries />}

            {activeTab === "sent" && <SentToAdminList />}
          </div>
        </section>
      </div>
    </div>
  );
}