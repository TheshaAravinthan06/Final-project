"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import api from "@/lib/axios";
import {
  FiGrid,
  FiMapPin,
  FiUsers,
  FiBookOpen,
  FiClipboard,
  FiSettings,
  FiLogOut,
  FiBell,
  FiAlertCircle,
  FiBriefcase,
  FiPackage,
} from "react-icons/fi";

type AdminUser = {
  _id?: string;
  username?: string;
  name?: string;
  email?: string;
  role?: string;
  profileImage?: string;
};

const navItems = [
  { label: "Dashboard", href: "/admin", icon: FiGrid },
  { label: "Places", href: "/admin/places", icon: FiMapPin },
  { label: "Travel Picks", href: "/admin/travel-picks", icon: FiBriefcase },
  { label: "Add Package", href: "/admin/travel-picks/new", icon: FiPackage },
  { label: "Notifications", href: "/admin/notifications", icon: FiBell },
  { label: "Reports", href: "/admin/reports", icon: FiAlertCircle },
  { label: "Users", href: "/admin/users", icon: FiUsers },
  { label: "Bookings", href: "/admin/bookings", icon: FiBookOpen },
  { label: "Itineraries", href: "/admin/itineraries", icon: FiClipboard },
  { label: "Settings", href: "/admin/settings", icon: FiSettings },
];

function getImageUrl(path?: string) {
  if (!path) return "";
  if (path.startsWith("http")) return path;

  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
  return `${base}${path}`;
}

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [admin, setAdmin] = useState<AdminUser | null>(null);

  const fetchAdmin = async () => {
    try {
      const res = await api.get("/users/me");
      setAdmin(res.data?.user || null);
    } catch (error) {
      console.error("Failed to fetch admin sidebar profile:", error);
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

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      router.push("/");
    }
  };

  const isItemActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname === href;
  };

  const displayName =
    admin?.name?.trim() || admin?.username?.trim() || "Admin";

  const displayEmail = admin?.email?.trim() || "tripai.admin@gmail.com";
  const imageUrl = getImageUrl(admin?.profileImage);
  const fallbackLetter = displayName.charAt(0).toUpperCase();

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar__scroll">
        <div className="admin-sidebar__profile">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={displayName}
              className="admin-sidebar__avatar admin-sidebar__avatar-image"
            />
          ) : (
            <div className="admin-sidebar__avatar">{fallbackLetter}</div>
          )}

          <div className="admin-sidebar__user">
            <h3>{displayName}</h3>
            <p>{displayEmail}</p>
          </div>
        </div>

        <nav className="admin-sidebar__nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = isItemActive(item.href);

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`admin-nav-item ${isActive ? "active" : ""}`}
              >
                <span className="admin-nav-item__icon">
                  <Icon />
                </span>
                <span className="admin-nav-item__label">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="admin-sidebar__bottom">
          <button
            type="button"
            className="admin-nav-item logout"
            onClick={handleLogout}
          >
            <span className="admin-nav-item__icon">
              <FiLogOut />
            </span>
            <span className="admin-nav-item__label">Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}