"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FiImage, FiMapPin, FiX, FiArrowRight, FiCheck } from "react-icons/fi";
import api from "@/lib/axios";

type Props = {
  onClose: () => void;
};

export default function CreatePostModal({ onClose }: Props) {
  const router = useRouter();

  const [image,    setImage]    = useState<File | null>(null);
  const [caption,  setCaption]  = useState("");
  const [location, setLocation] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [done,     setDone]     = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const previewUrl = useMemo(() => {
    if (!image) return "";
    return URL.createObjectURL(image);
  }, [image]);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setImage(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleSubmit = async () => {
    if (!image) return;
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("image", image);
      formData.append("caption", caption);
      formData.append("location", location);
      await api.post("/user-posts", formData);
      setDone(true);
      setTimeout(() => {
        onClose();
        router.push("/home");
        router.refresh();
      }, 1200);
    } catch (error) {
      console.error("Failed to create post:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cpm-backdrop" onClick={onClose}>
      <div className="cpm" onClick={(e) => e.stopPropagation()}>

        {/* ── Close ── */}
        <button type="button" className="cpm__close" onClick={onClose} aria-label="Close">
          <FiX />
        </button>

        {/* ── Upload state — no image yet ── */}
        {!image ? (
          <div
            className={`cpm-upload ${dragOver ? "cpm-upload--dragover" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />

            {/* Decorative background grid */}
            <div className="cpm-upload__grid" aria-hidden="true">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="cpm-upload__grid-cell" />
              ))}
            </div>

            <div className="cpm-upload__body">
              <div className="cpm-upload__icon-ring">
                <FiImage />
              </div>
              <h2>Drop your photo here</h2>
              <p>Share a moment, memory, or beautiful place from your travels</p>
              <span className="cpm-upload__cta">
                Choose photo <FiArrowRight />
              </span>
            </div>

            <p className="cpm-upload__hint">PNG, JPG, WEBP · Max 10MB</p>
          </div>
        ) : (
          /* ── Form state — image selected ── */
          <div className="cpm-form">

            {/* Left — image preview */}
            <div className="cpm-form__preview">
              <img src={previewUrl} alt="preview" className="cpm-form__img" />
              <button
                type="button"
                className="cpm-form__change"
                onClick={() => setImage(null)}
              >
                Change photo
              </button>
            </div>

            {/* Right — fields */}
            <div className="cpm-form__right">
              <div className="cpm-form__header">
                <h3>New Post</h3>
                <p>Tell your story</p>
              </div>

              <div className="cpm-form__fields">
                <div className="cpm-field cpm-field--location">
                  <FiMapPin className="cpm-field__icon" />
                  <input
                    type="text"
                    placeholder="Add a location…"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    maxLength={80}
                  />
                </div>

                <div className="cpm-field cpm-field--caption">
                  <textarea
                    placeholder="Write a caption. Tell people where this was, what made it special…"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    maxLength={2200}
                    rows={5}
                  />
                  <span className="cpm-field__count">{caption.length}/2200</span>
                </div>
              </div>

              <div className="cpm-form__actions">
                <button
                  type="button"
                  className="cpm-btn cpm-btn--ghost"
                  onClick={onClose}
                  disabled={loading}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className={`cpm-btn cpm-btn--primary ${done ? "cpm-btn--done" : ""}`}
                  onClick={handleSubmit}
                  disabled={loading || done}
                >
                  {done ? (
                    <><FiCheck /> Shared!</>
                  ) : loading ? (
                    <><span className="cpm-spinner" /> Sharing…</>
                  ) : (
                    <>Share Post <FiArrowRight /></>
                  )}
                </button>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}