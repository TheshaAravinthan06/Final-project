"use client";

import "@/styles/ai-page.scss";
import FloatingAIChat from "@/components/ai/FloatingAIChat";

export default function AIPlannerPage() {
  return (
    <div className="ai-page">
      <div className="ai-page__container">
        <div className="ai-page__hero">
          <div className="ai-page__hero-badge">Smart Travel Planning</div>
          {/* <h1>Talk to Trip AI from the start</h1>
          <p>
            Tell Trip AI how you feel, where you want to go, how many days you need,
            and your budget. It will ask step by step and build a trip that fits your mood.
          </p> */}
        </div>

        <div className="ai-page__panel">
          <div className="ai-page__left">
            <div className="ai-page__info-card">
              <h3>How it works</h3>
              <ul>
                <li>Trip AI asks simple questions</li>
                <li>It builds your mood-based itinerary</li>
                <li>You can save it</li>
                <li>Or send it to admin for follow-up</li>
              </ul>
            </div>
          </div>

          <div className="ai-page__right">
            <FloatingAIChat isOpen={true} onClose={() => {}} fullPage />
          </div>
        </div>
      </div>
    </div>
  );
}