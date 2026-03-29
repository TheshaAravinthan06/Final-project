type HowItWorksProps = {
  onOpenLogin: () => void;
};

const steps = [
  {
    title: "Choose Mood",
    text: "Tell us how you feel and what kind of trip you want.",
    image: "/images/mirissa.jpg",
    count: "01",
  },
  {
    title: "Get AI Plan",
    text: "Receive a mood-based itinerary made for your travel style.",
    image: "/images/ella.jpg",
    count: "02",
  },
  {
    title: "Find Travel Vibe",
    text: "Explore places, moods, and people that match your energy.",
    image: "/images/nuwar.jpg",
    count: "03",
  },
  {
    title: "Enjoy the Trip",
    text: "Save ideas, connect, and travel with more confidence.",
    image: "/images/sigiriya.jpg",
    count: "04",
  },
  {
    title: "Travel Together",
    text: "Join like-minded travelers and make the trip more social.",
    image: "/images/about-travel.jpeg",
    count: "05",
  },
];

export default function HowItWorks({ onOpenLogin }: HowItWorksProps) {
  return (
    <section id="how-it-works" className="section section-soft how-works-showcase">
      <div className="container">
        <div className="section-heading fade-up">
          <h2>How It Works</h2>
          <p>
            A simple and inspiring way to plan your next trip based on your mood.
          </p>
        </div>

        <div className="how-works-slider-wrap fade-up delay-1">
          <div className="how-works-slider">
            {steps.map((step, index) => {
              const isCenter = index === 2;

              return (
                <article
                  key={step.title}
                  className={`how-works-card ${isCenter ? "is-active" : ""}`}
                >
                  <div
                    className="how-works-card__image"
                    style={{ backgroundImage: `url(${step.image})` }}
                  />
                  <div className="how-works-card__overlay" />

                  <div className="how-works-card__content">
                    <span className="how-works-card__count">{step.count}</span>
                    <h3>{step.title}</h3>
                    <p>{step.text}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <div className="how-works-footer fade-up delay-2">
          <span>‹ Swipe ›</span>
          <button className="small-btn" onClick={onOpenLogin}>
            Explore Now
          </button>
        </div>
      </div>
    </section>
  );
}