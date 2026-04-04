"use client";

import { useState } from "react";
import { FiBookmark, FiCalendar } from "react-icons/fi";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";

type TravelPick = {
  _id: string;
  title: string;
  place: string;
  imageUrl: string;
  startDate: string;
  endDate: string;
  price: number;
  isBookingOpen?: boolean;
  createdAt?: string;
  isSaved?: boolean;
};

type Props = {
  pick: TravelPick;
  onBookNow?: (pick: TravelPick) => void;
};

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

const getImageSrc = (imageUrl?: string) => {
  if (!imageUrl) return "/images/ella.jpg";
  if (imageUrl.startsWith("http")) return imageUrl;
  return `${BACKEND_URL}${imageUrl}`;
};

const formatPostedTime = (dateString?: string) => {
  if (!dateString) return "";

  const now = new Date();
  const postedAt = new Date(dateString);
  const diffMs = now.getTime() - postedAt.getTime();

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  const diffMinutes = Math.floor(diffMs / minute);
  const diffHours = Math.floor(diffMs / hour);
  const diffDays = Math.floor(diffMs / day);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;

  return postedAt.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatTripDate = (dateString: string) => {
  const date = new Date(dateString);

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export default function TravelPickCard({ pick, onBookNow }: Props) {
  const router = useRouter();
  const [saved, setSaved] = useState(Boolean(pick.isSaved));
  const [toast, setToast] = useState("");

  const showToast = (text: string) => {
    setToast(text);
    window.setTimeout(() => setToast(""), 1800);
  };

  const handleBookNow = () => {
    if (!pick.isBookingOpen) return;

    if (onBookNow) {
      onBookNow(pick);
      return;
    }

    router.push(`/travel-picks/${pick._id}`);
  };

  const handleSave = async () => {
    const nextSaved = !saved;
    setSaved(nextSaved);

    try {
      if (nextSaved) {
        await api.post(`/travel-picks/${pick._id}/save`);
        showToast("Saved to Travel Picks");
      } else {
        await api.post(`/travel-picks/${pick._id}/unsave`);
      }
    } catch (error) {
      console.error("Travel pick save failed:", error);
      setSaved(!nextSaved);
    }
  };

  return (
    <article className="travel-pick-card">
      {toast ? <div className="save-toast">{toast}</div> : null}

      <div className="travel-pick-card__image-wrap">
        <img src={getImageSrc(pick.imageUrl)} alt={pick.title} />
      </div>

      <div className="travel-pick-card__body">
        <div className="travel-pick-card__top">
          <div className="travel-pick-card__text">
            <h3>{pick.title}</h3>
            <p>{pick.place}</p>
            <span className="travel-pick-card__date-row">
              <FiCalendar />
              {formatTripDate(pick.startDate)} - {formatTripDate(pick.endDate)}
            </span>
          </div>
        </div>

        <div className="travel-pick-card__bottom">
          <button
            type="button"
            className={`travel-pick-card__save ${saved ? "is-saved" : ""}`}
            aria-label="Save travel pick"
            onClick={handleSave}
          >
            <FiBookmark />
          </button>

          <button
            type="button"
            className="travel-pick-card__book-btn"
            onClick={handleBookNow}
            disabled={!pick.isBookingOpen}
          >
            {pick.isBookingOpen ? "Book now" : "Booking closed"}
          </button>
        </div>

        <p className="travel-pick-card__posted-at">
          {formatPostedTime(pick.createdAt)}
        </p>
      </div>
    </article>
  );
}