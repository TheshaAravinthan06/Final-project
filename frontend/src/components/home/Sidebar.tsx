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
  FiSun,
  FiAlertCircle,
  FiLogOut,
  FiSearch,
  FiChevronLeft,
  FiSend,
} from "react-icons/fi";
import CreateMenu from "@/components/create/CreateMenu";
import CreatePostModal from "@/components/create/CreatePostModal";
import ReportProblemModal from "@/components/home/ReportProblemModal";
import api from "@/lib/axios";
import { applyTheme, getSavedTheme, initTheme, type AppTheme } from "@/lib/theme";

type SidebarProps = {
  onOpenSearch: () => void;
  onOpenNotifications: () => void;
};

type MorePanel = "main" | "appearance";

export default function Sidebar({
  onOpenSearch,
  onOpenNotifications,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<MorePanel>("main");
  const [theme, setTheme] = useState<AppTheme>("light");

  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);

  const moreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    initTheme();
    setTheme(getSavedTheme());
  }, []);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;


    const fetchCounts = async () => {
  try {
    const [notificationRes, messageRes] = await Promise.all([
      api.get("/notifications?limit=1"),
      api.get("/conversations/unread-summary"),
    ]);

    setUnreadNotificationCount(
      Number(notificationRes.data.unreadCount || 0)
    );

    setUnreadMessageCount(
      Number(messageRes.data.totalBadgeCount || 0)
    );
  } catch (error: any) {
    if (error?.response?.status === 401) {
      setUnreadNotificationCount(0);
      setUnreadMessageCount(0);
      return;
    }

    console.error("Failed to fetch sidebar counts:", error);
  }
};

    const handleNotificationUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<{ unreadCount?: number }>;
      const nextCount = Number(customEvent.detail?.unreadCount ?? 0);
      setUnreadNotificationCount(nextCount);
    };

    fetchCounts();
    intervalId = setInterval(fetchCounts, 15000);

    window.addEventListener("notifications:updated", handleNotificationUpdate);

    return () => {
      if (intervalId) clearInterval(intervalId);
      window.removeEventListener(
        "notifications:updated",
        handleNotificationUpdate
      );
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(event.target as Node)) {
        setIsMoreOpen(false);
        setActivePanel("main");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    setIsMoreOpen(false);
    setActivePanel("main");
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

  const handleOpenSettings = () => {
    setIsMoreOpen(false);
    setActivePanel("main");
    router.push("/settings");
  };

  const handleOpenAppearance = () => {
    setActivePanel("appearance");
  };

  const handleBackToMainMenu = () => {
    setActivePanel("main");
  };

  const handleThemeChange = (nextTheme: AppTheme) => {
    setTheme(nextTheme);
    applyTheme(nextTheme);
  };

  const handleOpenReportModal = () => {
    setIsMoreOpen(false);
    setActivePanel("main");
    setIsReportModalOpen(true);
  };

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsMoreOpen(false);
      setActivePanel("main");
      router.push("/");
    }
  };

  return (
    <>
      <aside className="trip-sidebar">
        <div className="trip-sidebar__top">
          <Link href="/home" className="trip-logo">
            <span className="trip-logo__icon">△</span>
            <span className="trip-logo__text">PackPalz</span>
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

            <Link
              href="/messages"
              className={`trip-nav__item ${
                pathname === "/messages" ? "active" : ""
              }`}
            >
              <span className="trip-nav__icon-wrap">
                <span className="trip-nav__icon-box">
                  <FiSend className="trip-nav__icon" />
                </span>

                {unreadMessageCount > 0 && (
                  <span className="trip-nav__badge">
                    {unreadMessageCount > 99 ? "99+" : unreadMessageCount}
                  </span>
                )}
              </span>
              <span className="trip-nav__label">Messages</span>
            </Link>

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

                {unreadNotificationCount > 0 && (
                  <span className="trip-nav__badge">
                    {unreadNotificationCount > 99
                      ? "99+"
                      : unreadNotificationCount}
                  </span>
                )}
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
            onClick={() => {
              setIsMoreOpen((prev) => !prev);
              setActivePanel("main");
            }}
          >
            <span className="trip-nav__icon-wrap">
              <span className="trip-nav__icon-box">
                <FiMenu className="trip-nav__icon" />
              </span>
            </span>
            <span className="trip-nav__label">More</span>
          </button>

          {isMoreOpen && activePanel === "main" && (
            <div className="trip-more-menu">
              <div className="trip-more-menu__group">
                <button
                  type="button"
                  className="trip-more-menu__item"
                  onClick={handleOpenSettings}
                >
                  <span className="trip-more-menu__icon">
                    <FiSettings />
                  </span>
                  <span>Settings</span>
                </button>

                <button
                  type="button"
                  className="trip-more-menu__item"
                  onClick={handleOpenAppearance}
                >
                  <span className="trip-more-menu__icon">
                    <FiSun />
                  </span>
                  <span>Switch appearance</span>
                </button>

                <button
                  type="button"
                  className="trip-more-menu__item"
                  onClick={handleOpenReportModal}
                >
                  <span className="trip-more-menu__icon">
                    <FiAlertCircle />
                  </span>
                  <span>Report a problem</span>
                </button>
              </div>

              <div className="trip-more-menu__group trip-more-menu__group--logout">
                <button
                  type="button"
                  className="trip-more-menu__item trip-more-menu__logout"
                  onClick={handleLogout}
                >
                  <span className="trip-more-menu__icon">
                    <FiLogOut />
                  </span>
                  <span>Log out</span>
                </button>
              </div>
            </div>
          )}

          {isMoreOpen && activePanel === "appearance" && (
            <div className="trip-more-menu trip-more-menu--appearance">
              <div className="trip-more-menu__appearance-head">
                <button
                  type="button"
                  className="trip-more-menu__back-btn"
                  onClick={handleBackToMainMenu}
                >
                  <FiChevronLeft />
                </button>

                <h4>Switch appearance</h4>

                <span className="trip-more-menu__appearance-icon">
                  <FiSun />
                </span>
              </div>

              <div className="trip-more-menu__appearance-body">
                <div className="trip-appearance-row">
                  <span className="trip-appearance-row__label">Dark mode</span>

                  <button
                    type="button"
                    className={`trip-switch ${theme === "dark" ? "active" : ""}`}
                    onClick={() =>
                      handleThemeChange(theme === "dark" ? "light" : "dark")
                    }
                    aria-label="Toggle dark mode"
                  >
                    <span className="trip-switch__thumb" />
                  </button>
                </div>
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

      <ReportProblemModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSubmit={async ({ subject, message }) => {
          await api.post("/users/report-problem", { subject, message });
        }}
      />
    </>
  );
}