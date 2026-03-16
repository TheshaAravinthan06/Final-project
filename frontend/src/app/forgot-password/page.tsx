"use client";

import { useState } from "react";
import Link from "next/link";
import api from "@/lib/axios";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const validateEmail = () => {
    if (!email.trim()) {
      setErrorMessage("Email is required");
      return false;
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setErrorMessage("Enter a valid email address");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    if (!validateEmail()) return;

    setLoading(true);

    try {
      const response = await api.post("/auth/forgot-password", {
        email: email.trim(),
      });

      setSuccessMessage(
        response.data.message || "Reset link sent to your email"
      );

      setEmail("");
    } catch (error: any) {
      setErrorMessage(
        error?.response?.data?.message || "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="forgot-page">
      <div className="forgot-page-container">
        <Link href="/" className="forgot-back-btn" aria-label="Back to home">
          ←
        </Link>

        <h1>Find your account</h1>

        <p className="forgot-subtext">
          Enter your email to receive a password reset link.
        </p>

        <form onSubmit={handleSubmit} className="forgot-form">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setErrorMessage("");
              setSuccessMessage("");
            }}
          />

          <p className="forgot-help-text">
            We’ll send a password reset link to your email for login and account
            recovery purposes.
          </p>

          {errorMessage && (
            <div className="form-error-box">{errorMessage}</div>
          )}

          {successMessage && (
            <div className="form-success-box">{successMessage}</div>
          )}

          <button
            type="submit"
            className="forgot-continue-btn"
            disabled={loading}
          >
            {loading ? "Sending..." : "Continue"}
          </button>
        </form>

        <footer className="forgot-footer">
          <div className="forgot-footer-links">
            <Link href="/">Home</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/">Explore Places</Link>
            <Link href="/">Travel Picks</Link>
            <Link href="/">Community</Link>
            <Link href="/">Privacy</Link>
            <Link href="/">Terms</Link>
          </div>

          <p className="forgot-footer-copy">
            © {new Date().getFullYear()} Travel App. Discover trips that match
            your mood.
          </p>
        </footer>
      </div>
    </section>
  );
}