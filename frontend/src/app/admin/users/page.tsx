"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/lib/axios";
import { useRouter } from "next/navigation";
import {
  FiMoreHorizontal,
  FiSearch,
  FiShield,
  FiUser,
  FiUsers,
} from "react-icons/fi";

type AdminUserItem = {
  _id: string;
  username: string;
  name?: string;
  email: string;
  role: "admin" | "user";
  isActive?: boolean;
  profileImage?: string;
  createdAt?: string;
  followersCount?: number;
};

type FilterType = "all" | "active" | "blocked" | "admin" | "user";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

const getImageSrc = (imageUrl?: string) => {
  if (!imageUrl) return "";
  if (imageUrl.startsWith("http")) return imageUrl;
  return `${BACKEND_URL}${imageUrl}`;
};

const getInitials = (name?: string, username?: string) => {
  const text = name?.trim() || username?.trim() || "U";
  return text.charAt(0).toUpperCase();
};

const formatDate = (dateString?: string) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

export default function AdminUsersPage() {
  const router = useRouter();

  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const res = await api.get("/admin/users");
        setUsers(res.data?.users || []);
      } catch (error) {
        console.error("Failed to load users:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".admin-users-actions")) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const filteredUsers = useMemo(() => {
    let data = [...users];

    if (query.trim()) {
      const search = query.toLowerCase();
      data = data.filter((user) => {
        return (
          user.username?.toLowerCase().includes(search) ||
          user.name?.toLowerCase().includes(search) ||
          user.email?.toLowerCase().includes(search)
        );
      });
    }

    switch (activeFilter) {
      case "active":
        data = data.filter((user) => user.isActive !== false);
        break;
      case "blocked":
        data = data.filter((user) => user.isActive === false);
        break;
      case "admin":
        data = data.filter((user) => user.role === "admin");
        break;
      case "user":
        data = data.filter((user) => user.role === "user");
        break;
      default:
        break;
    }

    return data;
  }, [users, query, activeFilter]);

  const counts = useMemo(() => {
    return {
      all: users.length,
      active: users.filter((user) => user.isActive !== false).length,
      blocked: users.filter((user) => user.isActive === false).length,
      admin: users.filter((user) => user.role === "admin").length,
      user: users.filter((user) => user.role === "user").length,
    };
  }, [users]);

  const handleViewProfile = (userId: string) => {
    setOpenMenuId(null);
    router.push(`/admin/users/${userId}`);
  };

  const handleToggleBlock = async (userId: string) => {
    try {
      setActionLoadingId(userId);
      setOpenMenuId(null);

      const res = await api.patch(`/admin/users/${userId}/block`);
      const updatedUser = res.data?.user;

      if (updatedUser) {
        setUsers((prev) =>
          prev.map((user) =>
            user._id === userId ? { ...user, ...updatedUser } : user
          )
        );
      } else {
        setUsers((prev) =>
          prev.map((user) =>
            user._id === userId
              ? { ...user, isActive: user.isActive === false ? true : false }
              : user
          )
        );
      }
    } catch (error) {
      console.error("Failed to toggle block user:", error);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggleRole = async (userId: string, currentRole: "admin" | "user") => {
    const nextRole = currentRole === "admin" ? "user" : "admin";

    try {
      setActionLoadingId(userId);
      setOpenMenuId(null);

      const res = await api.patch(`/admin/users/${userId}/role`, {
        role: nextRole,
      });

      const updatedUser = res.data?.user;

      if (updatedUser) {
        setUsers((prev) =>
          prev.map((user) =>
            user._id === userId ? { ...user, ...updatedUser } : user
          )
        );
      } else {
        setUsers((prev) =>
          prev.map((user) =>
            user._id === userId ? { ...user, role: nextRole } : user
          )
        );
      }
    } catch (error) {
      console.error("Failed to update role:", error);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <section className="admin-users-page">
      <div className="admin-page-head">
        <div>
          <h1>Users</h1>
          <p>Manage all registered users and their statuses.</p>
        </div>
      </div>

      <div className="admin-users-toolbar">
        <div className="admin-users-search">
          <FiSearch />
          <input
            type="text"
            placeholder="Search by username, email or name..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="admin-users-filters">
          <button
            type="button"
            className={activeFilter === "all" ? "active" : ""}
            onClick={() => setActiveFilter("all")}
          >
            All <span>{counts.all}</span>
          </button>

          <button
            type="button"
            className={activeFilter === "active" ? "active" : ""}
            onClick={() => setActiveFilter("active")}
          >
            Active <span>{counts.active}</span>
          </button>

          <button
            type="button"
            className={activeFilter === "blocked" ? "active" : ""}
            onClick={() => setActiveFilter("blocked")}
          >
            Blocked <span>{counts.blocked}</span>
          </button>

          <button
            type="button"
            className={activeFilter === "admin" ? "active" : ""}
            onClick={() => setActiveFilter("admin")}
          >
            Admin <span>{counts.admin}</span>
          </button>

          <button
            type="button"
            className={activeFilter === "user" ? "active" : ""}
            onClick={() => setActiveFilter("user")}
          >
            Users <span>{counts.user}</span>
          </button>
        </div>
      </div>

      <div className="admin-users-card">
        <div className="admin-users-table">
          <div className="admin-users-table__head">
            <div>User</div>
            <div>Email</div>
            <div>Status</div>
            <div>Role</div>
            <div>Joined</div>
            <div></div>
          </div>

          {loading ? (
            <div className="admin-users-empty">Loading users...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="admin-users-empty">No users found.</div>
          ) : (
            filteredUsers.map((user) => {
              const imageSrc = getImageSrc(user.profileImage);
              const isBlocked = user.isActive === false;
              const isBusy = actionLoadingId === user._id;

              return (
                <div key={user._id} className="admin-users-row">
                  <div className="admin-users-user">
                    <div className="admin-users-avatar">
                      {imageSrc ? (
                        <img src={imageSrc} alt={user.username} />
                      ) : (
                        <span>{getInitials(user.name, user.username)}</span>
                      )}
                    </div>

                    <div className="admin-users-user__meta">
                      <strong>{user.username}</strong>
                      <span>{user.name || user.username}</span>
                    </div>
                  </div>

                  <div className="admin-users-email">{user.email}</div>

                  <div>
                    <span
                      className={`admin-users-badge ${
                        isBlocked ? "blocked" : "active"
                      }`}
                    >
                      {isBlocked ? "Blocked" : "Active"}
                    </span>
                  </div>

                  <div>
                    <span
                      className={`admin-users-badge role ${
                        user.role === "admin" ? "admin" : "user"
                      }`}
                    >
                      {user.role === "admin" ? "Admin" : "User"}
                    </span>
                  </div>

                  <div className="admin-users-date">
                    {formatDate(user.createdAt)}
                  </div>

                  <div className="admin-users-actions">
                    <button
                      type="button"
                      className="admin-users-more"
                      onClick={() =>
                        setOpenMenuId((prev) =>
                          prev === user._id ? null : user._id
                        )
                      }
                      disabled={isBusy}
                    >
                      <FiMoreHorizontal />
                    </button>

                    {openMenuId === user._id && (
                      <div className="admin-users-menu">
                        <button
                          type="button"
                          onClick={() => handleViewProfile(user._id)}
                        >
                          View Profile
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleBlock(user._id)}
                        >
                          {isBlocked ? "Unblock" : "Block"}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleToggleRole(user._id, user.role)
                          }
                        >
                          {user.role === "admin" ? "Make User" : "Make Admin"}
                        </button>

                        <button
                          type="button"
                          onClick={() => setOpenMenuId(null)}
                        >
                          Cancel
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
    </section>
  );
}