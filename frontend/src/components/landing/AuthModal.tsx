"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { FiEye, FiEyeOff } from "react-icons/fi";

type AuthModalProps = {
  type: "login" | "register" | null;
  onClose: () => void;
  onSwitch: (type: "login" | "register") => void;
};

type FieldErrors = {
  identifier?: string;
  username?: string;
  email?: string;
  dob?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
};

export default function AuthModal({
  type,
  onClose,
  onSwitch,
}: AuthModalProps) {
  const router = useRouter();

  const [loginData, setLoginData] = useState({
    identifier: "",
    password: "",
  });

  const [registerData, setRegisterData] = useState({
    username: "",
    email: "",
    dob: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const isLogin = type === "login";

  const resetModalState = () => {
    setLoginData({
      identifier: "",
      password: "",
    });

    setRegisterData({
      username: "",
      email: "",
      dob: "",
      password: "",
      confirmPassword: "",
    });

    setShowPassword(false);
    setShowConfirmPassword(false);
    setLoading(false);
    setSuccessMessage("");
    setFieldErrors({});
  };

  useEffect(() => {
    if (type) {
      resetModalState();
    }
  }, [type]);

  useEffect(() => {
    if (!type) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [type]);

  if (!type) return null;

  const validateLogin = () => {
    const errors: FieldErrors = {};

    if (!loginData.identifier.trim()) {
      errors.identifier = "Username or email is required";
    }

    if (!loginData.password.trim()) {
      errors.password = "Password is required";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateRegister = () => {
    const errors: FieldErrors = {};

    if (!registerData.username.trim()) {
      errors.username = "Username is required";
    }

    if (!registerData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^\S+@\S+\.\S+$/.test(registerData.email)) {
      errors.email = "Enter a valid email address";
    }

    if (!registerData.dob) {
      errors.dob = "Date of birth is required";
    }

    if (!registerData.password.trim()) {
      errors.password = "Password is required";
    } else if (registerData.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }

    if (!registerData.confirmPassword.trim()) {
      errors.confirmPassword = "Confirm password is required";
    } else if (registerData.password !== registerData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setLoginData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setFieldErrors((prev) => ({
      ...prev,
      [name]: "",
      general: "",
    }));
  };

  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setRegisterData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setFieldErrors((prev) => ({
      ...prev,
      [name]: "",
      general: "",
      ...(name === "password" ? { confirmPassword: "" } : {}),
    }));
  };

  const handleClose = () => {
    resetModalState();
    onClose();
  };

  const handleSwitchModal = (nextType: "login" | "register") => {
    resetModalState();
    onSwitch(nextType);
  };

  const handleSubmit = async () => {
    setSuccessMessage("");
    setFieldErrors({});

    const isValid = isLogin ? validateLogin() : validateRegister();
    if (!isValid) return;

    setLoading(true);

    try {
      if (isLogin) {
        await api.post("/auth/login", loginData);

        setSuccessMessage("Login successful");

        setTimeout(() => {
          handleClose();
          router.push("/home");
        }, 1200);
      } else {
        await api.post("/auth/register", registerData);

        setSuccessMessage("Registration successful");

        setTimeout(() => {
          handleSwitchModal("login");
        }, 1500);
      }
    } catch (error: any) {
      console.error("AUTH ERROR:", error?.response?.data || error);

      const backendMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Something went wrong";

      if (isLogin) {
        if (
          backendMessage.toLowerCase().includes("password") ||
          backendMessage.toLowerCase().includes("credential") ||
          backendMessage.toLowerCase().includes("invalid")
        ) {
          setFieldErrors({
            password: backendMessage,
          });
        } else {
          setFieldErrors({
            general: backendMessage,
          });
        }
      } else {
        if (backendMessage.toLowerCase().includes("email")) {
          setFieldErrors({ email: backendMessage });
        } else if (backendMessage.toLowerCase().includes("username")) {
          setFieldErrors({ username: backendMessage });
        } else if (backendMessage.toLowerCase().includes("password")) {
          setFieldErrors({ password: backendMessage });
        } else {
          setFieldErrors({ general: backendMessage });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:5000/auth/google";
  };

  const handleForgotPassword = () => {
    handleClose();
    router.push("/forgot-password");
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div
        className={`auth-modal ${isLogin ? "auth-modal-login" : "auth-modal-register"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="modal-close-btn"
          onClick={handleClose}
        >
          ×
        </button>

        <h2>{isLogin ? "Login" : "Create Account"}</h2>
        <p>
          {isLogin
            ? "Login to continue your travel journey."
            : "Register and start planning your next trip."}
        </p>

        {successMessage && (
          <div className="form-success-box">{successMessage}</div>
        )}

        {fieldErrors.general && (
          <div className="form-error-box">{fieldErrors.general}</div>
        )}

        {!isLogin ? (
          <div className="auth-form-grid">
            <div className="field-group">
              <input
                type="text"
                name="username"
                placeholder="Username"
                value={registerData.username}
                onChange={handleRegisterChange}
                className={fieldErrors.username ? "input-error" : ""}
              />
              {fieldErrors.username && (
                <p className="field-error-text">{fieldErrors.username}</p>
              )}
            </div>

            <div className="field-group">
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={registerData.email}
                onChange={handleRegisterChange}
                className={fieldErrors.email ? "input-error" : ""}
              />
              {fieldErrors.email && (
                <p className="field-error-text">{fieldErrors.email}</p>
              )}
            </div>
          </div>
        ) : (
          <div className="field-group">
            <input
              type="text"
              name="identifier"
              placeholder="Username or Email"
              value={loginData.identifier}
              onChange={handleLoginChange}
              className={fieldErrors.identifier ? "input-error" : ""}
            />
            {fieldErrors.identifier && (
              <p className="field-error-text">{fieldErrors.identifier}</p>
            )}
          </div>
        )}

        {!isLogin && (
          <div className="field-group">
            <input
              type="date"
              name="dob"
              value={registerData.dob}
              onChange={handleRegisterChange}
              className={fieldErrors.dob ? "input-error" : ""}
            />
            {fieldErrors.dob && (
              <p className="field-error-text">{fieldErrors.dob}</p>
            )}
          </div>
        )}

        <div className="field-group">
          <div className="password-field">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={isLogin ? loginData.password : registerData.password}
              onChange={isLogin ? handleLoginChange : handleRegisterChange}
              className={fieldErrors.password ? "input-error" : ""}
            />

            <button
              type="button"
              className="eye-icon"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>

          {fieldErrors.password && (
            <p className="field-error-text">{fieldErrors.password}</p>
          )}
        </div>

        {!isLogin && (
          <div className="field-group">
            <div className="password-field">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="Confirm Password"
                value={registerData.confirmPassword}
                onChange={handleRegisterChange}
                className={fieldErrors.confirmPassword ? "input-error" : ""}
              />

              <button
                type="button"
                className="eye-icon"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                aria-label={
                  showConfirmPassword
                    ? "Hide confirm password"
                    : "Show confirm password"
                }
              >
                {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>

            {fieldErrors.confirmPassword && (
              <p className="field-error-text">{fieldErrors.confirmPassword}</p>
            )}
          </div>
        )}

        <button
          type="button"
          className="auth-submit-btn"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "Please wait..." : isLogin ? "Login" : "Register"}
        </button>

        {isLogin && (
          <div className="forgot-password">
            <button type="button" onClick={handleForgotPassword}>
              Forgot password?
            </button>
          </div>
        )}

        <div className="divider">
          <span>or</span>
        </div>

        <button
          type="button"
          className="google-login-btn"
          onClick={handleGoogleLogin}
        >
          <img src="/google-icon.svg" alt="Google" className="google-icon" />
          <span>{isLogin ? "Login with Google" : "Sign up with Google"}</span>
        </button>

        <div className="modal-switch-text">
          {isLogin ? (
            <p>
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={() => handleSwitchModal("register")}
              >
                Register
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{" "}
              <button type="button" onClick={() => handleSwitchModal("login")}>
                Login
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}