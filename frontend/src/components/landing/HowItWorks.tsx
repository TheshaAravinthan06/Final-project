"use client";

import { useState } from "react";

type HowItWorksProps = {
  onOpenLogin: () => void;
};

const initialSteps = [
  {
    title: "Choose Mood",
    text: "Tell us how you feel and what kind of trip you want.",
    image: "/images/firstcard.png",
    count: "01",
  },
  {
    title: "Get AI Plan",
    text: "Receive a mood-based itinerary made for your travel style.",
    image: "/images/secondcard.png",
    count: "02",
  },
  {
    title: "Find Travel Vibe",
    text: "Explore places, moods, and people that match your energy.",
    image: "/images/thirdcard.png",
    count: "03",
  },
  {
    title: "Enjoy the Trip",
    text: "Save ideas, connect, and travel with more confidence.",
    image: "/images/fourthcard.png",
    count: "04",
  },
  {
    title: "Travel Together",
    text: "Join like-minded travelers and make the trip more social.",
    image: "/images/fifthcard.png",
    count: "05",
  },
];

export default function HowItWorks({ onOpenLogin }: HowItWorksProps) {
  const [steps, setSteps] = useState(initialSteps);

  // 👉 move right (next)
  const nextSlide = () => {
    setSteps((prev) => {
      const newArr = [...prev];
      const first = newArr.shift();
      if (first) newArr.push(first);
      return newArr;
    });
  };

  // 👉 move left (previous)
  const prevSlide = () => {
    setSteps((prev) => {
      const newArr = [...prev];
      const last = newArr.pop();
      if (last) newArr.unshift(last);
      return newArr;
    });
  };

  return (
    <section id="how-it-works" className="how-works-showcase">
      <div className="container">
        <div className="section-heading">
          <h2>How It Works</h2>
          <p>
            A simple and inspiring way to plan your next trip based on your mood.
          </p>
        </div>

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

        <div className="how-works-footer">
          <button onClick={prevSlide} className="how-arrow-btn">
            ‹
          </button>
          <button onClick={nextSlide} className="how-arrow-btn">
            ›
          </button>

          <button className="small-btn" onClick={onOpenLogin}>
            Explore Now
          </button>
        </div>
      </div>
    </section>
  );
}