"use client";

import { useMemo, useState } from "react";
import { FiChevronDown, FiX } from "react-icons/fi";

type ReportTarget = "post" | "blog" | "account" | "activity";

type ReportContentModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: { target: ReportTarget; reason: string; details: string }) => Promise<void> | void;
  title?: string;
};

const REASONS = [
  "Spam",
  "Harassment",
  "Fake information",
  "Inappropriate content",
  "Scam or unsafe behavior",
  "Other",
];

export default function ReportContentModal({
  open,
  onClose,
  onSubmit,
  title = "Report",
}: ReportContentModalProps) {
  const [target, setTarget] = useState<ReportTarget>("post");
  const [reason, setReason] = useState(REASONS[0]);
  const [details, setDetails] = useState("");
  const [targetOpen, setTargetOpen] = useState(false);
  const [reasonOpen, setReasonOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const targetLabel = useMemo(() => {
    if (target === "post") return "This post";
    if (target === "blog") return "This blog";
    if (target === "account") return "This user";
    return "This user's activity";
  }, [target]);

  if (!open) return null;

  const handleSubmit = async () => {
    try {
      setLoading(true);
      await onSubmit({ target, reason, details });
      setDetails("");
      setReason(REASONS[0]);
      setTarget("post");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="report-problem-backdrop" onClick={onClose}>
      <div className="report-problem-modal" onClick={(e) => e.stopPropagation()}>
        <div className="report-problem-modal__header">
          <h2 className="report-problem-modal__title">{title}</h2>
          <button type="button" className="report-problem-modal__close" onClick={onClose}>
            <FiX />
          </button>
        </div>

        <div className="report-problem-modal__body">
          <div className="report-problem-modal__field">
            <label className="report-problem-modal__label">Report about</label>
            <div className="report-problem-select">
              <button type="button" className="report-problem-select__trigger" onClick={() => { setTargetOpen((v) => !v); setReasonOpen(false); }}>
                <span>{targetLabel}</span>
                <FiChevronDown className={`report-problem-select__icon ${targetOpen ? "is-open" : ""}`} />
              </button>
              {targetOpen ? (
                <div className="report-problem-select__menu">
                  {[
                    ["post", "This post"],
                    ["account", "This user"],
                    ["activity", "This user's activity"],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      className={`report-problem-select__option ${target === value ? "is-active" : ""}`}
                      onClick={() => { setTarget(value as ReportTarget); setTargetOpen(false); }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <div className="report-problem-modal__field">
            <label className="report-problem-modal__label">Reason</label>
            <div className="report-problem-select">
              <button type="button" className="report-problem-select__trigger" onClick={() => { setReasonOpen((v) => !v); setTargetOpen(false); }}>
                <span>{reason}</span>
                <FiChevronDown className={`report-problem-select__icon ${reasonOpen ? "is-open" : ""}`} />
              </button>
              {reasonOpen ? (
                <div className="report-problem-select__menu">
                  {REASONS.map((item) => (
                    <button
                      key={item}
                      type="button"
                      className={`report-problem-select__option ${reason === item ? "is-active" : ""}`}
                      onClick={() => { setReason(item); setReasonOpen(false); }}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <div className="report-problem-modal__field">
            <label className="report-problem-modal__label">Details</label>
            <textarea
              className="report-problem-modal__textarea"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Tell us what happened"
              rows={5}
            />
          </div>
        </div>

        <div className="report-problem-modal__footer">
          <button type="button" className="report-problem-modal__submit" onClick={handleSubmit} disabled={loading}>
            {loading ? "Sending..." : "Send report"}
          </button>
        </div>
      </div>
    </div>
  );
}
