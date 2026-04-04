"use client";

import { useState } from "react";
import Link from "next/link";
import { FiArrowLeft, FiMail, FiSend } from "react-icons/fi";
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
        response.data.message || "Password reset link sent to your email"
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
    <section className="packpalz-auth-page">
      <div className="packpalz-auth-shell">
        <div className="packpalz-auth-visual">
          <div className="packpalz-auth-visual__badge">PackPalz</div>
          <h1>Forgot your password?</h1>
          <p>
            No worries. Enter your email and we’ll send you a secure reset link
            so you can get back into your account.
          </p>

          <div className="packpalz-auth-visual__card">
            <div className="packpalz-auth-visual__icon">
              <FiMail />
            </div>
            <div>
              <strong>Account recovery</strong>
              <span>Quick, secure, and sent straight to your inbox.</span>
            </div>
          </div>
        </div>

        <div className="packpalz-auth-card">
          <Link href="/" className="packpalz-auth-back">
            <FiArrowLeft />
            <span>Back to home</span>
          </Link>

          <div className="packpalz-auth-card__head">
            <div className="packpalz-auth-card__mini-icon">
              <FiSend />
            </div>
            <h2>Reset password</h2>
            <p>
              Enter the email linked to your PackPalz account and we’ll send the
              reset link.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="packpalz-auth-form">
            <div className="packpalz-auth-field">
              <label>Email address</label>
              <input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrorMessage("");
                  setSuccessMessage("");
                }}
              />
            </div>

            {errorMessage && <div className="form-error-box">{errorMessage}</div>}
            {successMessage && (
              <div className="form-success-box">{successMessage}</div>
            )}

            <button
              type="submit"
              className="packpalz-auth-submit"
              disabled={loading}
            >
              {loading ? "Sending..." : "Send reset link"}
            </button>
          </form>

          <div className="packpalz-auth-bottom">
            <span>Remembered your password?</span>
            <Link href="/">Go back to login</Link>
          </div>
        </div>
      </div>
    </section>
  );
}