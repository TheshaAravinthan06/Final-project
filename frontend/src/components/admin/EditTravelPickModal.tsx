"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/lib/axios";
import {
  FiCalendar,
  FiDollarSign,
  FiImage,
  FiMapPin,
  FiPackage,
  FiSave,
  FiX,
} from "react-icons/fi";

export type EditableTravelPick = {
  _id: string;
  title: string;
  place: string;
  imageUrl: string;
  startDate: string;
  endDate: string;
  caption: string;
  placesToVisit?: string[];
  accommodation?: string;
  meals?: string;
  transportation?: string;
  tourGuide?: string;
  paymentInfo?: string;
  moreDetails?: string;
  advancePolicy?: string;
  advancePercentage?: number;
  cancellationPolicy?: string;
  refundPolicy?: string;
  price: number;
  isPublished: boolean;
  createdAt?: string;
};

type FormState = {
  title: string;
  place: string;
  startDate: string;
  endDate: string;
  caption: string;
  placesToVisit: string;
  accommodation: string;
  meals: string;
  transportation: string;
  tourGuide: string;
  paymentInfo: string;
  moreDetails: string;
  advancePolicy: string;
  advancePercentage: string;
  cancellationPolicy: string;
  refundPolicy: string;
  price: string;
  isPublished: boolean;
};

type Props = {
  travelPick: EditableTravelPick;
  onClose: () => void;
  onTravelPickUpdated: (updatedTravelPick: EditableTravelPick) => void;
};

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

const getImageSrc = (imageUrl?: string) => {
  if (!imageUrl) return "/images/ella.jpg";
  if (imageUrl.startsWith("http")) return imageUrl;
  return `${BACKEND_URL}${imageUrl}`;
};

const toDateInputValue = (value?: string) => {
  if (!value) return "";
  return new Date(value).toISOString().split("T")[0];
};

export default function EditTravelPickModal({
  travelPick,
  onClose,
  onTravelPickUpdated,
}: Props) {
  const [form, setForm] = useState<FormState>({
    title: travelPick.title || "",
    place: travelPick.place || "",
    startDate: toDateInputValue(travelPick.startDate),
    endDate: toDateInputValue(travelPick.endDate),
    caption: travelPick.caption || "",
    placesToVisit: (travelPick.placesToVisit || []).join(", "),
    accommodation: travelPick.accommodation || "",
    meals: travelPick.meals || "",
    transportation: travelPick.transportation || "",
    tourGuide: travelPick.tourGuide || "",
    paymentInfo: travelPick.paymentInfo || "",
    moreDetails: travelPick.moreDetails || "",
    advancePolicy: travelPick.advancePolicy || "",
    advancePercentage: String(travelPick.advancePercentage ?? 30),
    cancellationPolicy: travelPick.cancellationPolicy || "",
    refundPolicy: travelPick.refundPolicy || "",
    price: String(travelPick.price ?? ""),
    isPublished: travelPick.isPublished ?? true,
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    setForm({
      title: travelPick.title || "",
      place: travelPick.place || "",
      startDate: toDateInputValue(travelPick.startDate),
      endDate: toDateInputValue(travelPick.endDate),
      caption: travelPick.caption || "",
      placesToVisit: (travelPick.placesToVisit || []).join(", "),
      accommodation: travelPick.accommodation || "",
      meals: travelPick.meals || "",
      transportation: travelPick.transportation || "",
      tourGuide: travelPick.tourGuide || "",
      paymentInfo: travelPick.paymentInfo || "",
      moreDetails: travelPick.moreDetails || "",
      advancePolicy: travelPick.advancePolicy || "",
      advancePercentage: String(travelPick.advancePercentage ?? 30),
      cancellationPolicy: travelPick.cancellationPolicy || "",
      refundPolicy: travelPick.refundPolicy || "",
      price: String(travelPick.price ?? ""),
      isPublished: travelPick.isPublished ?? true,
    });
    setImageFile(null);
    setError("");
    setSuccess("");
  }, [travelPick]);

  const previewUrl = useMemo(() => {
    if (!imageFile) return getImageSrc(travelPick.imageUrl);
    return URL.createObjectURL(imageFile);
  }, [imageFile, travelPick.imageUrl]);

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
      !form.title.trim() ||
      !form.place.trim() ||
      !form.startDate ||
      !form.endDate ||
      !form.caption.trim() ||
      !form.price.trim()
    ) {
      setError("Please fill all required fields.");
      return;
    }

    try {
      setSubmitting(true);

      const formData = new FormData();
      if (imageFile) {
        formData.append("image", imageFile);
      }

      formData.append("title", form.title);
      formData.append("place", form.place);
      formData.append("startDate", form.startDate);
      formData.append("endDate", form.endDate);
      formData.append("caption", form.caption);
      formData.append("placesToVisit", form.placesToVisit);
      formData.append("accommodation", form.accommodation);
      formData.append("meals", form.meals);
      formData.append("transportation", form.transportation);
      formData.append("tourGuide", form.tourGuide);
      formData.append("paymentInfo", form.paymentInfo);
      formData.append("moreDetails", form.moreDetails);
      formData.append("advancePolicy", form.advancePolicy);
      formData.append("advancePercentage", form.advancePercentage);
      formData.append("cancellationPolicy", form.cancellationPolicy);
      formData.append("refundPolicy", form.refundPolicy);
      formData.append("price", form.price);
      formData.append("isPublished", String(form.isPublished));

      const res = await api.patch(`/travel-picks/${travelPick._id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setSuccess("Travel pick updated successfully.");
      onTravelPickUpdated(res.data.travelPick);
      setTimeout(() => {
        onClose();
      }, 300);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to update package.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-post-modal-backdrop" onClick={onClose}>
      <div className="admin-form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="admin-form-modal__top">
          <div>
            <h2>Edit Travel Pick</h2>
            <p>Update this package in a clean edit modal.</p>
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
                    <FiPackage />
                    Basic Details
                  </h3>
                  <p>Edit the main package details.</p>
                </div>

                <div className="admin-form-grid admin-form-grid--2">
                  <label className="admin-field">
                    <span>Package Title *</span>
                    <input
                      type="text"
                      name="title"
                      value={form.title}
                      onChange={handleChange}
                    />
                  </label>

                  <label className="admin-field">
                    <span>
                      <FiMapPin />
                      Place *
                    </span>
                    <input
                      type="text"
                      name="place"
                      value={form.place}
                      onChange={handleChange}
                    />
                  </label>

                  <label className="admin-field">
                    <span>
                      <FiCalendar />
                      Start Date *
                    </span>
                    <input
                      type="date"
                      name="startDate"
                      value={form.startDate}
                      onChange={handleChange}
                    />
                  </label>

                  <label className="admin-field">
                    <span>
                      <FiCalendar />
                      End Date *
                    </span>
                    <input
                      type="date"
                      name="endDate"
                      value={form.endDate}
                      onChange={handleChange}
                    />
                  </label>

                  <label className="admin-field">
                    <span>
                      <FiDollarSign />
                      Price *
                    </span>
                    <input
                      type="number"
                      name="price"
                      min="0"
                      value={form.price}
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
                  <span>Caption *</span>
                  <textarea
                    name="caption"
                    rows={4}
                    value={form.caption}
                    onChange={handleChange}
                  />
                </label>

                <label className="admin-field">
                  <span>Places to Visit</span>
                  <input
                    type="text"
                    name="placesToVisit"
                    value={form.placesToVisit}
                    onChange={handleChange}
                  />
                  <small>Separate by commas</small>
                </label>
              </div>

              <div className="admin-form-card">
                <div className="admin-form-card__head">
                  <h3>
                    <FiSave />
                    Package Details
                  </h3>
                  <p>Update accommodation, payments and policies.</p>
                </div>

                <div className="admin-form-grid admin-form-grid--2">
                  <label className="admin-field">
                    <span>Accommodation</span>
                    <input
                      type="text"
                      name="accommodation"
                      value={form.accommodation}
                      onChange={handleChange}
                    />
                  </label>

                  <label className="admin-field">
                    <span>Meals</span>
                    <input
                      type="text"
                      name="meals"
                      value={form.meals}
                      onChange={handleChange}
                    />
                  </label>

                  <label className="admin-field">
                    <span>Transportation</span>
                    <input
                      type="text"
                      name="transportation"
                      value={form.transportation}
                      onChange={handleChange}
                    />
                  </label>

                  <label className="admin-field">
                    <span>Tour Guide</span>
                    <input
                      type="text"
                      name="tourGuide"
                      value={form.tourGuide}
                      onChange={handleChange}
                    />
                  </label>

                  <label className="admin-field">
                    <span>Advance %</span>
                    <input
                      type="number"
                      min="0"
                      name="advancePercentage"
                      value={form.advancePercentage}
                      onChange={handleChange}
                    />
                  </label>

                  <label className="admin-field">
                    <span>Payment Info</span>
                    <input
                      type="text"
                      name="paymentInfo"
                      value={form.paymentInfo}
                      onChange={handleChange}
                    />
                  </label>
                </div>

                <label className="admin-field">
                  <span>More Details</span>
                  <textarea
                    name="moreDetails"
                    rows={3}
                    value={form.moreDetails}
                    onChange={handleChange}
                  />
                </label>

                <label className="admin-field">
                  <span>Advance Policy</span>
                  <textarea
                    name="advancePolicy"
                    rows={3}
                    value={form.advancePolicy}
                    onChange={handleChange}
                  />
                </label>

                <label className="admin-field">
                  <span>Cancellation Policy</span>
                  <textarea
                    name="cancellationPolicy"
                    rows={3}
                    value={form.cancellationPolicy}
                    onChange={handleChange}
                  />
                </label>

                <label className="admin-field">
                  <span>Refund Policy</span>
                  <textarea
                    name="refundPolicy"
                    rows={3}
                    value={form.refundPolicy}
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
                  <p>Change the package image if needed.</p>
                </div>

                <label className="admin-upload-box">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Travel pick preview" />
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