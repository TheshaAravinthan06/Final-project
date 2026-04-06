"use client";

import { useEffect, useMemo, useState } from "react";
import { FiTrash2, FiX } from "react-icons/fi";
import api from "@/lib/axios";

type CommentUser = {
  _id?: string;
  username?: string;
  profileImage?: string;
};

type CommentItem = {
  _id: string;
  text: string;
  createdAt?: string;
  user?: CommentUser;
};

type Props = {
  open: boolean;
  onClose: () => void;
  comments: CommentItem[];
  itemId: string;
  type: "place" | "post";
  onDeleted?: () => void;
};

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

const getProfileSrc = (profileImage?: string) => {
  if (!profileImage) return "/images/user-avatar.jpg";
  if (profileImage.startsWith("http")) return profileImage;
  return `${BACKEND_URL}${profileImage}`;
};

const formatTimeAgo = (dateString?: string) => {
  if (!dateString) return "";

  const now = new Date().getTime();
  const created = new Date(dateString).getTime();
  const diffMs = now - created;

  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;

  return new Date(dateString).toLocaleDateString();
};

export default function CommentsModal({
  open,
  onClose,
  comments,
  itemId,
  type,
  onDeleted,
}: Props) {
  const [currentUserId, setCurrentUserId] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [replyingTo, setReplyingTo] = useState("");
  const [replyText, setReplyText] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!open) return;

    const loadCurrentUser = async () => {
      try {
        const res = await api.get("/users/me");
        const me = res.data?.user || res.data;
        setCurrentUserId(me?._id || "");
      } catch (error) {
        console.error("Failed to load current user:", error);
      }
    };

    loadCurrentUser();
  }, [open]);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 1600);
  };

  const handleDelete = async (commentId: string) => {
    try {
      setDeletingId(commentId);

      if (type === "place") {
        await api.delete(`/places/${itemId}/comments/${commentId}`);
      } else {
        await api.delete(`/user-posts/${itemId}/comments/${commentId}`);
      }

      showToast("Comment deleted");
      onDeleted?.();
    } catch (error) {
      console.error("Delete comment failed:", error);
      showToast("Delete failed");
    } finally {
      setDeletingId("");
    }
  };

  const handleReply = async () => {
    if (!replyingTo || !replyText.trim()) return;

    try {
      if (type === "place") {
        await api.post(`/places/${itemId}/comments`, {
          text: `@reply ${replyText.trim()}`,
        });
      } else {
        await api.post(`/user-posts/${itemId}/comment`, {
          text: `@reply ${replyText.trim()}`,
        });
      }

      setReplyText("");
      setReplyingTo("");
      showToast("Reply posted");
      onDeleted?.();
    } catch (error) {
      console.error("Reply failed:", error);
      showToast("Reply failed");
    }
  };

  const sortedComments = useMemo(() => {
    return [...comments].sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return aTime - bTime;
    });
  }, [comments]);

  if (!open) return null;

  return (
    <>
      <div className="comments-modal-backdrop" onClick={onClose}>
        <div className="comments-modal insta-comments-modal" onClick={(e) => e.stopPropagation()}>
          <div className="comments-modal__header">
            <h3>Comments</h3>
            <button
              type="button"
              className="comments-modal__close-btn"
              onClick={onClose}
            >
              <FiX />
            </button>
          </div>

          <div className="comments-modal__body">
            {sortedComments.length === 0 ? (
              <div className="comments-modal__empty">No comments yet.</div>
            ) : (
              sortedComments.map((comment) => {
                const isOwnComment =
                  currentUserId &&
                  comment.user?._id &&
                  String(currentUserId) === String(comment.user._id);

                const isReplying = replyingTo === comment._id;

                return (
                  <div key={comment._id} className="insta-comment">
                    <img
                      className="insta-comment__avatar"
                      src={getProfileSrc(comment.user?.profileImage)}
                      alt={comment.user?.username || "user"}
                    />

                    <div className="insta-comment__main">
                      <p className="insta-comment__text">
                        <strong>{comment.user?.username || "user"}</strong>{" "}
                        {comment.text}
                      </p>

                      <div className="insta-comment__meta">
                        <span>{formatTimeAgo(comment.createdAt)}</span>

                        <button
                          type="button"
                          className="insta-comment__reply-btn"
                          onClick={() =>
                            setReplyingTo(isReplying ? "" : comment._id)
                          }
                        >
                          Reply
                        </button>

                        {isOwnComment && (
                          <button
                            type="button"
                            className="insta-comment__delete-btn"
                            onClick={() => handleDelete(comment._id)}
                            disabled={deletingId === comment._id}
                          >
                            {deletingId === comment._id ? "Deleting..." : "Delete"}
                          </button>
                        )}
                      </div>

                      {isReplying && (
                        <div className="insta-comment__reply-box">
                          <input
                            type="text"
                            placeholder="Write a reply..."
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                          />
                          <button type="button" onClick={handleReply}>
                            Post
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {toast && <div className="save-toast">{toast}</div>}
    </>
  );
}