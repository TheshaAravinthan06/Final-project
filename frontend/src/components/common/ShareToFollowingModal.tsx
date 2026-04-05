"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FiSearch, FiSend, FiX } from "react-icons/fi";
import api from "@/lib/axios";

type FollowingUser = {
  _id: string;
  username?: string;
  name?: string;
  profileImage?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  shareText: string;
  shareUrl: string;
};

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

const getProfileSrc = (profileImage?: string) => {
  if (!profileImage) return "/images/user-avatar.jpg";
  if (profileImage.startsWith("http")) return profileImage;
  return `${BACKEND_URL}${profileImage}`;
};

export default function ShareToFollowingModal({
  open,
  onClose,
  title = "Share",
  shareText,
  shareUrl,
}: Props) {
  const router = useRouter();
  const [following, setFollowing] = useState<FollowingUser[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [sendingTo, setSendingTo] = useState("");

  useEffect(() => {
    if (!open) return;

    const loadFollowing = async () => {
      try {
        setLoading(true);
        const meRes = await api.get("/users/me");
        const me = meRes.data?.user || meRes.data;
        const myId = me?._id;

        if (!myId) {
          setFollowing([]);
          return;
        }

        const followRes = await api.get(`/users/${myId}/following`);
        setFollowing(followRes.data?.following || []);
      } catch (error) {
        console.error("Failed to load following list:", error);
        setFollowing([]);
      } finally {
        setLoading(false);
      }
    };

    loadFollowing();
  }, [open]);

  const filteredUsers = useMemo(() => {
    const key = search.trim().toLowerCase();
    if (!key) return following;

    return following.filter((user) => {
      const username = user.username?.toLowerCase() || "";
      const name = user.name?.toLowerCase() || "";
      return username.includes(key) || name.includes(key);
    });
  }, [following, search]);

  const handleSend = async (userId: string) => {
    if (!userId || sendingTo) return;

    try {
      setSendingTo(userId);
      const startRes = await api.post("/conversations/start", {
        receiverId: userId,
      });

      const conversation = startRes.data?.conversation;
      if (!conversation?._id) {
        throw new Error("Conversation not found");
      }

      await api.post(`/conversations/${conversation._id}/messages`, {
        text: `${shareText}\n${shareUrl}`,
      });

      onClose();
      router.push(`/messages?chat=${conversation._id}`);
    } catch (error) {
      console.error("Share send failed:", error);
      alert("Failed to share.");
    } finally {
      setSendingTo("");
    }
  };

  if (!open) return null;

  return (
    <div className="share-following-modal-backdrop" onClick={onClose}>
      <div className="share-following-modal" onClick={(e) => e.stopPropagation()}>
        <div className="share-following-modal__header">
          <h3>{title}</h3>
          <button type="button" className="share-close-btn" onClick={onClose}>
            <FiX />
          </button>
        </div>

        <div className="share-following-search">
          <FiSearch />
          <input
            type="text"
            placeholder="Search following"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="share-following-list">
          {loading ? (
            <div className="share-following-empty">Loading...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="share-following-empty">No following users found.</div>
          ) : (
            filteredUsers.map((user) => (
              <button
                key={user._id}
                type="button"
                className="share-following-user"
                onClick={() => handleSend(user._id)}
                disabled={sendingTo === user._id}
              >
                <div className="share-following-user__left">
                  <img src={getProfileSrc(user.profileImage)} alt={user.username || "user"} />
                  <div>
                    <h4>{user.username || "user"}</h4>
                    <p>{user.name || "Following"}</p>
                  </div>
                </div>

                <span className="share-send-chip">
                  {sendingTo === user._id ? "..." : <FiSend />}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
