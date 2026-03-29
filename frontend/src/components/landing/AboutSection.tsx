export default function AboutSection() {
  return (
    <section id="about" className="about-reference-section">
      <div className="container">
        <div className="about-reference">
          <div className="about-reference__heading">
            <h2>About Us</h2>
          </div>

          <div className="about-reference__image fade-up">
            <img src="/images/about-travel.jpeg" alt="Travel experience" />
          </div>

          <div className="about-reference__main-card fade-up delay-1">
            <h3>Travel That Feels Personal</h3>
            <p>
              Our platform is built for people who want travel to feel easier,
              more meaningful, and more connected to how they actually feel.
              From mood-based recommendations to AI-generated itineraries and
              social travel experiences, we help users discover trips that match
              their energy instead of forcing them into stressful planning.
            </p>
          </div>

          <div className="about-reference__cards">
            <div className="about-reference__small-card fade-up">
              <h4>Mood-Based Travel</h4>
              <p>
                Discover trips that match your emotions, energy, and travel mood.
              </p>
              {/* <button type="button">Learn More</button> */}
            </div>

            <div className="about-reference__small-card fade-up delay-1">
              <h4>AI Itinerary Planner</h4>
              <p>
                Get smart travel plans without the stress of doing everything yourself.
              </p>
              <button type="button">Learn More</button>
            </div>

            <div className="about-reference__small-card fade-up delay-2">
              <h4>Travel Together</h4>
              <p>
                Connect with like-minded travelers and enjoy safer shared experiences.
              </p>
              <button type="button">Learn More</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}