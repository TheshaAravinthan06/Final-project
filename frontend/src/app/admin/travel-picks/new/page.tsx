"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { FiImage, FiMapPin, FiCalendar, FiDollarSign, FiPackage } from "react-icons/fi";

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

const initialForm: FormState = {
  title: "",
  place: "",
  startDate: "",
  endDate: "",
  caption: "",
  placesToVisit: "",
  accommodation: "",
  meals: "",
  transportation: "",
  tourGuide: "",
  paymentInfo: "",
  moreDetails: "",
  advancePolicy: "30% advance payment is required to confirm the booking.",
  advancePercentage: "30",
  cancellationPolicy: "No cancellation after confirmation due to travel arrangements.",
  refundPolicy: "Advance payment is non-refundable after confirmation.",
  price: "",
  isPublished: true,
};

export default function NewTravelPickPage() {
  const router = useRouter();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!imageFile) {
      setError("Please choose a package image.");
      return;
    }

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
      formData.append("image", imageFile);
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

      await api.post("/travel-picks", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setSuccess("Package created successfully.");

      setTimeout(() => {
        router.push("/admin/travel-picks");
      }, 900);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to create package.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="admin-package-form-page">
      <div className="admin-page-head">
        <div>
          <h1>Add Package</h1>
          <p>Create a polished travel pick with full trip details and image upload.</p>
        </div>
      </div>

      <form className="admin-package-form" onSubmit={handleSubmit}>
        <div className="admin-package-form__main">
          <div className="admin-form-card">
            <div className="admin-form-card__head">
              <h3>
                <FiPackage />
                Basic Details
              </h3>
              <p>Main package information shown to users.</p>
            </div>

            <div className="admin-form-grid admin-form-grid--2">
              <label className="admin-field">
                <span>Package Title *</span>
                <input
                  type="text"
                  name="title"
                  placeholder="Ella Escape Weekend"
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
                  placeholder="Ella"
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
                  placeholder="15000"
                  value={form.price}
                  onChange={handleChange}
                  min="0"
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

            <label className="admin-field">
              <span>Caption *</span>
              <textarea
                name="caption"
                placeholder="A relaxing group getaway with scenic views, fresh air, and curated experiences."
                value={form.caption}
                onChange={handleChange}
                rows={4}
              />
            </label>

            <label className="admin-field">
              <span>Places to Visit</span>
              <input
                type="text"
                name="placesToVisit"
                placeholder="Nine Arch Bridge, Little Adam's Peak, Ravana Falls"
                value={form.placesToVisit}
                onChange={handleChange}
              />
              <small>Separate places with commas.</small>
            </label>
          </div>

          <div className="admin-form-card">
            <div className="admin-form-card__head">
              <h3>Trip Includes</h3>
              <p>Add everything users need to know before booking.</p>
            </div>

            <div className="admin-form-grid admin-form-grid--2">
              <label className="admin-field">
                <span>Accommodation</span>
                <input
                  type="text"
                  name="accommodation"
                  placeholder="1 night hotel stay"
                  value={form.accommodation}
                  onChange={handleChange}
                />
              </label>

              <label className="admin-field">
                <span>Meals</span>
                <input
                  type="text"
                  name="meals"
                  placeholder="Breakfast and dinner included"
                  value={form.meals}
                  onChange={handleChange}
                />
              </label>

              <label className="admin-field">
                <span>Transportation</span>
                <input
                  type="text"
                  name="transportation"
                  placeholder="AC bus transport"
                  value={form.transportation}
                  onChange={handleChange}
                />
              </label>

              <label className="admin-field">
                <span>Tour Guide</span>
                <input
                  type="text"
                  name="tourGuide"
                  placeholder="Experienced local guide"
                  value={form.tourGuide}
                  onChange={handleChange}
                />
              </label>
            </div>

            <label className="admin-field">
              <span>Payment Info</span>
              <input
                type="text"
                name="paymentInfo"
                placeholder="Bank transfer / online payment available"
                value={form.paymentInfo}
                onChange={handleChange}
              />
            </label>

            <label className="admin-field">
              <span>More Details</span>
              <textarea
                name="moreDetails"
                placeholder="Pickup points, timing, what to bring, dress code, or any extra instructions."
                value={form.moreDetails}
                onChange={handleChange}
                rows={5}
              />
            </label>
          </div>

          <div className="admin-form-card">
            <div className="admin-form-card__head">
              <h3>Policies</h3>
              <p>Advance, cancellation, and refund details.</p>
            </div>

            <div className="admin-form-grid admin-form-grid--2">
              <label className="admin-field">
                <span>Advance Percentage</span>
                <input
                  type="number"
                  name="advancePercentage"
                  min="0"
                  max="100"
                  value={form.advancePercentage}
                  onChange={handleChange}
                />
              </label>

              <label className="admin-field">
                <span>Advance Policy</span>
                <input
                  type="text"
                  name="advancePolicy"
                  value={form.advancePolicy}
                  onChange={handleChange}
                />
              </label>
            </div>

            <label className="admin-field">
              <span>Cancellation Policy</span>
              <input
                type="text"
                name="cancellationPolicy"
                value={form.cancellationPolicy}
                onChange={handleChange}
              />
            </label>

            <label className="admin-field">
              <span>Refund Policy</span>
              <input
                type="text"
                name="refundPolicy"
                value={form.refundPolicy}
                onChange={handleChange}
              />
            </label>
          </div>
        </div>

        <div className="admin-package-form__side">
          <div className="admin-form-card admin-form-card--sticky">
            <div className="admin-form-card__head">
              <h3>
                <FiImage />
                Package Image
              </h3>
              <p>Upload from your gallery or laptop.</p>
            </div>

            <label className="admin-upload-box">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
              />
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" />
              ) : (
                <div className="admin-upload-box__placeholder">
                  <FiImage />
                  <span>Choose image</span>
                </div>
              )}
            </label>

            {error ? <div className="admin-form-message error">{error}</div> : null}
            {success ? <div className="admin-form-message success">{success}</div> : null}

            <button
              type="submit"
              className="admin-submit-btn"
              disabled={submitting}
            >
              {submitting ? "Creating..." : "Create Package"}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}