"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FiArrowLeft,
  FiInfo,
  FiMessageCircle,
  FiMoreHorizontal,
  FiSearch,
  FiSend,
  FiVolume2,
  FiTrash2,
  FiSlash,
  FiBookmark,
} from "react-icons/fi";
import api from "@/lib/axios";
import {
  getImageSrc,
  getInitials,
} from "@/components/profile/profileUtils";

type ChatUser = {
  _id: string;
  username: string;
  name?: string;
  profileImage?: string;
};

type ConversationItem = {
  _id: string;
  otherUser: ChatUser | null;
  lastMessage: string;
  lastMessageAt?: string;
  unreadCount: number;
  isPinned: boolean;
  isMuted: boolean;
  isBlockedByMe: boolean;
  isRequest: boolean;
  requestSender?: string | null;
  requestReceiver?: string | null;
};

type MessageItem = {
  _id: string;
  conversationId: string;
  sender: string;
  text: string;
  createdAt: string;
};

type MyProfile = {
  _id: string;
  username: string;
  name?: string;
  profileImage?: string;
};

const formatTimeLabel = (dateString?: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
};

const formatRelativeListTime = (dateString?: string) => {
  if (!dateString) return "";

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  const minute = 1000 * 60;
  const hour = minute * 60;
  const day = hour * 24;
  const month = day * 30;
  const year = day * 365;

  if (diffMs < minute) return "now";

  const minutes = Math.floor(diffMs / minute);
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(diffMs / hour);
  if (hours < 24) return `${hours}h`;

  const days = Math.floor(diffMs / day);
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d`;

  const months = Math.floor(diffMs / month);
  if (months < 12) return `${months}mo`;

  const years = Math.floor(diffMs / year);
  return `${years}y`;
};

export default function MessagesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const threadEndRef = useRef<HTMLDivElement | null>(null);

  const [me, setMe] = useState<MyProfile | null>(null);
  const [inbox, setInbox] = useState<ConversationItem[]>([]);
  const [requests, setRequests] = useState<ConversationItem[]>([]);
  const [selectedTab, setSelectedTab] = useState<"inbox" | "requests">("inbox");
  const [selectedConversation, setSelectedConversation] =
    useState<ConversationItem | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [chatText, setChatText] = useState("");
  const [searchText, setSearchText] = useState("");
  const [infoOpen, setInfoOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  const queryUser = searchParams.get("user");
  const queryChat = searchParams.get("chat");

  const totalUnread = useMemo(() => {
  return inbox.reduce((sum, chat) => sum + (chat.unreadCount || 0), 0);
}, [inbox]);

  const sortInbox = (items: ConversationItem[]) => {
    return [...items].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return (
        new Date(b.lastMessageAt || 0).getTime() -
        new Date(a.lastMessageAt || 0).getTime()
      );
    });
  };

  const fetchLists = async (keepSelectedId?: string | null) => {
    try {
      const [meRes, inboxRes, requestsRes] = await Promise.all([
        api.get("/users/me"),
        api.get("/conversations"),
        api.get("/conversations/requests"),
      ]);

      const nextMe = meRes.data?.user || null;
      const nextInbox = sortInbox(inboxRes.data?.conversations || []);
      const nextRequests = requestsRes.data?.requests || [];

      setMe(nextMe);
      setInbox(nextInbox);
      setRequests(nextRequests);

      if (keepSelectedId) {
        const found =
          nextInbox.find((item: ConversationItem) => item._id === keepSelectedId) ||
          nextRequests.find((item: ConversationItem) => item._id === keepSelectedId);

        if (found) {
          setSelectedConversation(found);
        }
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load messages.");
    }
  };

  const fetchMessages = async (
    conversationId: string,
    silent = false
  ) => {
    try {
      if (!silent) setMessagesLoading(true);

      const res = await api.get(`/conversations/${conversationId}/messages`);
      setMessages(res.data?.messages || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load chat.");
    } finally {
      if (!silent) setMessagesLoading(false);
    }
  };

  const openConversationFromQueryUser = async () => {
    try {
      const res = await api.post("/conversations/start", {
        receiverId: queryUser,
      });

      const created = res.data?.conversation;
      if (!created?._id) return;

      await fetchLists(created._id);
      setSelectedConversation(created);

      const amRequestReceiver =
        created.requestReceiver &&
        me?._id &&
        String(created.requestReceiver) === String(me._id);

      setSelectedTab(created.isRequest && amRequestReceiver ? "requests" : "inbox");

      await fetchMessages(created._id);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to open chat.");
    }
  };

  useEffect(() => {
    const boot = async () => {
      setLoading(true);
      setError("");
      await fetchLists();
      setLoading(false);
    };

    boot();
  }, []);

  useEffect(() => {
    if (!loading && queryUser) {
      openConversationFromQueryUser();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, queryUser]);

  useEffect(() => {
    if (!loading && queryChat) {
      const found =
        inbox.find((item) => item._id === queryChat) ||
        requests.find((item) => item._id === queryChat);

      if (found) {
        setSelectedConversation(found);
        fetchMessages(found._id);
      }
    }
  }, [loading, queryChat, inbox, requests]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (!selectedConversation?._id) return;

    intervalId = setInterval(async () => {
      await fetchMessages(selectedConversation._id, true);
      await fetchLists(selectedConversation._id);
    }, 12000);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [selectedConversation?._id]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const visibleList = useMemo(() => {
    const source = selectedTab === "requests" ? requests : inbox;
    const keyword = searchText.trim().toLowerCase();

    if (!keyword) return source;

    return source.filter((item) => {
      const username = item.otherUser?.username?.toLowerCase() || "";
      const name = item.otherUser?.name?.toLowerCase() || "";
      return username.includes(keyword) || name.includes(keyword);
    });
  }, [selectedTab, requests, inbox, searchText]);

  const amRequestReceiver = Boolean(
    selectedConversation?.isRequest &&
      me?._id &&
      String(selectedConversation?.requestReceiver) === String(me._id)
  );

  const showRequestActions = Boolean(
    selectedConversation?.isRequest && amRequestReceiver
  );

  const handleToggleRequests = () => {
    setSelectedConversation(null);
    setMessages([]);
    setInfoOpen(false);
    setSelectedTab((prev) => (prev === "requests" ? "inbox" : "requests"));
  };

  const handleSelectConversation = async (conversation: ConversationItem) => {
    setSelectedConversation(conversation);
    setInfoOpen(false);
    await fetchMessages(conversation._id);
    await fetchLists(conversation._id);
  };

  const handleSendMessage = async () => {
    const text = chatText.trim();

    if (!text || !selectedConversation?._id) return;

    try {
      setActionLoading(true);
      setError("");

      await api.post(`/conversations/${selectedConversation._id}/messages`, { text });
      setChatText("");
      await fetchMessages(selectedConversation._id, true);
      await fetchLists(selectedConversation._id);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to send message.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcceptRequest = async () => {
    if (!selectedConversation?._id) return;

    try {
      setActionLoading(true);
      setError("");

      const res = await api.patch(
        `/conversations/${selectedConversation._id}/accept`
      );

      const updated = res.data?.conversation;
      await fetchLists(updated?._id || selectedConversation._id);

      if (updated) {
        setSelectedConversation(updated);
      }

      setSelectedTab("inbox");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to accept request.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteConversation = async () => {
    if (!selectedConversation?._id) return;

    try {
      setActionLoading(true);
      setError("");

      await api.delete(`/conversations/${selectedConversation._id}`);
      setMessages([]);
      setSelectedConversation(null);
      setInfoOpen(false);
      await fetchLists();
      setSelectedTab("inbox");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to delete chat.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleTogglePin = async () => {
    if (!selectedConversation?._id) return;

    try {
      setActionLoading(true);
      setError("");
      await api.patch(`/conversations/${selectedConversation._id}/pin`);
      await fetchLists(selectedConversation._id);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to update pin.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleMute = async () => {
    if (!selectedConversation?._id) return;

    try {
      setActionLoading(true);
      setError("");
      await api.patch(`/conversations/${selectedConversation._id}/mute`);
      await fetchLists(selectedConversation._id);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to update mute.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleBlock = async () => {
    if (!selectedConversation?._id) return;

    try {
      setActionLoading(true);
      setError("");
      await api.patch(`/conversations/${selectedConversation._id}/block`);
      await fetchLists(selectedConversation._id);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to update block.");
    } finally {
      setActionLoading(false);
    }
  };

  const goToUserProfile = () => {
    if (!selectedConversation?.otherUser?._id) return;
    router.push(`/user/${selectedConversation.otherUser._id}`);
  };

  const renderAvatar = (user: ChatUser | MyProfile | null, className = "") => {
    if (!user) return null;

    return user.profileImage ? (
      <img
        src={getImageSrc(user.profileImage)}
        alt={user.name || user.username || "User"}
        className={className}
      />
    ) : (
      <div className={`messages-avatar-fallback ${className}`}>
        {getInitials(user.name, user.username)}
      </div>
    );
  };

  return (
    <section className="messages-page">
      <div className="messages-shell">
        <aside className="messages-sidebar">
          <div className="messages-sidebar__top">
            <div className="messages-sidebar__head">
              <h2>Messages</h2>

              <button
                type="button"
                className="messages-requests-link"
                onClick={handleToggleRequests}
              >
                {selectedTab === "requests"
                  ? "Back to inbox"
                  : `Requests${requests.length ? ` (${requests.length})` : ""}`}
              </button>
            </div>

            <div className="messages-search">
              <FiSearch />
              <input
                type="text"
                placeholder="Search"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>
          </div>

          <div className="messages-conversation-list">
            {visibleList.map((conversation) => (
              <button
                key={conversation._id}
                type="button"
                className={`messages-conversation-item ${
                  selectedConversation?._id === conversation._id ? "active" : ""
                }`}
                onClick={() => handleSelectConversation(conversation)}
              >
                <div className="messages-conversation-item__avatar">
                  {renderAvatar(conversation.otherUser, "messages-list-avatar")}
                </div>

                <div className="messages-conversation-item__body">
                  <div className="messages-conversation-item__row">
                    <h4>{conversation.otherUser?.username || "Unknown user"}</h4>
                    <span>{formatRelativeListTime(conversation.lastMessageAt)}</span>
                  </div>

                  <div className="messages-conversation-item__row messages-conversation-item__meta">
                    <p>{conversation.lastMessage || "Start the conversation"}</p>

                    {conversation.unreadCount > 0 && (
                      <span className="messages-dot" />
                    )}
                  </div>
                </div>
              </button>
            ))}

            {!loading && visibleList.length === 0 && (
              <div className="messages-empty-list">
                {selectedTab === "requests"
                  ? "No message requests yet."
                  : "No messages yet."}
              </div>
            )}
          </div>
        </aside>

        <div className="messages-main">
          {error && <div className="messages-alert">{error}</div>}

          {!selectedConversation ? (
            <div className="messages-empty-state">
              <div className="messages-empty-state__icon">
                <FiMessageCircle />
              </div>
              <h3>
                {selectedTab === "requests" ? "Message requests" : "Your messages"}
              </h3>
              <p>
                {selectedTab === "requests"
                  ? "Messages from users who do not follow you will appear here."
                  : "Send a message to start a chat."}
              </p>
            </div>
          ) : (
            <>
              <header className="messages-chat-header">
                <button
                  type="button"
                  className="messages-mobile-back"
                  onClick={() => setSelectedConversation(null)}
                >
                  <FiArrowLeft />
                </button>

                <div
                  className="messages-chat-header__user messages-chat-header__user--clickable"
                  onClick={goToUserProfile}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      goToUserProfile();
                    }
                  }}
                >
                  {renderAvatar(selectedConversation.otherUser, "messages-chat-avatar")}

                  <div>
                    <h3>{selectedConversation.otherUser?.username}</h3>
                    <p>{selectedConversation.otherUser?.name || "PackPalz user"}</p>
                  </div>
                </div>

                <button
                  type="button"
                  className="messages-info-button"
                  onClick={() => setInfoOpen(true)}
                >
                  <FiInfo />
                </button>
              </header>

              <div className="messages-chat-body">
                {messagesLoading ? (
                  <div className="messages-loading">Loading chat...</div>
                ) : (
                  <>
                    <div className="messages-chat-profile-card">
                      <div className="messages-chat-profile-card__avatar">
                        {renderAvatar(
                          selectedConversation.otherUser,
                          "messages-profile-large-avatar"
                        )}
                      </div>
                      <h3>{selectedConversation.otherUser?.username}</h3>
                      <p>{selectedConversation.otherUser?.name || "PackPalz user"}</p>

                      {selectedConversation.otherUser?._id && (
                        <button
                          type="button"
                          className="messages-view-profile-btn"
                          onClick={goToUserProfile}
                        >
                          View profile
                        </button>
                      )}
                    </div>

                    <div className="messages-thread">
                      {messages.length === 0 && (
                        <div className="messages-request-empty">No messages yet.</div>
                      )}

                      {messages.map((message) => {
                        const isMine = String(message.sender) === String(me?._id);

                        return (
                          <div
                            key={message._id}
                            className={`messages-bubble-row ${
                              isMine ? "mine" : "theirs"
                            }`}
                          >
                            {!isMine && (
                              <div className="messages-bubble-avatar">
                                {renderAvatar(
                                  selectedConversation.otherUser,
                                  "messages-bubble-avatar-img"
                                )}
                              </div>
                            )}

                            <div className={`messages-bubble ${isMine ? "mine" : ""}`}>
                              <p>{message.text}</p>
                              <span>{formatTimeLabel(message.createdAt)}</span>
                            </div>
                          </div>
                        );
                      })}

                      <div ref={threadEndRef} />
                    </div>
                  </>
                )}
              </div>

              {showRequestActions ? (
                <div className="messages-request-actions">
                  <p>
                    Accept message request from{" "}
                    <strong>{selectedConversation.otherUser?.username}</strong>?
                  </p>

                  <div className="messages-request-actions__buttons">
                    <button
                      type="button"
                      className="request-action request-action--ghost"
                      onClick={handleToggleBlock}
                      disabled={actionLoading}
                    >
                      Block
                    </button>

                    <button
                      type="button"
                      className="request-action request-action--danger"
                      onClick={handleDeleteConversation}
                      disabled={actionLoading}
                    >
                      Delete
                    </button>

                    <button
                      type="button"
                      className="request-action request-action--primary"
                      onClick={handleAcceptRequest}
                      disabled={actionLoading}
                    >
                      Accept
                    </button>
                  </div>
                </div>
              ) : (
                <div className="messages-composer">
                  <input
                    type="text"
                    placeholder="Message..."
                    value={chatText}
                    onChange={(e) => setChatText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    disabled={actionLoading || selectedConversation.isBlockedByMe}
                  />

                  <button
                    type="button"
                    onClick={handleSendMessage}
                    disabled={
                      actionLoading ||
                      !chatText.trim() ||
                      selectedConversation.isBlockedByMe
                    }
                  >
                    <FiSend />
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        <aside className={`messages-info-drawer ${infoOpen ? "open" : ""}`}>
          <div
            className="messages-info-drawer__backdrop"
            onClick={() => setInfoOpen(false)}
          />

          <div className="messages-info-drawer__panel">
            <div className="messages-info-drawer__head">
              <h3>Chat info</h3>
              <button type="button" onClick={() => setInfoOpen(false)}>
                <FiMoreHorizontal />
              </button>
            </div>

            {selectedConversation && (
              <>
                <div className="messages-info-user">
                  {renderAvatar(
                    selectedConversation.otherUser,
                    "messages-info-user__avatar"
                  )}
                  <h4>{selectedConversation.otherUser?.username}</h4>
                  <p>{selectedConversation.otherUser?.name || "PackPalz user"}</p>
                </div>

                <div className="messages-info-actions">
                  <button type="button" onClick={handleDeleteConversation}>
                    <FiTrash2 />
                    <span>Delete chat</span>
                  </button>

                  <button type="button" onClick={handleToggleBlock}>
                    <FiSlash />
                    <span>
                      {selectedConversation.isBlockedByMe ? "Unblock" : "Block"}
                    </span>
                  </button>

                  <button type="button" onClick={handleToggleMute}>
                    <FiVolume2 />
                    <span>{selectedConversation.isMuted ? "Unmute" : "Mute"}</span>
                  </button>

                  <button type="button" onClick={handleTogglePin}>
                    <FiBookmark />
                    <span>{selectedConversation.isPinned ? "Unpin" : "Pin"}</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}

