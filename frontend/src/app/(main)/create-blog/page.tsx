"use client";

import { useMemo, useState } from "react";
import api from "@/lib/axios";
import { useRouter } from "next/navigation";

export default function CreateBlogPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [location, setLocation] = useState("");
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const coverPreview = useMemo(() => {
    if (!coverImage) return "";
    return URL.createObjectURL(coverImage);
  }, [coverImage]);

  const handlePublish = async () => {
    if (!title.trim() || !content.trim() || !coverImage) {
      alert("Please fill title, content and cover image.");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("title", title);
      formData.append("excerpt", excerpt);
      formData.append("content", content);
      formData.append("location", location);
      formData.append("coverImage", coverImage);

      await api.post("/blogs", formData);

      router.push("/home");
      router.refresh();
    } catch (error) {
      console.error("Failed to publish blog:", error);
      alert("Failed to publish blog.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-blog-screen">
      <div className="create-blog-shell">
        <div className="create-blog-topbar">
          <div className="create-blog-topbar__left">
            <p className="create-blog-topbar__eyebrow">Travel Blog</p>
            <h1>Write your travel story</h1>
            <span>Make it feel like a real story, not a small post.</span>
          </div>

          <div className="create-blog-topbar__actions">
            <button
              type="button"
              className="create-blog-btn create-blog-btn--ghost"
              onClick={() => router.back()}
            >
              Cancel
            </button>

            <button
              type="button"
              className="create-blog-btn create-blog-btn--primary"
              onClick={handlePublish}
              disabled={loading}
            >
              {loading ? "Publishing..." : "Publish Blog"}
            </button>
          </div>
        </div>

        <div className="create-blog-layout">
          <div className="create-blog-main">
            <div className="create-blog-cover-card">
              {!coverImage ? (
                <label className="create-blog-cover-empty">
                  <div className="create-blog-cover-empty__icon">🖼️</div>
                  <h3>Upload cover image</h3>
                  <p>
                    This will be the main visual for your blog preview and full
                    blog page.
                  </p>

                  <span className="create-blog-upload-btn">
                    Choose cover image
                  </span>

                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => setCoverImage(e.target.files?.[0] || null)}
                  />
                </label>
              ) : (
                <div className="create-blog-cover-preview-wrap">
                  <img
                    src={coverPreview}
                    alt="Cover preview"
                    className="create-blog-cover-preview"
                  />

                  <div className="create-blog-cover-overlay">
                    <label className="create-blog-upload-btn create-blog-upload-btn--overlay">
                      Change cover
                      <input
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={(e) =>
                          setCoverImage(e.target.files?.[0] || null)
                        }
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>

            <div className="create-blog-editor-card">
              <input
                type="text"
                className="create-blog-title-input"
                placeholder="Write your blog title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />

              <div className="create-blog-meta-row">
                <input
                  type="text"
                  placeholder="Location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />

                <input
                  type="text"
                  placeholder="Short preview / excerpt"
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                />
              </div>

              <textarea
                className="create-blog-story-input"
                placeholder="Start writing your full travel story here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={18}
              />
            </div>
          </div>

          <aside className="create-blog-side-card">
            <h3>Publishing guide</h3>

            <div className="create-blog-side-card__list">
              <div className="create-blog-side-card__item">
                <strong>Cover image</strong>
                <span>Add a strong photo that matches the feeling of the trip.</span>
              </div>

              <div className="create-blog-side-card__item">
                <strong>Title</strong>
                <span>Keep it short, clean, and memorable.</span>
              </div>

              <div className="create-blog-side-card__item">
                <strong>Excerpt</strong>
                <span>Use one or two lines to attract readers.</span>
              </div>

              <div className="create-blog-side-card__item">
                <strong>Story</strong>
                <span>Write the full experience like a proper travel journal.</span>
              </div>
            </div>

            <div className="create-blog-stats">
              <div>
                <span>Title</span>
                <strong>{title.trim().length}</strong>
              </div>
              <div>
                <span>Excerpt</span>
                <strong>{excerpt.trim().length}</strong>
              </div>
              <div>
                <span>Story</span>
                <strong>{content.trim().length}</strong>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}