"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import PlaceAdminModal from "@/components/admin/PlaceAdminModal";

type NotificationItem = {
  _id: string;
  type: "place_like" | "place_comment" | "place_report";
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  place?: {
    _id: string;
    placeName: string;
    imageUrl?: string;
  } | null;
  actor?: {
    _id: string;
    username: string;
  } | null;
};

export default function AdminNotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get("/admin/notifications");
        setItems(res.data.notifications || []);
      } catch (err) {
        console.error(err);
        setError("Failed to load notifications");
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const handleOpen = async (item: NotificationItem) => {
    try {
      await api.patch(`/admin/notifications/${item._id}/read`);
      setItems((prev) =>
        prev.map((entry) =>
          entry._id === item._id ? { ...entry, isRead: true } : entry
        )
      );

      if (item.place?._id) {
        setSelectedPlaceId(item.place._id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <section className="admin-notifications-page">
      <div className="admin-page-head">
        <div>
          <h1>Notifications</h1>
          <p>Likes, comments and reports from users appear here.</p>
        </div>
      </div>

      {loading && <div className="admin-empty-text">Loading notifications...</div>}

      {!loading && error && <div className="admin-empty-text">{error}</div>}

      {!loading && !error && items.length === 0 && (
        <div className="admin-empty-text">No notifications yet.</div>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="admin-notification-list">
          {items.map((item) => (
            <button
              key={item._id}
              type="button"
              className={`admin-notification-card ${
                item.isRead ? "read" : "unread"
              }`}
              onClick={() => handleOpen(item)}
            >
              <div>
                <h4>{item.title}</h4>
                <p>{item.message}</p>
              </div>
              <span>{new Date(item.createdAt).toLocaleString()}</span>
            </button>
          ))}
        </div>
      )}

      {selectedPlaceId && (
        <PlaceAdminModal
          placeId={selectedPlaceId}
          onClose={() => setSelectedPlaceId(null)}
          onPlaceUpdated={() => {}}
          onPlaceDeleted={() => setSelectedPlaceId(null)}
        />
      )}
    </section>
  );
}