export default function AboutSection() {
  return (
    <section id="about" className="section section-soft">
      <div className="container">
        <div className="section-heading fade-up">
          <h2>About Us</h2>
          <p>
            This platform is built to make travel more personal, and inspiring,
            and easier to plan. It helps users discover journeys based on mood,
            interest, and social travel experiences.
          </p>
        </div>

        <div className="about-grid">
          <div className="about-card fade-up">
            <h3>Mood-Based Travel</h3>
            <p>Get travel ideas that fit your feelings and preferences.</p>
          </div>

          <div className="about-card fade-up delay-1">
            <h3>AI Trip Planner</h3>
            <p>Build itineraries with less stress and more direction.</p>
          </div>

          <div className="about-card fade-up delay-2">
            <h3>Travel Diaries</h3>
            <p>Discover real travel moments shared by users.</p>
          </div>

          <div className="about-card fade-up delay-3">
            <h3>Explore Places</h3>
            <p>See curated admin posts and destination inspiration.</p>
          </div>
        </div>
      </div>
    </section>
  );
}