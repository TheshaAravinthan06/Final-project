"use client";

import { useEffect, useMemo, useState } from "react";
import { FiChevronRight, FiX } from "react-icons/fi";
import api from "@/lib/axios";

type NotificationsOverlayProps = {
  isOpen: boolean;
  onClose: () => void;
};

type NotificationItem = {
  _id: string;
  type: string;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  previewImage?: string;
  actor?: {
    _id: string;
    username: string;
    name?: string;
    profileImage?: string;
  } | null;
};

function getGroupLabel(date: string) {
  const now = new Date();
  const created = new Date(date);
  const diffHours = (now.getTime() - created.getTime()) / (1000 * 60 * 60);

  if (diffHours <= 24) return "New";
  if (diffHours <= 24 * 7) return "This Week";
  return "This Month";
}

const getImageUrl = (path?: string) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
  return `${base}${path}`;
};

export default function NotificationsOverlay({
  isOpen,
  onClose,
}: NotificationsOverlayProps) {
  const [activeTab, setActiveTab] = useState<"all" | "comments" | "followers">(
    "all"
  );
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get("/notifications");
      setNotifications(res.data.notifications || []);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    fetchNotifications();
  }, [isOpen]);

  const filtered = useMemo(() => {
    if (activeTab === "comments") {
      return notifications.filter((n) => ["comment", "reply"].includes(n.type));
    }

    if (activeTab === "followers") {
      return notifications.filter((n) => n.type === "follow");
    }

    return notifications;
  }, [notifications, activeTab]);

  const grouped = useMemo(() => {
    const groups: Record<string, NotificationItem[]> = {
      New: [],
      "This Week": [],
      "This Month": [],
    };

    filtered.forEach((item) => {
      groups[getGroupLabel(item.createdAt)].push(item);
    });

    return groups;
  }, [filtered]);

  const handleRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((item) =>
          item._id === id ? { ...item, isRead: true } : item
        )
      );
    } catch (error) {
      console.error("Read failed:", error);
    }
  };

  const handleReadAll = async () => {
    try {
      await api.patch("/notifications/read-all");
      setNotifications((prev) =>
        prev.map((item) => ({ ...item, isRead: true }))
      );
    } catch (error) {
      console.error("Read all failed:", error);
    }
  };

  return (
    <>
      <div
        className={`overlay-backdrop ${isOpen ? "open" : ""}`}
        onClick={onClose}
      />

      <aside className={`notifications-overlay ${isOpen ? "open" : ""}`}>
        <div className="notifications-overlay__header">
          <div className="notifications-overlay__title-row">
            <h2>Notifications</h2>

            <div className="notifications-overlay__actions">
              <button type="button" onClick={handleReadAll}>
                Mark all read
              </button>

              <button onClick={onClose}>
                <FiX />
              </button>
            </div>
          </div>

          <div className="notifications-overlay__tabs">
            <button
              className={activeTab === "all" ? "active" : ""}
              onClick={() => setActiveTab("all")}
            >
              All
            </button>

            <button
              className={activeTab === "comments" ? "active" : ""}
              onClick={() => setActiveTab("comments")}
            >
              Comments
            </button>

            <button
              className={activeTab === "followers" ? "active" : ""}
              onClick={() => setActiveTab("followers")}
            >
              Followers
            </button>
          </div>
        </div>

        <div className="notifications-overlay__body">
          {loading && <p>Loading...</p>}

          {!loading &&
            ["New", "This Week", "This Month"].map((group) =>
              grouped[group]?.length ? (
                <section key={group}>
                  <h3>{group}</h3>

                  {grouped[group].map((item) => (
                    <button
                      key={item._id}
                      type="button"
                      className={`notification-row ${item.isRead ? "read" : "unread"}`}
                      onClick={() => handleRead(item._id)}
                    >
                      <div className="notification-row__avatar">
                        {item.actor?.profileImage ? (
                          <img
                            src={getImageUrl(item.actor.profileImage)}
                            alt={item.actor.username}
                          />
                        ) : (
                          <div className="notification-row__avatar-fallback">
                            {(item.actor?.username || "U").charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>

                      <div className="notification-row__content">
                        <p>{item.message}</p>
                        <span>{new Date(item.createdAt).toLocaleString()}</span>
                      </div>

                      <span className="notification-row__arrow">
                        <FiChevronRight />
                      </span>
                    </button>
                  ))}
                </section>
              ) : null
            )}

          {!loading && filtered.length === 0 && (
            <div className="notifications-empty">No notifications yet.</div>
          )}
        </div>
      </aside>
    </>
  );
}