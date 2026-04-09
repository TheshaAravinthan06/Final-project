"use client";

import { FormEvent, useMemo, useState } from "react";
import api from "@/lib/axios";
import { useRouter } from "next/navigation";
import { FiArrowLeft, FiImage, FiPlusCircle } from "react-icons/fi";

const defaultAdvancePolicy =
  "30% advance payment is required to confirm the booking.";
const defaultCancellationPolicy =
  "No cancellation after confirmation due to travel arrangements.";
const defaultRefundPolicy =
  "Advance payment is non-refundable after confirmation.";

export default function NewTravelPickPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [place, setPlace] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [caption, setCaption] = useState("");
  const [price, setPrice] = useState("");

  const [placesToVisit, setPlacesToVisit] = useState("");
  const [accommodation, setAccommodation] = useState("");
  const [meals, setMeals] = useState("");
  const [transportation, setTransportation] = useState("");
  const [tourGuide, setTourGuide] = useState("");
  const [paymentInfo, setPaymentInfo] = useState("");
  const [moreDetails, setMoreDetails] = useState("");

  const [advancePolicy, setAdvancePolicy] = useState(defaultAdvancePolicy);
  const [advancePercentage, setAdvancePercentage] = useState("30");
  const [cancellationPolicy, setCancellationPolicy] = useState(
    defaultCancellationPolicy
  );
  const [refundPolicy, setRefundPolicy] = useState(defaultRefundPolicy);
  const [isPublished, setIsPublished] = useState(true);

  const [image, setImage] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"error" | "success">("error");

  const imagePreview = useMemo(() => {
    if (!image) return "";
    return URL.createObjectURL(image);
  }, [image]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (!image) {
      setMessageType("error");
      setMessage("Please select an image.");
      return;
    }

    try {
      setSubmitting(true);

      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("place", place.trim());
      formData.append("startDate", startDate);
      formData.append("endDate", endDate);
      formData.append("caption", caption.trim());
      formData.append("price", price);
      formData.append("placesToVisit", placesToVisit);
      formData.append("accommodation", accommodation.trim());
      formData.append("meals", meals.trim());
      formData.append("transportation", transportation.trim());
      formData.append("tourGuide", tourGuide.trim());
      formData.append("paymentInfo", paymentInfo.trim());
      formData.append("moreDetails", moreDetails.trim());
      formData.append("advancePolicy", advancePolicy.trim());
      formData.append("advancePercentage", advancePercentage);
      formData.append("cancellationPolicy", cancellationPolicy.trim());
      formData.append("refundPolicy", refundPolicy.trim());
      formData.append("isPublished", String(isPublished));
      formData.append("image", image);

      const res = await api.post("/travel-picks", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const newId = res.data?.travelPick?._id;

      setMessageType("success");
      setMessage("Travel pick created successfully.");

      if (newId) {
        router.push(`/admin/travel-picks/${newId}`);
        return;
      }

      router.push("/admin/travel-picks");
    } catch (error: any) {
      console.error(
        "Failed to create travel pick:",
        error?.response?.data || error
      );
      setMessageType("error");
      setMessage(
        error?.response?.data?.message || "Failed to create travel pick."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="admin-places-page">
      <div className="admin-page-head">
        <div>
          <h1>Create Travel Pick</h1>
          <p>Add a new travel package without changing your existing admin UI.</p>
        </div>

        <button
          type="button"
          className="admin-page-add-btn"
          onClick={() => router.push("/admin/travel-picks")}
        >
          <FiArrowLeft />
          Back to Travel Picks
        </button>
      </div>

      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.35fr) minmax(320px, 0.65fr)",
            gap: "20px",
            alignItems: "start",
          }}
        >
          <div className="admin-form-card">
            <div className="admin-form-card__head">
              <h3>
                <FiPlusCircle />
                Package Details
              </h3>
              <p>Fill the travel pick information below.</p>
            </div>

            {message ? (
              <div className={`admin-form-alert ${messageType}`}>{message}</div>
            ) : null}

            <div className="admin-form-grid admin-form-grid--2">
              <label className="admin-field">
                <span>Title</span>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter package title"
                  required
                />
              </label>

              <label className="admin-field">
                <span>Place</span>
                <input
                  type="text"
                  value={place}
                  onChange={(e) => setPlace(e.target.value)}
                  placeholder="Enter destination"
                  required
                />
              </label>

              <label className="admin-field">
                <span>Start Date</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </label>

              <label className="admin-field">
                <span>End Date</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </label>

              <label className="admin-field">
                <span>Price</span>
                <input
                  type="number"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Enter price"
                  required
                />
              </label>

              <label className="admin-field">
                <span>Advance Percentage</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={advancePercentage}
                  onChange={(e) => setAdvancePercentage(e.target.value)}
                  placeholder="30"
                />
              </label>
            </div>

            <label className="admin-field">
              <span>Caption</span>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Write package caption"
                required
              />
            </label>

            <label className="admin-field">
              <span>Places To Visit</span>
              <small>Separate places with commas</small>
              <input
                type="text"
                value={placesToVisit}
                onChange={(e) => setPlacesToVisit(e.target.value)}
                placeholder="Ella Rock, Nine Arches Bridge, Ravana Falls"
              />
            </label>

            <div className="admin-form-grid admin-form-grid--2">
              <label className="admin-field">
                <span>Accommodation</span>
                <input
                  type="text"
                  value={accommodation}
                  onChange={(e) => setAccommodation(e.target.value)}
                  placeholder="Hotel / stay details"
                />
              </label>

              <label className="admin-field">
                <span>Meals</span>
                <input
                  type="text"
                  value={meals}
                  onChange={(e) => setMeals(e.target.value)}
                  placeholder="Meal details"
                />
              </label>

              <label className="admin-field">
                <span>Transportation</span>
                <input
                  type="text"
                  value={transportation}
                  onChange={(e) => setTransportation(e.target.value)}
                  placeholder="Transport details"
                />
              </label>

              <label className="admin-field">
                <span>Tour Guide</span>
                <input
                  type="text"
                  value={tourGuide}
                  onChange={(e) => setTourGuide(e.target.value)}
                  placeholder="Guide details"
                />
              </label>
            </div>

            <label className="admin-field">
              <span>Payment Info</span>
              <textarea
                value={paymentInfo}
                onChange={(e) => setPaymentInfo(e.target.value)}
                placeholder="Optional payment information"
              />
            </label>

            <label className="admin-field">
              <span>More Details</span>
              <textarea
                value={moreDetails}
                onChange={(e) => setMoreDetails(e.target.value)}
                placeholder="Optional extra details"
              />
            </label>

            <label className="admin-field">
              <span>Advance Policy</span>
              <textarea
                value={advancePolicy}
                onChange={(e) => setAdvancePolicy(e.target.value)}
              />
            </label>

            <div className="admin-form-grid admin-form-grid--2">
              <label className="admin-field">
                <span>Cancellation Policy</span>
                <textarea
                  value={cancellationPolicy}
                  onChange={(e) => setCancellationPolicy(e.target.value)}
                />
              </label>

              <label className="admin-field">
                <span>Refund Policy</span>
                <textarea
                  value={refundPolicy}
                  onChange={(e) => setRefundPolicy(e.target.value)}
                />
              </label>
            </div>

            <label className="admin-field admin-field--toggle">
              <span>Publish Now</span>
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
              />
            </label>

            <div className="admin-form-actions">
              <button
                type="button"
                className="admin-form-secondary-btn"
                onClick={() => router.push("/admin/travel-picks")}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="admin-form-primary-btn"
                disabled={submitting}
              >
                {submitting ? "Creating..." : "Create Travel Pick"}
              </button>
            </div>
          </div>

          <div className="admin-form-card admin-form-card--sticky">
            <div className="admin-form-card__head">
              <h3>
                <FiImage />
                Cover Image
              </h3>
              <p>Upload the package image here.</p>
            </div>

            <label className="admin-upload-box">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImage(e.target.files?.[0] || null)}
              />

              {imagePreview ? (
                <img src={imagePreview} alt="Travel pick preview" />
              ) : (
                <div className="admin-upload-box__placeholder">
                  <FiImage />
                  <span>Click to upload image</span>
                </div>
              )}
            </label>
          </div>
        </div>
      </form>
    </section>
  );
}