"use client";

import Image from "next/image";
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
  message: string;
  createdAt: string;
  user: {
    username: string;
    avatar?: string;
  };
  previewImage?: string;
};

function getGroupLabel(date: string) {
  const now = new Date();
  const created = new Date(date);

  const diff = (now.getTime() - created.getTime()) / (1000 * 60 * 60); // hours

  if (diff <= 24) return "New";
  if (diff <= 24 * 7) return "This Week";
  return "This Month";
}

export default function NotificationsOverlay({
  isOpen,
  onClose,
}: NotificationsOverlayProps) {
  const [activeTab, setActiveTab] = useState<
    "all" | "comments" | "followers"
  >("all");

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);

  // 🔥 FETCH FROM BACKEND
  useEffect(() => {
    if (!isOpen) return;

    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const res = await api.get("/notifications"); // 👈 your backend route
        setNotifications(res.data.notifications || []);
      } catch (err) {
        console.error("Failed to fetch notifications", err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [isOpen]);

  // 🔥 FILTER TABS
  const filtered = useMemo(() => {
    if (activeTab === "comments") {
      return notifications.filter(
        (n) => n.type === "comment" || n.type === "mention"
      );
    }

    if (activeTab === "followers") {
      return notifications.filter(
        (n) => n.type === "follow" || n.type === "follow_request"
      );
    }

    return notifications;
  }, [notifications, activeTab]);

  // 🔥 GROUPING
  const grouped = useMemo(() => {
    const groups: Record<string, NotificationItem[]> = {
      New: [],
      "This Week": [],
      "This Month": [],
    };

    filtered.forEach((n) => {
      const label = getGroupLabel(n.createdAt);
      groups[label].push(n);
    });

    return groups;
  }, [filtered]);

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

            <button onClick={onClose}>
              <FiX />
            </button>
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
                    <div key={item._id} className="notification-item">
                      <div className="notification-item__left">
                        <Image
                          src={item.user?.avatar || "/images/default.png"}
                          alt={item.user?.username}
                          width={40}
                          height={40}
                        />

                        <div>
                          <strong>{item.user?.username}</strong>{" "}
                          {item.message}
                        </div>
                      </div>

                      <div className="notification-item__right">
                        {item.type === "follow_request" ? (
                          <>
                            <span className="dot" />
                            <FiChevronRight />
                          </>
                        ) : item.previewImage ? (
                          <Image
                            src={item.previewImage}
                            alt="preview"
                            width={40}
                            height={40}
                          />
                        ) : null}
                      </div>
                    </div>
                  ))}
                </section>
              ) : null
            )}
        </div>
      </aside>
    </>
  );
}