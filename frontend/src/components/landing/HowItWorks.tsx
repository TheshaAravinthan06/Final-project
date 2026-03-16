type HowItWorksProps = {
  onOpenLogin: () => void;
};

const steps = [
  {
    title: "Choose Your Mood",
    text: "Tell the platform how you feel and what kind of travel you want.",
  },
  {
    title: "Get AI Itinerary",
    text: "Receive an itinerary that matches your mood and travel preferences.",
  },
  {
    title: "Join Travelers",
    text: "Explore a more social travel experience with like-minded people.",
  },
  {
    title: "Enjoy Your Trip",
    text: "Save ideas, plan better, and enjoy your journey with confidence.",
  },
];

export default function HowItWorks({ onOpenLogin }: HowItWorksProps) {
  return (
    <section className="section section-dark">
      <div className="container">
        <div className="section-heading fade-up">
          <h2>How It Works</h2>
          <p>A simple and inspiring way to start your next journey.</p>
        </div>

        <div className="info-grid">
          {steps.map((step, index) => (
            <div key={step.title} className={`info-card fade-up delay-${index}`}>
              <div className="info-icon">✦</div>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
              <button className="small-btn" onClick={onOpenLogin}>
                Explore
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}