"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import api from "@/lib/axios";
import {
  FiCamera,
  FiCheckCircle,
  FiMail,
  FiMapPin,
  FiUser,
} from "react-icons/fi";

type AdminUser = {
  _id?: string;
  username: string;
  name: string;
  email: string;
  role: string;
  bio: string;
  travelInterest: string;
  location: string;
  work: string;
  profileImage: string;
};

const initialForm: AdminUser = {
  username: "",
  name: "",
  email: "",
  role: "",
  bio: "",
  travelInterest: "",
  location: "",
  work: "",
  profileImage: "",
};

function getImageUrl(path?: string) {
  if (!path) return "";
  if (path.startsWith("http")) return path;

  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
  return `${base}${path}`;
}

export default function AdminSettingsPage() {
  const [form, setForm] = useState<AdminUser>(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [selectedImageName, setSelectedImageName] = useState("");

  useEffect(() => {
    const fetchAdminProfile = async () => {
      try {
        const res = await api.get("/users/me");
        const user = res.data?.user || {};

        setForm({
          username: user.username || "",
          name: user.name || "",
          email: user.email || "",
          role: user.role || "",
          bio: user.bio || "",
          travelInterest: user.travelInterest || "",
          location: user.location || "",
          work: user.work || "",
          profileImage: user.profileImage || "",
        });
      } catch (err: any) {
        console.error("Failed to load admin profile:", err);
        setError("Failed to load admin settings.");
      } finally {
        setLoading(false);
      }
    };

    fetchAdminProfile();
  }, []);

  const profilePreview = useMemo(() => {
    return getImageUrl(form.profileImage);
  }, [form.profileImage]);

  const notifyAdminProfileUpdate = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("admin-profile-updated"));
    }
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (message) setMessage("");
    if (error) setError("");
  };

  const handleSaveProfile = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const payload = {
        username: form.username,
        name: form.name,
        bio: form.bio,
        travelInterest: form.travelInterest,
        location: form.location,
        work: form.work,
      };

      const res = await api.put("/users/me", payload);
      const updatedUser = res.data?.user || {};

      setForm((prev) => ({
        ...prev,
        username: updatedUser.username || prev.username,
        name: updatedUser.name || "",
        bio: updatedUser.bio || "",
        travelInterest: updatedUser.travelInterest || "",
        location: updatedUser.location || "",
        work: updatedUser.work || "",
        profileImage: updatedUser.profileImage || prev.profileImage,
        email: updatedUser.email || prev.email,
        role: updatedUser.role || prev.role,
      }));

      setMessage(res.data?.message || "Settings updated successfully.");
      notifyAdminProfileUpdate();
    } catch (err: any) {
      console.error("Failed to save admin settings:", err);
      setError(
        err?.response?.data?.message || "Failed to update admin settings."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedImageName(file.name);
    setUploading(true);
    setMessage("");
    setError("");

    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await api.post("/users/me/avatar", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const imageUrl = res.data?.profileImage || "";

      setForm((prev) => ({
        ...prev,
        profileImage: imageUrl,
      }));

      setMessage("Profile image updated successfully.");
      notifyAdminProfileUpdate();
    } catch (err: any) {
      console.error("Failed to upload profile image:", err);
      setError(
        err?.response?.data?.message || "Failed to upload profile image."
      );
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  if (loading) {
    return (
      <section className="admin-settings-page">
        <div className="admin-page-head">
          <div>
            <h1>Settings</h1>
            <p>Loading admin settings...</p>
          </div>
        </div>

        <div className="admin-loading-card">Loading settings...</div>
      </section>
    );
  }

  return (
    <section className="admin-settings-page">
      <div className="admin-page-head">
        <div>
          <h1>Settings</h1>
          <p>Manage admin profile details shown inside the dashboard.</p>
        </div>

        <div className="admin-page-head__meta">
          <span>Admin Account</span>
        </div>
      </div>

      {message ? (
        <div className="admin-settings-alert success">
          <FiCheckCircle />
          <span>{message}</span>
        </div>
      ) : null}

      {error ? (
        <div className="admin-settings-alert error">
          <span>{error}</span>
        </div>
      ) : null}

      <div className="admin-settings-grid">
        <div className="admin-panel admin-settings-profile-card">
          <div className="admin-panel__head">
            <div>
              <h3>Profile image</h3>
              <p>Upload a clear admin profile photo.</p>
            </div>
          </div>

          <div className="admin-settings-avatar-wrap">
            {profilePreview ? (
              <img
                src={profilePreview}
                alt="Admin profile"
                className="admin-settings-avatar"
              />
            ) : (
              <div className="admin-settings-avatar admin-settings-avatar--fallback">
                {form.name?.trim()?.charAt(0) ||
                  form.username?.trim()?.charAt(0) ||
                  "A"}
              </div>
            )}

            <label className="admin-settings-upload-btn">
              <FiCamera />
              <span>{uploading ? "Uploading..." : "Change photo"}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                hidden
              />
            </label>

            {selectedImageName ? (
              <p className="admin-settings-file-name">{selectedImageName}</p>
            ) : null}
          </div>

          <div className="admin-settings-mini-info">
            <div className="admin-settings-mini-row">
              <FiUser />
              <span>{form.username || "admin"}</span>
            </div>
            <div className="admin-settings-mini-row">
              <FiMail />
              <span>{form.email || "No email found"}</span>
            </div>
            <div className="admin-settings-mini-row">
              <FiMapPin />
              <span>{form.location || "Location not added yet"}</span>
            </div>
          </div>
        </div>

        <form className="admin-panel admin-settings-form" onSubmit={handleSaveProfile}>
          <div className="admin-panel__head">
            <div>
              <h3>Account details</h3>
              <p>Update the admin information used across the panel.</p>
            </div>
          </div>

          <div className="admin-settings-fields">
            <div className="admin-settings-field">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                name="username"
                type="text"
                value={form.username}
                onChange={handleChange}
                placeholder="Enter username"
              />
            </div>

            <div className="admin-settings-field">
              <label htmlFor="name">Full name</label>
              <input
                id="name"
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter full name"
              />
            </div>

            <div className="admin-settings-field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                readOnly
                placeholder="Email address"
              />
            </div>

            <div className="admin-settings-field">
              <label htmlFor="role">Role</label>
              <input
                id="role"
                name="role"
                type="text"
                value={form.role}
                readOnly
                placeholder="Admin role"
              />
            </div>

            <div className="admin-settings-field">
              <label htmlFor="location">Location</label>
              <input
                id="location"
                name="location"
                type="text"
                value={form.location}
                onChange={handleChange}
                placeholder="Enter location"
              />
            </div>

            <div className="admin-settings-field">
              <label htmlFor="work">Work</label>
              <input
                id="work"
                name="work"
                type="text"
                value={form.work}
                onChange={handleChange}
                placeholder="Enter work or role"
              />
            </div>

            <div className="admin-settings-field admin-settings-field--full">
              <label htmlFor="travelInterest">Travel interest</label>
              <input
                id="travelInterest"
                name="travelInterest"
                type="text"
                value={form.travelInterest}
                onChange={handleChange}
                placeholder="Adventure, wellness, solo trips, beach travel..."
              />
            </div>

            <div className="admin-settings-field admin-settings-field--full">
              <label htmlFor="bio">Bio</label>
              <textarea
                id="bio"
                name="bio"
                rows={5}
                value={form.bio}
                onChange={handleChange}
                placeholder="Write a short admin bio"
              />
            </div>
          </div>

          <div className="admin-settings-actions">
            <button type="submit" className="admin-settings-save-btn" disabled={saving}>
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}