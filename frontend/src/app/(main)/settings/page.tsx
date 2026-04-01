"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/axios";
import {
  FiBookmark,
  FiCamera,
  FiChevronLeft,
  FiEdit2,
  FiHeart,
  FiLock,
  FiLogOut,
  FiMoon,
  FiPower,
  FiSun,
} from "react-icons/fi";
import {
  formatJoinedInterests,
  getImageSrc,
  getInitials,
} from "@/components/profile/profileUtils";
import { ProfileUser } from "@/components/profile/types";
import { applyTheme, getSavedTheme, initTheme, type AppTheme } from "@/lib/theme";

type SettingsTab =
  | "edit-profile"
  | "wishlist"
  | "saved-posts"
  | "appearance"
  | "change-password"
  | "deactivate"
  | "logout";

type EditForm = {
  username: string;
  name: string;
  bio: string;
  travelInterest: string;
  location: string;
  work: string;
};

const settingsItems: {
  key: SettingsTab;
  label: string;
  icon: any;
}[] = [
  { key: "edit-profile", label: "Edit Profile", icon: FiEdit2 },
  { key: "wishlist", label: "Wishlist", icon: FiHeart },
  { key: "saved-posts", label: "Saved Posts", icon: FiBookmark },
  { key: "appearance", label: "Appearance", icon: FiMoon },
  { key: "change-password", label: "Change Password", icon: FiLock },
  { key: "deactivate", label: "Deactivate", icon: FiPower },
  { key: "logout", label: "Logout", icon: FiLogOut },
];

export default function SettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = (searchParams.get("tab") as SettingsTab) || "edit-profile";

  const [profile, setProfile] = useState<ProfileUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [theme, setTheme] = useState<AppTheme>("light");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState<EditForm>({
    username: "",
    name: "",
    bio: "",
    travelInterest: "",
    location: "",
    work: "",
  });

  useEffect(() => {
    initTheme();
    setTheme(getSavedTheme());
  }, []);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);

        const res = await api.get("/users/me");
        const user = res.data?.user;
        setProfile(user);

        setForm({
          username: user?.username || "",
          name: user?.name || "",
          bio: user?.bio || "",
          travelInterest: user?.travelInterest || "",
          location: user?.location || "",
          work: user?.work || "",
        });
      } catch (err: any) {
        setError(err?.response?.data?.message || "Failed to load settings.");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const interestTags = useMemo(
    () => formatJoinedInterests(form.travelInterest),
    [form.travelInterest]
  );

  const changeTab = (tab: SettingsTab) => {
    router.push(`/settings?tab=${tab}`);
  };

  const handleFieldChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const res = await api.put("/users/me", form);
      const updatedUser = res.data?.user || null;

      setProfile(updatedUser);
      setForm({
        username: updatedUser?.username || "",
        name: updatedUser?.name || "",
        bio: updatedUser?.bio || "",
        travelInterest: updatedUser?.travelInterest || "",
        location: updatedUser?.location || "",
        work: updatedUser?.work || "",
      });

      setMessage("Profile updated successfully.");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setAvatarUploading(true);
      setError("");
      setMessage("");

      const formData = new FormData();
      formData.append("image", file);

      const res = await api.post("/users/me/avatar", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setProfile(res.data?.user || null);
      setMessage("Profile photo updated successfully.");
    } catch (err: any) {
      setError(
        err?.response?.data?.message || "Failed to upload profile photo."
      );
    } finally {
      setAvatarUploading(false);
      event.target.value = "";
    }
  };

  const handleThemeChange = (nextTheme: AppTheme) => {
    setTheme(nextTheme);
    applyTheme(nextTheme);
  };

  const handleLogout = async () => {
    try {
      setLogoutLoading(true);
      await api.post("/auth/logout");
      router.push("/");
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      setLogoutLoading(false);
    }
  };

  if (loading) {
    return <div className="profile-loading-shell">Loading settings...</div>;
  }

  if (!profile) {
    return <div className="profile-loading-shell">Settings not found.</div>;
  }

  return (
    <section className="settings-clean-page">
      <div className="settings-clean-shell">
        <aside className="settings-clean-sidebar">
          <div className="settings-clean-sidebar__head">
            <Link href="/profile" className="settings-clean-back">
              <FiChevronLeft />
            </Link>
            <h2>Settings</h2>
          </div>

          <div className="settings-clean-menu">
            {settingsItems.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.key}
                  type="button"
                  className={currentTab === item.key ? "active" : ""}
                  onClick={() => changeTab(item.key)}
                >
                  <Icon />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </aside>

        <div className="settings-clean-content">
          {currentTab === "edit-profile" ? (
            <>
              <div className="settings-clean-content__head">
                <h3>Edit Profile</h3>
              </div>

              {(message || error) && (
                <div
                  className={`profile-clean-alert ${
                    error ? "error" : "success"
                  }`}
                >
                  {error || message}
                </div>
              )}

              <form className="settings-clean-form" onSubmit={handleProfileSave}>
                <div className="settings-clean-avatar-row">
                  <div className="settings-clean-avatar">
                    {profile.profileImage ? (
                      <img
                        src={getImageSrc(profile.profileImage)}
                        alt={profile.username || profile.name}
                      />
                    ) : (
                      <div className="settings-clean-avatar__fallback">
                        {getInitials(profile.username, profile.name)}
                      </div>
                    )}
                  </div>

                  <label className="settings-clean-photo-btn">
                    <FiCamera />
                    {avatarUploading ? "Uploading..." : "Change photo"}
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={handleAvatarChange}
                    />
                  </label>
                </div>

                <div className="settings-clean-intro">
                  <h4>{form.username || profile.username}</h4>
                  <p>@{form.name || profile.name || profile.username}</p>
                </div>

                <div className="settings-clean-group">
                  <label>Bio</label>
                  <textarea
                    name="bio"
                    value={form.bio}
                    onChange={handleFieldChange}
                    rows={4}
                    placeholder="Tell people a little about your travel vibe"
                  />
                </div>

                <div className="settings-clean-group">
                  <label>Travel Interests</label>
                  <input
                    name="travelInterest"
                    value={form.travelInterest}
                    onChange={handleFieldChange}
                    placeholder="Beaches, Nature, Solo Trips"
                  />
                </div>

                {!!interestTags.length && (
                  <div className="profile-clean-tags profile-clean-tags--left">
                    {interestTags.map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                )}

                <div className="settings-clean-group">
                  <label>Location</label>
                  <input
                    name="location"
                    value={form.location}
                    onChange={handleFieldChange}
                    placeholder="Jaffna, Sri Lanka"
                  />
                </div>

                <div className="settings-clean-group">
                  <label>Name</label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleFieldChange}
                    placeholder="Your name"
                  />
                </div>

                <div className="settings-clean-row">
                  <div className="settings-clean-group">
                    <label>Work</label>
                    <input
                      name="work"
                      value={form.work}
                      onChange={handleFieldChange}
                      placeholder="Student / Travel Blogger"
                    />
                  </div>

                  <div className="settings-clean-group">
                    <label>Email</label>
                    <input
                      value={profile.email || ""}
                      readOnly
                      placeholder="Email"
                    />
                  </div>
                </div>

                <div className="settings-clean-group">
                  <label>Username</label>
                  <input
                    name="username"
                    value={form.username}
                    onChange={handleFieldChange}
                    placeholder="Username"
                  />
                </div>

                <div className="settings-clean-actions">
                  <button
                    type="submit"
                    className="profile-clean-primary-btn"
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </>
          ) : currentTab === "appearance" ? (
            <div className="settings-clean-placeholder">
              <div className="settings-clean-placeholder__inner">
                <div className="settings-clean-content__head settings-clean-content__head--placeholder">
                  <h3>Appearance</h3>
                </div>

                <div className="settings-theme-panel">
                  <button
                    type="button"
                    className={`settings-theme-panel__item ${
                      theme === "light" ? "active" : ""
                    }`}
                    onClick={() => handleThemeChange("light")}
                  >
                    <span className="settings-theme-panel__left">
                      <FiSun />
                      <span>Light mode</span>
                    </span>
                    <span>{theme === "light" ? "Selected" : ""}</span>
                  </button>

                  <button
                    type="button"
                    className={`settings-theme-panel__item ${
                      theme === "dark" ? "active" : ""
                    }`}
                    onClick={() => handleThemeChange("dark")}
                  >
                    <span className="settings-theme-panel__left">
                      <FiMoon />
                      <span>Dark mode</span>
                    </span>
                    <span>{theme === "dark" ? "Selected" : ""}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : currentTab === "logout" ? (
            <div className="settings-clean-placeholder">
              <div className="settings-clean-placeholder__inner">
                <div className="settings-clean-content__head settings-clean-content__head--placeholder">
                  <h3>Logout</h3>
                </div>

                <div className="settings-logout-box">
                  <p>You can safely log out from here.</p>
                  <button
                    type="button"
                    className="settings-logout-box__btn"
                    onClick={handleLogout}
                    disabled={logoutLoading}
                  >
                    <FiLogOut />
                    {logoutLoading ? "Logging out..." : "Log out"}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="settings-clean-placeholder">
              <div className="settings-clean-placeholder__inner">
                <div className="settings-clean-content__head settings-clean-content__head--placeholder">
                  <h3>
                    {settingsItems.find((item) => item.key === currentTab)?.label}
                  </h3>
                </div>

                <div className="settings-clean-placeholder__body">
                  <p>This section can be connected next.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}