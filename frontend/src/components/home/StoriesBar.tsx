"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FiHome,
  FiSearch,
  FiCompass,
  FiMessageCircle,
  FiHeart,
  FiPlusSquare,
  FiUser,
  FiMenu,
  FiMapPin,
} from "react-icons/fi";

const navItems = [
  { label: "Home", href: "/home", icon: FiHome },
  { label: "Search", href: "/home", icon: FiSearch },
  { label: "Explore Places", href: "/home", icon: FiCompass },
  { label: "Messages", href: "/messages", icon: FiMessageCircle },
  { label: "Travel Picks", href: "/home", icon: FiMapPin },
  { label: "Notifications", href: "/home", icon: FiHeart, badge: 2 },
  { label: "Create", href: "/home", icon: FiPlusSquare },
  { label: "Profile", href: "/home", icon: FiUser },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="trip-sidebar">
      <div className="trip-sidebar__top">
        <Link href="/home" className="trip-logo">
          <span className="trip-logo__icon">△</span>
          <span className="trip-logo__text">PackPalz</span>
        </Link>

        <nav className="trip-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`trip-nav__item ${isActive ? "active" : ""}`}
              >
                <span className="trip-nav__icon-wrap">
                  <Icon className="trip-nav__icon" />
                  {item.badge ? (
                    <span className="trip-nav__badge">{item.badge}</span>
                  ) : null}
                </span>

                <span className="trip-nav__label">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="trip-sidebar__bottom">
        <button type="button" className="trip-nav__item trip-nav__button">
          <span className="trip-nav__icon-wrap">
            <FiMenu className="trip-nav__icon" />
          </span>
          <span className="trip-nav__label">More</span>
        </button>
      </div>
    </aside>
  );
}