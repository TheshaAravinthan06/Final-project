"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  FiHome,
  FiBell,
  FiPlusSquare,
  FiUser,
  FiMenu,
  FiMapPin,
  FiCpu,
  FiSettings,
  FiActivity,
  FiBookmark,
  FiSun,
  FiAlertCircle,
  FiLogOut,
  FiSearch,
} from "react-icons/fi";
import CreateMenu from "@/components/create/CreateMenu";
import CreatePostModal from "@/components/create/CreatePostModal";

type SidebarProps = {
  onOpenSearch: () => void;
  onOpenNotifications: () => void;
};

const moreMenuItems = [
  { label: "Settings", href: "/settings", icon: FiSettings },
  { label: "Your activity", href: "/activity", icon: FiActivity },
  { label: "Saved", href: "/saved", icon: FiBookmark },
  { label: "Switch appearance", href: "/appearance", icon: FiSun },
  { label: "Report a problem", href: "/report-problem", icon: FiAlertCircle },
];

export default function Sidebar({
  onOpenSearch,
  onOpenNotifications,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);

  const moreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(event.target as Node)) {
        setIsMoreOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    setIsMoreOpen(false);
    setIsCreateMenuOpen(false);
    setIsCreatePostOpen(false);
  }, [pathname]);

  const handleOpenCreateMenu = () => {
    setIsCreatePostOpen(false);
    setIsCreateMenuOpen((prev) => !prev);
  };

  const handleSelectPost = () => {
    setIsCreateMenuOpen(false);
    setIsCreatePostOpen(true);
  };

  const handleSelectBlog = () => {
    setIsCreateMenuOpen(false);
    router.push("/create-blog");
  };

  return (
    <>
      <aside className="trip-sidebar">
        <div className="trip-sidebar__top">
          <Link href="/home" className="trip-logo">
            <span className="trip-logo__icon">△</span>
            <span className="trip-logo__text">Trip AI</span>
          </Link>

          <nav className="trip-nav">
            <Link
              href="/home"
              className={`trip-nav__item ${pathname === "/home" ? "active" : ""}`}
            >
              <span className="trip-nav__icon-wrap">
                <span className="trip-nav__icon-box">
                  <FiHome className="trip-nav__icon" />
                </span>
              </span>
              <span className="trip-nav__label">Home</span>
            </Link>

            <Link
              href="/travel-picks"
              className={`trip-nav__item ${
                pathname === "/travel-picks" ? "active" : ""
              }`}
            >
              <span className="trip-nav__icon-wrap">
                <span className="trip-nav__icon-box">
                  <FiMapPin className="trip-nav__icon" />
                </span>
              </span>
              <span className="trip-nav__label">Travel Picks</span>
            </Link>

            <Link
              href="/ai"
              className={`trip-nav__item ${pathname === "/ai" ? "active" : ""}`}
            >
              <span className="trip-nav__icon-wrap">
                <span className="trip-nav__icon-box">
                  <FiCpu className="trip-nav__icon" />
                </span>
              </span>
              <span className="trip-nav__label">AI</span>
            </Link>

            <button
              type="button"
              className="trip-nav__item trip-nav__button"
              onClick={onOpenSearch}
            >
              <span className="trip-nav__icon-wrap">
                <span className="trip-nav__icon-box">
                  <FiSearch className="trip-nav__icon" />
                </span>
              </span>
              <span className="trip-nav__label">Search</span>
            </button>

            <button
              type="button"
              className={`trip-nav__item trip-nav__button ${
                isCreateMenuOpen || isCreatePostOpen ? "active" : ""
              }`}
              onClick={handleOpenCreateMenu}
            >
              <span className="trip-nav__icon-wrap">
                <span className="trip-nav__icon-box">
                  <FiPlusSquare className="trip-nav__icon" />
                </span>
              </span>
              <span className="trip-nav__label">Create</span>
            </button>

            <button
              type="button"
              className="trip-nav__item trip-nav__button"
              onClick={onOpenNotifications}
            >
              <span className="trip-nav__icon-wrap">
                <span className="trip-nav__icon-box">
                  <FiBell className="trip-nav__icon" />
                </span>
              </span>
              <span className="trip-nav__label">Notifications</span>
            </button>

            <Link
              href="/profile"
              className={`trip-nav__item ${pathname === "/profile" ? "active" : ""}`}
            >
              <span className="trip-nav__icon-wrap">
                <span className="trip-nav__icon-box">
                  <FiUser className="trip-nav__icon" />
                </span>
              </span>
              <span className="trip-nav__label">Profile</span>
            </Link>
          </nav>
        </div>

        <div className="trip-sidebar__bottom" ref={moreRef}>
          <button
            type="button"
            className={`trip-nav__item trip-nav__button ${
              isMoreOpen ? "active" : ""
            }`}
            onClick={() => setIsMoreOpen((prev) => !prev)}
          >
            <span className="trip-nav__icon-wrap">
              <span className="trip-nav__icon-box">
                <FiMenu className="trip-nav__icon" />
              </span>
            </span>
            <span className="trip-nav__label">More</span>
          </button>

          {isMoreOpen && (
            <div className="trip-more-menu">
              <div className="trip-more-menu__group">
                {moreMenuItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="trip-more-menu__item"
                    >
                      <span className="trip-more-menu__icon">
                        <Icon />
                      </span>
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>

              <div className="trip-more-menu__group trip-more-menu__group--logout">
                <button
                  type="button"
                  className="trip-more-menu__item trip-more-menu__logout"
                >
                  <span className="trip-more-menu__icon">
                    <FiLogOut />
                  </span>
                  <span>Log out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {isCreateMenuOpen && (
        <CreateMenu
          onSelectPost={handleSelectPost}
          onSelectBlog={handleSelectBlog}
          onClose={() => setIsCreateMenuOpen(false)}
        />
      )}

      {isCreatePostOpen && (
        <CreatePostModal onClose={() => setIsCreatePostOpen(false)} />
      )}
    </>
  );
}