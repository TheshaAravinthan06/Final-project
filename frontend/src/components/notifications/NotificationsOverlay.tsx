"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/lib/axios";
import { FiX } from "react-icons/fi";

type NotificationsOverlayProps = {
  isOpen: boolean;
  onClose: () => void;
};

type NotificationActor = {
  _id?: string;
  username?: string;
  name?: string;
  profileImage?: string;
};

type NotificationItem = {
  _id: string;
  type: string;
  title?: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  previewImage?: string;
  actor?: NotificationActor | null;
};

const getImageUrl = (path?: string) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;

  const base =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

  return `${base}${path}`;
};

const getGroupedNotifications = (items: NotificationItem[]) => {
  const now = new Date();

  const groups: Record<string, NotificationItem[]> = {
    New: [],
    "This Week": [],
    Earlier: [],
  };

  items.forEach((item) => {
    const created = new Date(item.createdAt);
    const diffHours = (now.getTime() - created.getTime()) / (1000 * 60 * 60);

    if (diffHours <= 24) {
      groups.New.push(item);
    } else if (diffHours <= 24 * 7) {
      groups["This Week"].push(item);
    } else {
      groups.Earlier.push(item);
    }
  });

  return groups;
};

export default function NotificationsOverlay({
  isOpen,
  onClose,
}: NotificationsOverlayProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const emitUnreadCount = (count: number) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("notifications:updated", {
          detail: { unreadCount: count },
        })
      );
    }
  };

  const fetchNotifications = async () => {
  try {
    setLoading(true);

    const hasClientToken =
      typeof window !== "undefined" &&
      Boolean(
        localStorage.getItem("token") ||
          sessionStorage.getItem("token") ||
          localStorage.getItem("accessToken") ||
          sessionStorage.getItem("accessToken")
      );

    if (!hasClientToken) {
      setNotifications([]);
      setUnreadCount(0);
      emitUnreadCount(0);
      return;
    }

    const res = await api.get("/notifications");

    const items = Array.isArray(res.data?.notifications)
      ? res.data.notifications
      : [];
    const unread = Number(res.data?.unreadCount || 0);

    setNotifications(items);
    setUnreadCount(unread);
    emitUnreadCount(unread);
  } catch (error: any) {
    if (error?.response?.status === 401) {
      setNotifications([]);
      setUnreadCount(0);
      emitUnreadCount(0);
      return;
    }

    console.error("Failed to fetch notifications:", error);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    if (!isOpen) return;
    fetchNotifications();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  const groupedNotifications = useMemo(
    () => getGroupedNotifications(notifications),
    [notifications]
  );

  const handleRead = async (id: string) => {
    try {
      const target = notifications.find((item) => item._id === id);
      if (!target || target.isRead) return;

      await api.patch(`/notifications/${id}/read`);

      const updatedNotifications = notifications.map((item) =>
        item._id === id ? { ...item, isRead: true } : item
      );

      const updatedUnreadCount = updatedNotifications.filter(
        (item) => !item.isRead
      ).length;

      setNotifications(updatedNotifications);
      setUnreadCount(updatedUnreadCount);
      emitUnreadCount(updatedUnreadCount);
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const handleReadAll = async () => {
  try {
    const hasClientToken =
      typeof window !== "undefined" &&
      Boolean(
        localStorage.getItem("token") ||
          sessionStorage.getItem("token") ||
          localStorage.getItem("accessToken") ||
          sessionStorage.getItem("accessToken")
      );

    if (!hasClientToken) {
      setUnreadCount(0);
      return;
    }

    if (unreadCount === 0) return;

    await api.patch("/notifications/read-all");

    const updatedNotifications = notifications.map((item) => ({
      ...item,
      isRead: true,
    }));

    setNotifications(updatedNotifications);
    setUnreadCount(0);
    emitUnreadCount(0);
  } catch (error: any) {
    if (error?.response?.status === 401) {
      setUnreadCount(0);
      return;
    }

    console.error("Failed to mark all as read:", error);
  }
};

  if (!isOpen) return null;

  return (
    <>
      <div className="overlay-backdrop open" onClick={onClose} />

      <aside className="notifications-overlay open">
        <div className="notifications-overlay__header">
          <div className="notifications-overlay__top">
            <h2 className="notifications-overlay__title">Notifications</h2>

            <button
              type="button"
              className="notifications-overlay__close"
              onClick={onClose}
              aria-label="Close notifications"
            >
              <FiX />
            </button>
          </div>

          <div className="notifications-overlay__subbar">
            <div className="notifications-overlay__unread">
              {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
            </div>

            <button
              type="button"
              className="notifications-overlay__mark-all"
              onClick={handleReadAll}
              disabled={unreadCount === 0 || loading} //false disable when loading, true disable when no unread or loading
            >
              Mark all read
            </button>
          </div>
        </div>

        <div className="notifications-overlay__body">
          {loading ? (
            <div className="notifications-empty">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="notifications-empty">No notifications yet.</div>
          ) : (
            <>
              {Object.entries(groupedNotifications).map(([groupName, items]) =>
                items.length > 0 ? (
                  <section key={groupName} className="notifications-group">
                    <h3>{groupName}</h3>

                    <div className="notifications-list">
                      {items.map((item) => (
                        <button
                          key={item._id}
                          type="button"
                          className={`notification-row ${
                            item.isRead ? "read" : "unread"
                          }`}
                          onClick={() => handleRead(item._id)}
                        >
                          <div className="notification-row__avatar">
                            {item.actor?.profileImage ? (
                              <img
                                src={getImageUrl(item.actor.profileImage)}
                                alt={item.actor.username || "user"}
                              />
                            ) : item.previewImage ? (
                              <img
                                src={getImageUrl(item.previewImage)}
                                alt="notification preview"
                              />
                            ) : (
                              <div className="notification-row__avatar-fallback">
                                {(
                                  item.actor?.username ||
                                  item.title ||
                                  item.message ||
                                  "N"
                                )
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>
                            )}
                          </div>

                          <div className="notification-row__content">
                            <p>{item.message}</p>
                            <span>
                              {new Date(item.createdAt).toLocaleString()}
                            </span>
                          </div>

                          {!item.isRead && (
                            <span className="notification-row__dot" />
                          )}
                        </button>
                      ))}
                    </div>
                  </section>
                ) : null
              )}
            </>
          )}
        </div>
      </aside>
    </>
  );
}