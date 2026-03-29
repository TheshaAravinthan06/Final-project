"use client";

import { useMemo, useState } from "react";
import api from "@/lib/axios";
import { FiImage, FiMapPin, FiPlus, FiX } from "react-icons/fi";

type PlaceComment = {
  _id: string;
  text: string;
  createdAt: string;
  replyTo?: string | null;
  isAdminReply?: boolean;
  user: {
    _id: string;
    username: string;
  } | null;
};

export type AdminPlace = {
  _id: string;
  placeName: string;
  location: string;
  imageUrl: string;
  caption: string;
  moodTags: string[];
  likesCount: number;
  commentsCount: number;
  savesCount?: number;
  isPublished: boolean;
  comments: PlaceComment[];
  createdAt: string;
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

const initialForm: FormState = {
  placeName: "",
  location: "",
  caption: "",
  moodTags: "",
  activities: "",
  bestTime: "",
  weather: "",
  vibe: "",
  travelTip: "",
  isPublished: true,
};

type Props = {
  onClose: () => void;
  onPlaceCreated: (place: AdminPlace) => void;
};

export default function AddPlaceModal({ onClose, onPlaceCreated }: Props) {
  const [form, setForm] = useState<FormState>(initialForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const previewUrl = useMemo(() => {
    if (!imageFile) return "";
    return URL.createObjectURL(imageFile);
  }, [imageFile]);

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

  const resetForm = () => {
    setForm(initialForm);
    setImageFile(null);
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!imageFile) {
      setError("Please choose a place image.");
      return;
    }

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
      formData.append("image", imageFile);
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

      const res = await api.post("/places", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setSuccess("Place created successfully.");
      onPlaceCreated(res.data.place);
      resetForm();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to create place.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-post-modal-backdrop" onClick={onClose}>
      <div
        className="admin-form-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="admin-form-modal__top">
          <div>
            <h2>Add Place</h2>
            <p>Create a new explore place post for users.</p>
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
                    <FiPlus />
                    Basic Details
                  </h3>
                  <p>Main information shown in the places feed.</p>
                </div>

                <div className="admin-form-grid admin-form-grid--2">
                  <label className="admin-field">
                    <span>Place Name *</span>
                    <input
                      type="text"
                      name="placeName"
                      placeholder="Batticaloa Beach"
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
                      placeholder="Batticaloa"
                      value={form.location}
                      onChange={handleChange}
                    />
                  </label>
                </div>

                <label className="admin-field">
                  <span>Caption *</span>
                  <textarea
                    name="caption"
                    placeholder="A calm beach escape with soft breeze and peaceful sunset views."
                    value={form.caption}
                    onChange={handleChange}
                    rows={4}
                  />
                </label>

                <div className="admin-form-grid admin-form-grid--2">
                  <label className="admin-field">
                    <span>Mood Tags</span>
                    <input
                      type="text"
                      name="moodTags"
                      placeholder="calm, healing, sunset"
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
                      placeholder="beach walk, photography, relaxing"
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
                      placeholder="Evening"
                      value={form.bestTime}
                      onChange={handleChange}
                    />
                  </label>

                  <label className="admin-field">
                    <span>Weather</span>
                    <input
                      type="text"
                      name="weather"
                      placeholder="Warm and breezy"
                      value={form.weather}
                      onChange={handleChange}
                    />
                  </label>

                  <label className="admin-field">
                    <span>Vibe</span>
                    <input
                      type="text"
                      name="vibe"
                      placeholder="Peaceful and refreshing"
                      value={form.vibe}
                      onChange={handleChange}
                    />
                  </label>

                  <label className="admin-field">
                    <span>Travel Tip</span>
                    <input
                      type="text"
                      name="travelTip"
                      placeholder="Visit before sunset for the best view."
                      value={form.travelTip}
                      onChange={handleChange}
                    />
                  </label>

                  <label className="admin-field admin-field--toggle">
                    <span>Publish Now</span>
                    <input
                      type="checkbox"
                      name="isPublished"
                      checked={form.isPublished}
                      onChange={handleChange}
                    />
                  </label>
                </div>

                {error ? (
                  <div className="admin-form-message error">{error}</div>
                ) : null}

                {success ? (
                  <div className="admin-form-message success">{success}</div>
                ) : null}

                <div className="admin-form-modal__actions">
                  <button
                    type="button"
                    className="admin-secondary-btn"
                    onClick={onClose}
                    disabled={submitting}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="admin-submit-btn admin-submit-btn--inline"
                    disabled={submitting}
                  >
                    {submitting ? "Posting..." : "Post Place"}
                  </button>
                </div>
              </div>
            </div>

            <div className="admin-form-modal__side">
              <div className="admin-form-card admin-form-card--sticky">
                <div className="admin-form-card__head">
                  <h3>
                    <FiImage />
                    Place Image
                  </h3>
                  <p>Upload the main image for this place post.</p>
                </div>

                <label className="admin-upload-box">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                  />

                  {previewUrl ? (
                    <img src={previewUrl} alt="Place preview" />
                  ) : (
                    <div className="admin-upload-box__placeholder">
                      <FiImage />
                      <span>Click to upload image</span>
                    </div>
                  )}
                </label>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}