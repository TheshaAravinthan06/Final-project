"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { FiArrowLeft, FiEye, FiEyeOff, FiLock } from "react-icons/fi";
import api from "@/lib/axios";

type ResetErrors = {
  password?: string;
  confirmPassword?: string;
  general?: string;
};

export default function ResetPasswordPage() {
  const params = useParams();
  const router = useRouter();
  const token = params?.token as string;

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<ResetErrors>({});
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateForm = () => {
    const newErrors: ResetErrors = {};

    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = "Confirm password is required";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
      general: "",
    }));

    setSuccessMessage("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage("");
    setErrors({});

    if (!validateForm()) return;

    setLoading(true);

    try {
      const response = await api.put(`/auth/reset-password/${token}`, formData);

      setSuccessMessage(
        response.data.message || "Password reset successful"
      );

      setFormData({
        password: "",
        confirmPassword: "",
      });

      setTimeout(() => {
        router.push("/");
      }, 1800);
    } catch (error: any) {
      setErrors({
        general: error?.response?.data?.message || "Something went wrong",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="packpalz-auth-page">
      <div className="packpalz-auth-shell">
        <div className="packpalz-auth-visual">
          <div className="packpalz-auth-visual__badge">PackPalz</div>
          <h1>Create a new password</h1>
          <p>
            Choose a strong new password for your PackPalz account and continue
            your journey safely.
          </p>

          <div className="packpalz-auth-visual__card">
            <div className="packpalz-auth-visual__icon">
              <FiLock />
            </div>
            <div>
              <strong>Secure reset</strong>
              <span>Your password should be at least 8 characters long.</span>
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
              <FiLock />
            </div>
            <h2>Reset password</h2>
            <p>Enter and confirm your new password below.</p>
          </div>

          {successMessage && (
            <div className="form-success-box">{successMessage}</div>
          )}

          {errors.general && (
            <div className="form-error-box">{errors.general}</div>
          )}

          <form className="packpalz-auth-form" onSubmit={handleSubmit}>
            <div className="packpalz-auth-field">
              <label>New password</label>
              <div className="password-field">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter new password"
                  value={formData.password}
                  onChange={handleChange}
                  className={errors.password ? "input-error" : ""}
                />
                <button
                  type="button"
                  className="eye-icon"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              {errors.password && (
                <p className="field-error-text">{errors.password}</p>
              )}
            </div>

            <div className="packpalz-auth-field">
              <label>Confirm password</label>
              <div className="password-field">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Confirm new password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={errors.confirmPassword ? "input-error" : ""}
                />
                <button
                  type="button"
                  className="eye-icon"
                  onClick={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                >
                  {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="field-error-text">{errors.confirmPassword}</p>
              )}
            </div>

            <button
              type="submit"
              className="packpalz-auth-submit"
              disabled={loading}
            >
              {loading ? "Updating..." : "Update password"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}