type HeroSectionProps = {
  onOpenRegister: () => void;
};

export default function HeroSection({ onOpenRegister }: HeroSectionProps) {
  return (
    <section id="home" className="hero-section">
      <div className="hero-overlay">
        <div className="container hero-grid">
          <div className="hero-left fade-up">
            <div className="hero-badge">
              AI-powered mood-based travel planning
            </div>

            <h1>
              Discover journeys that match your mood and your people
            </h1>

            <p>
              Plan meaningful trips with AI, explore curated places, discover
              travel diaries, and create unforgettable experiences in one
              beautiful platform.
            </p>

            <button className="hero-cta-btn" onClick={onOpenRegister}>
              Let&apos;s Plan
            </button>
          </div>

          <div className="hero-right-card fade-up delay-1">
            <h3>Why Choose Us?</h3>
            <ul>
              <li>Personalized travel planning</li>
              <li>AI itinerary support</li>
              <li>Curated places and travel picks</li>
              <li>Social travel diaries</li>
              <li>Simple travel inspiration in one place</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}