"use client";

import { useEffect, useState } from "react";
import { FiX, FiTrash2 } from "react-icons/fi";
import api from "@/lib/axios";

type Comment = {
  _id: string;
  text: string;
  user?: {
    _id?: string;
    username?: string;
    profileImage?: string;
  };
};

type Props = {
  open: boolean;
  onClose: () => void;
  comments: Comment[];
  postId: string;
  type: "place" | "post";
  onRefresh: () => void;
};

export default function CommentsModal({
  open,
  onClose,
  comments,
  postId,
  type,
  onRefresh,
}: Props) {
  const [currentUserId, setCurrentUserId] = useState("");

  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await api.get("/users/me");
        const me = res.data?.user || res.data;
        setCurrentUserId(me?._id || "");
      } catch {}
    };

    if (open) loadUser();
  }, [open]);

  const handleDelete = async (commentId: string) => {
    try {
      if (type === "place") {
        await api.delete(`/places/${postId}/comments/${commentId}`);
      } else {
        await api.delete(`/user-posts/${postId}/comments/${commentId}`);
      }

      onRefresh();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  if (!open) return null;

  return (
    <div className="comments-modal-backdrop" onClick={onClose}>
      <div
        className="comments-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="comments-modal__header">
          <h3>Comments</h3>
          <button onClick={onClose}>
            <FiX />
          </button>
        </div>

        <div className="comments-modal__list">
          {comments.length === 0 ? (
            <p className="empty">No comments yet</p>
          ) : (
            comments.map((c) => (
              <div key={c._id} className="comment-item">
                <div>
                  <strong>{c.user?.username || "user"}</strong>
                  <p>{c.text}</p>
                </div>

                {c.user?._id === currentUserId && (
                  <button
                    className="delete-btn"
                    onClick={() => handleDelete(c._id)}
                  >
                    <FiTrash2 />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}