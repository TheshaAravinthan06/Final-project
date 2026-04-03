"use client";

import { useEffect, useMemo, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { FiX, FiUsers, FiPhone, FiMail, FiUser, FiFileText } from "react-icons/fi";
import api from "@/lib/axios";

type TravelPick = {
  _id: string;
  title: string;
  place: string;
  imageUrl: string;
  price: number;
  advancePercentage?: number;
  advanceAmount?: number;
  remainingAmount?: number;
};

type Props = {
  open: boolean;
  pick: TravelPick | null;
  onClose: () => void;
};

type MeUser = {
  username?: string;
  email?: string;
  name?: string;
};

const formatCurrency = (value?: number) => {
  return `Rs. ${Number(value || 0).toLocaleString()}`;
};

export default function TravelPickPaymentModal({ open, pick, onClose }: Props) {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    travelersCount: 1,
    specialNote: "",
    paymentType: "advance",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    const fetchMe = async () => {
      try {
        const res = await api.get("/auth/me");
        const user: MeUser = res.data?.user || {};
        setForm((prev) => ({
          ...prev,
          fullName: user.name || user.username || "",
          email: user.email || "",
        }));
      } catch (err) {
        console.error("Failed to load current user:", err);
      }
    };

    fetchMe();
  }, [open]);

  useEffect(() => {
    if (!open) {
      setError("");
      setLoading(false);
    }
  }, [open]);

  const selectedAmount = useMemo(() => {
    if (!pick) return 0;
    return form.paymentType === "full"
      ? Number(pick.price || 0)
      : Number(pick.advanceAmount || 0);
  }, [form.paymentType, pick]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]:
        name === "travelersCount" ? Math.max(1, Number(value || 1)) : value,
    }));
  };

  const handlePaymentType = (value: "advance" | "full") => {
    setForm((prev) => ({
      ...prev,
      paymentType: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!pick?._id) return;

    try {
      setLoading(true);
      setError("");

      const res = await api.post("/payments/checkout-session", {
        travelPickId: pick._id,
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        travelersCount: form.travelersCount,
        specialNote: form.specialNote,
        paymentType: form.paymentType,
      });

      const sessionId = res.data?.sessionId;
      const publishableKey =
        res.data?.publishableKey ||
        process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

      if (!sessionId || !publishableKey) {
        throw new Error("Stripe session was not created properly");
      }

      const stripe = await loadStripe(publishableKey);

      if (!stripe) {
        throw new Error("Stripe failed to load");
      }

      const result = await stripe.redirectToCheckout({ sessionId });

      if (result.error?.message) {
        throw new Error(result.error.message);
      }
    } catch (err: any) {
      console.error("Stripe checkout failed:", err);
      setError(err?.response?.data?.message || err?.message || "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  if (!open || !pick) return null;

  return (
    <div className="travel-payment-modal-backdrop" onClick={onClose}>
      <div
        className="travel-payment-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="travel-payment-modal__head">
          <div>
            <p className="travel-payment-modal__eyebrow">Complete your booking</p>
            <h2>{pick.title}</h2>
            <span>{pick.place}</span>
          </div>

          <button
            type="button"
            className="travel-payment-modal__close"
            onClick={onClose}
            aria-label="Close payment modal"
          >
            <FiX />
          </button>
        </div>

        <div className="travel-payment-modal__summary">
          <div className="travel-payment-modal__summary-row">
            <span>Package price</span>
            <strong>{formatCurrency(pick.price)}</strong>
          </div>
          <div className="travel-payment-modal__summary-row">
            <span>Advance ({pick.advancePercentage || 0}%)</span>
            <strong>{formatCurrency(pick.advanceAmount)}</strong>
          </div>
          <div className="travel-payment-modal__summary-row">
            <span>Pay now</span>
            <strong>{formatCurrency(selectedAmount)}</strong>
          </div>
        </div>

        <form className="travel-payment-modal__form" onSubmit={handleSubmit}>
          <div className="travel-payment-modal__payment-types">
            <button
              type="button"
              className={`travel-payment-chip ${
                form.paymentType === "advance" ? "active" : ""
              }`}
              onClick={() => handlePaymentType("advance")}
            >
              Pay Advance
            </button>

            <button
              type="button"
              className={`travel-payment-chip ${
                form.paymentType === "full" ? "active" : ""
              }`}
              onClick={() => handlePaymentType("full")}
            >
              Pay Full
            </button>
          </div>

          <label className="travel-payment-field">
            <span>
              <FiUser />
              Full name
            </span>
            <input
              type="text"
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              placeholder="Enter your full name"
              required
            />
          </label>

          <label className="travel-payment-field">
            <span>
              <FiMail />
              Email
            </span>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
            />
          </label>

          <label className="travel-payment-field">
            <span>
              <FiPhone />
              Phone
            </span>
            <input
              type="text"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="Enter your phone number"
              required
            />
          </label>

          <label className="travel-payment-field">
            <span>
              <FiUsers />
              Travelers count
            </span>
            <input
              type="number"
              name="travelersCount"
              min={1}
              value={form.travelersCount}
              onChange={handleChange}
              required
            />
          </label>

          <label className="travel-payment-field">
            <span>
              <FiFileText />
              Special note
            </span>
            <textarea
              name="specialNote"
              value={form.specialNote}
              onChange={handleChange}
              rows={4}
              placeholder="Anything important we should know?"
            />
          </label>

          {error ? (
            <div className="travel-payment-modal__error">{error}</div>
          ) : null}

          <button
            type="submit"
            className="travel-payment-modal__submit"
            disabled={loading}
          >
            {loading
              ? "Redirecting to Stripe..."
              : `Pay ${formatCurrency(selectedAmount)}`}
          </button>
        </form>
      </div>
    </div>
  );
}