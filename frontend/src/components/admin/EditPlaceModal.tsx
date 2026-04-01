"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/lib/axios";
import { FiImage, FiMapPin, FiSave, FiX } from "react-icons/fi";

export type EditablePlace = {
  _id: string;
  placeName: string;
  location: string;
  imageUrl: string;
  caption: string;
  moodTags: string[];
  activities?: string[];
  bestTime?: string;
  weather?: string;
  vibe?: string;
  travelTip?: string;
  isPublished: boolean;
  likesCount?: number;
  commentsCount?: number;
  savesCount?: number;
  createdAt?: string;
};

type FormState = {
  placeName: string;
  location: string;
  caption: string;
  moodTags: string;
  activities: string;
  bestTime: string;
  weather: string;
  vibe: string;
  travelTip: string;
  isPublished: boolean;
};

type Props = {
  place: EditablePlace;
  onClose: () => void;
  onPlaceUpdated: (updatedPlace: EditablePlace) => void;
};

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

const getImageSrc = (imageUrl?: string) => {
  if (!imageUrl) return "/images/ella.jpg";
  if (imageUrl.startsWith("http")) return imageUrl;
  return `${BACKEND_URL}${imageUrl}`;
};

export default function EditPlaceModal({
  place,
  onClose,
  onPlaceUpdated,
}: Props) {
  const [form, setForm] = useState<FormState>({
    placeName: place.placeName || "",
    location: place.location || "",
    caption: place.caption || "",
    moodTags: (place.moodTags || []).join(", "),
    activities: (place.activities || []).join(", "),
    bestTime: place.bestTime || "",
    weather: place.weather || "",
    vibe: place.vibe || "",
    travelTip: place.travelTip || "",
    isPublished: place.isPublished ?? true,
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    setForm({
      placeName: place.placeName || "",
      location: place.location || "",
      caption: place.caption || "",
      moodTags: (place.moodTags || []).join(", "),
      activities: (place.activities || []).join(", "),
      bestTime: place.bestTime || "",
      weather: place.weather || "",
      vibe: place.vibe || "",
      travelTip: place.travelTip || "",
      isPublished: place.isPublished ?? true,
    });
    setImageFile(null);
    setError("");
    setSuccess("");
  }, [place]);

  const previewUrl = useMemo(() => {
    if (!imageFile) return getImageSrc(place.imageUrl);
    return URL.createObjectURL(imageFile);
  }, [imageFile, place.imageUrl]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked =
      e.target instanceof HTMLInputElement ? e.target.checked : undefined;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImageFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (
      !form.placeName.trim() ||
      !form.location.trim() ||
      !form.caption.trim()
    ) {
      setError("Please fill place name, location and caption.");
      return;
    }

    try {
      setSubmitting(true);

      const formData = new FormData();
      if (imageFile) {
        formData.append("image", imageFile);
      }

      formData.append("placeName", form.placeName);
      formData.append("location", form.location);
      formData.append("caption", form.caption);
      formData.append("moodTags", form.moodTags);
      formData.append("activities", form.activities);
      formData.append("bestTime", form.bestTime);
      formData.append("weather", form.weather);
      formData.append("vibe", form.vibe);
      formData.append("travelTip", form.travelTip);
      formData.append("isPublished", String(form.isPublished));

      const res = await api.patch(`/places/${place._id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setSuccess("Place updated successfully.");
      onPlaceUpdated(res.data.place);
      setTimeout(() => {
        onClose();
      }, 300);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to update place.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-post-modal-backdrop" onClick={onClose}>
      <div className="admin-form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="admin-form-modal__top">
          <div>
            <h2>Edit Place</h2>
            <p>Update this place post and save the changes.</p>
          </div>

          <button
            type="button"
            className="admin-modal-top-btn"
            onClick={onClose}
          >
            <FiX />
          </button>
        </div>

        <form className="admin-form-modal__body" onSubmit={handleSubmit}>
          <div className="admin-form-modal__grid">
            <div className="admin-form-modal__main">
              <div className="admin-form-card">
                <div className="admin-form-card__head">
                  <h3>
                    <FiSave />
                    Basic Details
                  </h3>
                  <p>Edit the main place information shown to users.</p>
                </div>

                <div className="admin-form-grid admin-form-grid--2">
                  <label className="admin-field">
                    <span>Place Name *</span>
                    <input
                      type="text"
                      name="placeName"
                      value={form.placeName}
                      onChange={handleChange}
                    />
                  </label>

                  <label className="admin-field">
                    <span>
                      <FiMapPin />
                      Location *
                    </span>
                    <input
                      type="text"
                      name="location"
                      value={form.location}
                      onChange={handleChange}
                    />
                  </label>
                </div>

                <label className="admin-field">
                  <span>Caption *</span>
                  <textarea
                    name="caption"
                    rows={4}
                    value={form.caption}
                    onChange={handleChange}
                  />
                </label>

                <div className="admin-form-grid admin-form-grid--2">
                  <label className="admin-field">
                    <span>Mood Tags</span>
                    <input
                      type="text"
                      name="moodTags"
                      value={form.moodTags}
                      onChange={handleChange}
                    />
                    <small>Separate by commas</small>
                  </label>

                  <label className="admin-field">
                    <span>Activities</span>
                    <input
                      type="text"
                      name="activities"
                      value={form.activities}
                      onChange={handleChange}
                    />
                    <small>Separate by commas</small>
                  </label>

                  <label className="admin-field">
                    <span>Best Time</span>
                    <input
                      type="text"
                      name="bestTime"
                      value={form.bestTime}
                      onChange={handleChange}
                    />
                  </label>

                  <label className="admin-field">
                    <span>Weather</span>
                    <input
                      type="text"
                      name="weather"
                      value={form.weather}
                      onChange={handleChange}
                    />
                  </label>

                  <label className="admin-field">
                    <span>Vibe</span>
                    <input
                      type="text"
                      name="vibe"
                      value={form.vibe}
                      onChange={handleChange}
                    />
                  </label>

                  <label className="admin-field admin-field--toggle">
                    <span>Visible to users</span>
                    <input
                      type="checkbox"
                      name="isPublished"
                      checked={form.isPublished}
                      onChange={handleChange}
                    />
                  </label>
                </div>

                <label className="admin-field">
                  <span>Travel Tip</span>
                  <textarea
                    name="travelTip"
                    rows={3}
                    value={form.travelTip}
                    onChange={handleChange}
                  />
                </label>
              </div>
            </div>

            <div className="admin-form-modal__side">
              <div className="admin-form-card">
                <div className="admin-form-card__head">
                  <h3>
                    <FiImage />
                    Cover Image
                  </h3>
                  <p>Change the post image if needed.</p>
                </div>

                <label className="admin-upload-box">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Place preview" />
                  ) : (
                    <div className="admin-upload-box__placeholder">
                      <FiImage />
                      <span>Choose an image</span>
                    </div>
                  )}

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    hidden
                  />
                </label>
              </div>

              {(error || success) && (
                <div className={`admin-form-alert ${error ? "error" : "success"}`}>
                  {error || success}
                </div>
              )}

              <div className="admin-form-actions">
                <button
                  type="button"
                  className="admin-form-secondary-btn"
                  onClick={onClose}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="admin-form-primary-btn"
                  disabled={submitting}
                >
                  {submitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}