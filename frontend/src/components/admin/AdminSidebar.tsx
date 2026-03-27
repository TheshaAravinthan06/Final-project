"use client";

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
  FiPlusCircle,
  FiBell,
  FiAlertCircle,
  FiBriefcase,
  FiPackage,
} from "react-icons/fi";

const navItems = [
  { label: "Dashboard", href: "/admin", icon: FiGrid },
  { label: "Places", href: "/admin/places", icon: FiMapPin },
  { label: "Add Place", href: "/admin/places/new", icon: FiPlusCircle },
  { label: "Travel Picks", href: "/admin/travel-picks", icon: FiBriefcase },
  { label: "Add Package", href: "/admin/travel-picks/new", icon: FiPackage },
  { label: "Notifications", href: "/admin/notifications", icon: FiBell },
  { label: "Reports", href: "/admin/reports", icon: FiAlertCircle },
  { label: "Users", href: "/admin/users", icon: FiUsers },
  { label: "Bookings", href: "/admin/bookings", icon: FiBookOpen },
  { label: "Itineraries", href: "/admin/itineraries", icon: FiClipboard },
  { label: "Settings", href: "/admin/settings", icon: FiSettings },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      router.push("/");
    }
  };

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar__profile">
        <div className="admin-sidebar__avatar">A</div>
        <div className="admin-sidebar__user">
          <h3>Admin</h3>
          <p>tripai.admin@gmail.com</p>
        </div>
      </div>

      <nav className="admin-sidebar__nav">
        {navItems.map((item) => {
          const Icon = item.icon;

          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);

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
    </aside>
  );
}