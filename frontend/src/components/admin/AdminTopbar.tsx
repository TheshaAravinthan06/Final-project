"use client";

import { useEffect, useState } from "react";
import { FiBell, FiSearch } from "react-icons/fi";
import api from "@/lib/axios";

type AdminUser = {
  _id?: string;
  username?: string;
  name?: string;
  email?: string;
  role?: string;
  profileImage?: string;
};

function getImageUrl(path?: string) {
  if (!path) return "";
  if (path.startsWith("http")) return path;

  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
  return `${base}${path}`;
}

export default function AdminTopbar() {
  const [admin, setAdmin] = useState<AdminUser | null>(null);

  const fetchAdmin = async () => {
    try {
      const res = await api.get("/users/me");
      setAdmin(res.data?.user || null);
    } catch (error) {
      console.error("Failed to fetch admin profile:", error);
    }
  };

  useEffect(() => {
    fetchAdmin();

    const handleProfileUpdate = () => {
      fetchAdmin();
    };

    window.addEventListener("admin-profile-updated", handleProfileUpdate);

    return () => {
      window.removeEventListener("admin-profile-updated", handleProfileUpdate);
    };
  }, []);

  const displayName =
    admin?.name?.trim() || admin?.username?.trim() || "Admin";

  const displaySubText =
    admin?.role === "admin"
      ? "Trip AI"
      : admin?.email?.trim() || "Trip AI";

  const imageUrl = getImageUrl(admin?.profileImage);
  const fallbackLetter = displayName.charAt(0).toUpperCase();

  return (
    <header className="admin-topbar">
      <div className="admin-search">
        <FiSearch />
        <input type="text" placeholder="Search dashboard, users, packages..." />
      </div>

      <div className="admin-topbar__right">
        <button type="button" className="admin-topbar__icon-btn">
          <FiBell />
        </button>

        <div className="admin-topbar__profile">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={displayName}
              className="admin-topbar__avatar admin-topbar__avatar-image"
            />
          ) : (
            <div className="admin-topbar__avatar">{fallbackLetter}</div>
          )}

          <div>
            <h4>{displayName}</h4>
            <p>{displaySubText}</p>
          </div>
        </div>
      </div>
    </header>
  );
}