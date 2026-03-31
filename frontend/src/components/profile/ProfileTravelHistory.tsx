import { FiCompass, FiMapPin, FiSun } from "react-icons/fi";

type Props = {
  location?: string;
  interests: string[];
  work?: string;
  isOwnProfile?: boolean;
};

export default function ProfileTravelHistory({
  location,
  interests,
  work,
  isOwnProfile = false,
}: Props) {
  const cards = [
    {
      icon: FiCompass,
      title: "Travel vibe",
      text: interests.length
        ? interests.join(", ")
        : "Nature, beaches, culture, and peaceful escapes.",
    },
    {
      icon: FiMapPin,
      title: "Base location",
      text: location || "Location not added yet.",
    },
    {
      icon: FiSun,
      title: isOwnProfile ? "About your style" : "Travel style",
      text: work
        ? `${work} with a love for memorable travel moments.`
        : "Open to new places, new people, and meaningful experiences.",
    },
  ];

  return (
    <div className="profile-history-grid">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <article className="profile-history-card" key={card.title}>
            <span className="profile-history-card__icon">
              <Icon />
            </span>
            <h4>{card.title}</h4>
            <p>{card.text}</p>
          </article>
        );
      })}
    </div>
  );
}