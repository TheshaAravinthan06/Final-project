"use client";

import { FormEvent, useEffect, useState } from "react";
import { FiAlertCircle, FiSend, FiX } from "react-icons/fi";
import api from "@/lib/axios";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function ReportProblemModal({ isOpen, onClose }: Props) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setSubject("");
      setMessage("");
      setSending(false);
      setSuccess("");
      setError("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!subject.trim() || !message.trim()) {
      setError("Please fill in both subject and message.");
      return;
    }

    try {
      setSending(true);
      setError("");
      setSuccess("");

      await api.post("/users/report-problem", {
        subject: subject.trim(),
        message: message.trim(),
      });

      setSuccess("Your report has been sent to admin.");
      setSubject("");
      setMessage("");

      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to send report.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="report-problem-modal-backdrop" onClick={onClose}>
      <div
        className="report-problem-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="report-problem-modal__head">
          <div className="report-problem-modal__title">
            <span className="report-problem-modal__icon">
              <FiAlertCircle />
            </span>
            <h3>Report a problem</h3>
          </div>

          <button
            type="button"
            className="report-problem-modal__close"
            onClick={onClose}
          >
            <FiX />
          </button>
        </div>

        {(error || success) && (
          <div
            className={`report-problem-modal__alert ${
              error ? "error" : "success"
            }`}
          >
            {error || success}
          </div>
        )}

        <form className="report-problem-modal__form" onSubmit={handleSubmit}>
          <div className="report-problem-modal__field">
            <label>Subject</label>
            <input
              type="text"
              placeholder="Write the issue title"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div className="report-problem-modal__field">
            <label>Message</label>
            <textarea
              rows={6}
              placeholder="Explain the problem clearly"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <div className="report-problem-modal__actions">
            <button type="button" className="secondary" onClick={onClose}>
              Cancel
            </button>

            <button type="submit" className="primary" disabled={sending}>
              <FiSend />
              {sending ? "Sending..." : "Send report"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}