"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { FiImage, FiX } from "react-icons/fi";
import { ProfileGridItem } from "./types";
import { getImageSrc } from "./profileUtils";

type Props = {
  item: ProfileGridItem | null;
  open: boolean;
  saving?: boolean;
  onClose: () => void;
  onSave: (payload: FormData) => void;
};

export default function ProfileEditItemModal({
  item,
  open,
  saving = false,
  onClose,
  onSave,
}: Props) {
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [preview, setPreview] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    if (!item || !open) return;

    if (item.type === "blog") {
      setTitle(item.title || "");
      setExcerpt(item.excerpt || "");
      setContent(item.content || "");
      setCaption("");
      setLocation(item.location || "");
      setPreview(getImageSrc(item.coverImage));
    } else {
      setTitle("");
      setExcerpt("");
      setContent("");
      setCaption(item.caption || "");
      setLocation(item.location || "");
      setPreview(getImageSrc(item.imageUrl));
    }

    setImageFile(null);
  }, [item, open]);

  if (!open || !item) return null;

  const isBlog = item.type === "blog";

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImageFile(file);

    if (file) {
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = () => {
    const formData = new FormData();

    if (isBlog) {
      formData.append("title", title.trim());
      formData.append("excerpt", excerpt.trim());
      formData.append("content", content.trim());
      formData.append("location", location.trim());

      if (imageFile) {
        formData.append("coverImage", imageFile);
      }
    } else {
      formData.append("caption", caption.trim());
      formData.append("location", location.trim());

      if (imageFile) {
        formData.append("image", imageFile);
      }
    }

    onSave(formData);
  };

  return (
    <div className="profile-edit-modal-backdrop" onClick={onClose}>
      <div className="profile-edit-modal" onClick={(e) => e.stopPropagation()}>
        <div className="profile-edit-modal__header">
          <h3>{isBlog ? "Edit blog" : "Edit post"}</h3>
          <button
            type="button"
            className="profile-edit-modal__close"
            onClick={onClose}
          >
            <FiX />
          </button>
        </div>

        <div className="profile-edit-modal__body">
          <label className="profile-edit-modal__image-picker">
            <input type="file" accept="image/*" onChange={handleFileChange} />
            {preview ? (
              <img src={preview} alt="Preview" />
            ) : (
              <div className="profile-edit-modal__image-placeholder">
                <FiImage />
                <span>Choose image</span>
              </div>
            )}
          </label>

          {isBlog ? (
            <>
              <div className="profile-edit-modal__field">
                <span>Title</span>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter title"
                />
              </div>

              <div className="profile-edit-modal__field">
                <span>Excerpt</span>
                <textarea
                  rows={3}
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="Enter excerpt"
                />
              </div>

              <div className="profile-edit-modal__field">
                <span>Content</span>
                <textarea
                  rows={8}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your content"
                />
              </div>

              <div className="profile-edit-modal__field">
                <span>Location</span>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Enter location"
                />
              </div>
            </>
          ) : (
            <>
              <div className="profile-edit-modal__field">
                <span>Caption</span>
                <textarea
                  rows={5}
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Write your caption"
                />
              </div>

              <div className="profile-edit-modal__field">
                <span>Location</span>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Enter location"
                />
              </div>
            </>
          )}
        </div>

        <div className="profile-edit-modal__footer">
          <button
            type="button"
            className="profile-edit-modal__btn profile-edit-modal__btn--ghost"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>

          <button
            type="button"
            className="profile-edit-modal__btn profile-edit-modal__btn--primary"
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}