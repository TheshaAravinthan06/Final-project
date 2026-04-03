"use client";

import { useEffect, useState } from "react";
import { FiChevronDown, FiX } from "react-icons/fi";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: { subject: string; message: string }) => Promise<void> | void;
};

const AREA_OPTIONS = [
  "Home",
  "Profile",
  "Travel Picks",
  "AI Planner",
  "Notifications",
  "Messages",
  "Settings",
  "Other",
];

export default function ReportProblemModal({
  isOpen,
  onClose,
  onSubmit,
}: Props) {
  const [subject, setSubject] = useState("Home");
  const [message, setMessage] = useState("");
  const [showAreaOptions, setShowAreaOptions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setMessage("");
      setSubject("Home");
      setShowAreaOptions(false);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!message.trim()) return;

    try {
      setIsSubmitting(true);

      if (onSubmit) {
        await onSubmit({
          subject,
          message: message.trim(),
        });
      }

      onClose();
    } catch (error) {
      console.error("Problem report submit failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="report-problem-backdrop" onClick={onClose}>
      <div
        className="report-problem-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="report-problem-modal__header">
          <h2 className="report-problem-modal__title">Report a problem</h2>
          <button
            type="button"
            className="report-problem-modal__close"
            onClick={onClose}
            aria-label="Close"
          >
            <FiX />
          </button>
        </div>

        <div className="report-problem-modal__body">
          <div className="report-problem-modal__field">
            <label className="report-problem-modal__label">
              Explain what is not working
            </label>
            <textarea
              className="report-problem-modal__textarea"
              placeholder="Tell us what happened. Please include what you were doing when the issue occurred."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
            />
          </div>

          <div className="report-problem-modal__helper">
            Please avoid sharing passwords, payment details, or other sensitive
            information.
          </div>

          <div className="report-problem-modal__field">
            <label className="report-problem-modal__label">
              Where did this happen?
            </label>

            <div className="report-problem-select">
              <button
                type="button"
                className="report-problem-select__trigger"
                onClick={() => setShowAreaOptions((prev) => !prev)}
              >
                <span>{subject}</span>
                <FiChevronDown
                  className={`report-problem-select__icon ${
                    showAreaOptions ? "is-open" : ""
                  }`}
                />
              </button>

              {showAreaOptions && (
                <div className="report-problem-select__menu">
                  {AREA_OPTIONS.map((option) => (
                    <button
                      key={option}
                      type="button"
                      className={`report-problem-select__option ${
                        subject === option ? "is-active" : ""
                      }`}
                      onClick={() => {
                        setSubject(option);
                        setShowAreaOptions(false);
                      }}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="report-problem-modal__footer">
          <button
            type="button"
            className="report-problem-modal__submit"
            onClick={handleSubmit}
            disabled={!message.trim() || isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit Report"}
          </button>
        </div>
      </div>
    </div>
  );
}