"use client";

import { useState } from "react";
import Sidebar from "@/components/home/Sidebar";
import SearchOverlay from "@/components/search/SearchOverlay";
import NotificationsOverlay from "@/components/notifications/NotificationsOverlay";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const openSearch = () => {
    setIsNotificationsOpen(false);
    setIsSearchOpen(true);
  };

  const openNotifications = () => {
    setIsSearchOpen(false);
    setIsNotificationsOpen(true);
  };

  const closeOverlays = () => {
    setIsSearchOpen(false);
    setIsNotificationsOpen(false);
  };

  return (
    <div
      className={`app-shell ${
        isSearchOpen || isNotificationsOpen ? "app-shell--overlay-open" : ""
      }`}
    >
      <Sidebar
        onOpenSearch={openSearch}
        onOpenNotifications={openNotifications}
      />

      <main className="app-shell__content">{children}</main>

      <SearchOverlay isOpen={isSearchOpen} onClose={closeOverlays} />
      <NotificationsOverlay
        isOpen={isNotificationsOpen}
        onClose={closeOverlays}
      />
    </div>
  );
}