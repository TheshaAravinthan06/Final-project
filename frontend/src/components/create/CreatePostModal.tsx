"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";

type Props = {
  onClose: () => void;
};

export default function CreatePostModal({ onClose }: Props) {
  const router = useRouter();

  const [image, setImage] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);

  const previewUrl = useMemo(() => {
    if (!image) return "";
    return URL.createObjectURL(image);
  }, [image]);

  const handleSubmit = async () => {
    if (!image) {
      alert("Please select an image.");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("image", image);
      formData.append("caption", caption);
      formData.append("location", location);

      await api.post("/user-posts", formData);

      onClose();
      router.push("/home");
      router.refresh();
    } catch (error) {
      console.error("Failed to create post:", error);
      alert("Failed to create post.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="create-post-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="create-post-modal-header">
          <h3>Create new post</h3>
          <button type="button" onClick={onClose}>
            ✕
          </button>
        </div>

        {!image ? (
          <div className="create-post-upload-state">
            <div className="create-post-upload-icon">🖼️</div>
            <p>Upload a travel photo</p>
            <span className="create-post-upload-subtext">
              Share a moment, memory, or beautiful place from your trip.
            </span>

            <label className="create-post-select-btn">
              Select from computer
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => setImage(e.target.files?.[0] || null)}
              />
            </label>
          </div>
        ) : (
          <div className="create-post-form">
            <img
              src={previewUrl}
              alt="preview"
              className="create-post-preview"
            />

            <div className="create-post-fields">
              <input
                type="text"
                placeholder="Add location (optional)"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />

              <textarea
                placeholder="Write a caption..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
              />
            </div>

            <div className="create-post-actions">
              <button
                type="button"
                className="create-post-secondary-btn"
                onClick={() => setImage(null)}
              >
                Change image
              </button>

              <div className="create-post-actions-right">
                <button
                  type="button"
                  className="create-post-secondary-btn"
                  onClick={onClose}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="create-post-primary-btn"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? "Sharing..." : "Share Post"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}