type HeroSectionProps = {
  onOpenRegister: () => void;
};

const whyChooseItems = [
  "AI-powered itineraries based on your mood",
  "Safe group travel and meaningful connections",
  "Beautiful places curated for how you want to feel",
  "A calmer and more personal way to plan trips",
];

export default function HeroSection({ onOpenRegister }: HeroSectionProps) {
  return (
    <section id="home" className="hero-section">
      <div className="hero-overlay">
        <div className="container hero-grid">
          <div className="hero-left fade-up">
            {/* <div className="hero-badge">
              Mood-based journeys with AI and community
            </div> */}

            <h1>Travel that feels like your mood, not just a booking</h1>

            <p>
              Discover places, create mood-matching itineraries, join meaningful
              trips, and enjoy a more beautiful way to plan travel with PackPalz.
            </p>

            <button className="hero-cta-btn" onClick={onOpenRegister}>
              Let's Trip
            </button>
          </div>

          <div className="hero-right fade-up delay-1">
            <div className="hero-why-card">
              {/* <span className="hero-why-label">Why choose PackPalz</span> */}

              <h3>Why Choose Us?</h3>

              <ul className="hero-why-list">
                {whyChooseItems.map((item) => (
                  <li key={item}>
                    <span className="hero-why-dot" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <div className="hero-why-mini">
                <div className="hero-why-stat">
                  <strong>AI</strong>
                  <p>Smart planning</p>
                </div>

                <div className="hero-why-stat">
                  <strong>Mood</strong>
                  <p>Personal matches</p>
                </div>

                <div className="hero-why-stat">
                  <strong>Safe</strong>
                  <p>Trusted trips</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}