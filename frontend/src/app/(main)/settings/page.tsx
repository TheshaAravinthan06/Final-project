"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/axios";
import {
  FiBookmark,
  FiCamera,
  FiChevronLeft,
  FiEdit2,
  FiLock,
  FiLogOut,
  FiMoon,
  FiPower,
  FiSun,
  FiUserX,
  FiMapPin,
  FiCalendar,
  FiGrid,
  FiX,
  FiHeart,
  FiMessageCircle,
} from "react-icons/fi";
import {
  formatJoinedInterests,
  getImageSrc,
  getInitials,
} from "@/components/profile/profileUtils";
import { ProfileUser } from "@/components/profile/types";
import {
  applyTheme,
  getSavedTheme,
  initTheme,
  type AppTheme,
} from "@/lib/theme";

type SettingsTab =
  | "edit-profile"
  | "blocked-accounts"
  | "saved"
  | "appearance"
  | "change-password"
  | "deactivate"
  | "logout";

type SavedCollectionKey = "posts" | "blogs" | "travelPicks" | "itineraries";

type EditForm = {
  username: string;
  name: string;
  bio: string;
  travelInterest: string;
  location: string;
  work: string;
};

type BlockedAccount = {
  _id: string;
  username: string;
  name?: string;
  profileImage?: string;
  bio?: string;
  location?: string;
  work?: string;
};

type SavedPost = {
  _id: string;
  imageUrl?: string;
  caption?: string;
  location?: string;
  createdAt?: string;
  likesCount?: number;
  commentsCount?: number;
  createdBy?: {
    _id?: string;
    username?: string;
    name?: string;
    profileImage?: string;
  } | null;
};

type SavedBlog = {
  _id: string;
  title?: string;
  coverImage?: string;
  excerpt?: string;
  content?: string;
  location?: string;
  createdAt?: string;
  likesCount?: number;
  commentsCount?: number;
  author?: {
    _id?: string;
    username?: string;
    name?: string;
    profileImage?: string;
  } | null;
};

type SavedTravelPick = {
  _id: string;
  title?: string;
  place?: string;
  imageUrl?: string;
  startDate?: string;
  endDate?: string;
  price?: number;
  createdAt?: string;
};

type SavedItinerary = {
  _id: string;
  generatedTitle?: string;
  generatedSummary?: string;
  estimatedCost?: number;
  mood?: string;
  destination?: string;
  days?: number;
  status?: string;
  createdAt?: string;
};

type SavedCollections = {
  posts: {
    title: string;
    count: number;
    items: SavedPost[];
  };
  blogs: {
    title: string;
    count: number;
    items: SavedBlog[];
  };
  travelPicks: {
    title: string;
    count: number;
    items: SavedTravelPick[];
  };
  itineraries: {
    title: string;
    count: number;
    items: SavedItinerary[];
  };
};

type ChangePasswordForm = {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
};

type DeactivateAccountForm = {
  password: string;
  confirmText: string;
  agreed: boolean;
};

const emptyCollections: SavedCollections = {
  posts: { title: "Posts", count: 0, items: [] },
  blogs: { title: "Blogs", count: 0, items: [] },
  travelPicks: { title: "Travel Picks", count: 0, items: [] },
  itineraries: { title: "AI Itineraries", count: 0, items: [] },
};

const settingsItems: {
  key: SettingsTab;
  label: string;
  icon: any;
}[] = [
  { key: "edit-profile", label: "Edit Profile", icon: FiEdit2 },
  { key: "blocked-accounts", label: "Blocked Accounts", icon: FiUserX },
  { key: "saved", label: "Saved", icon: FiBookmark },
  { key: "appearance", label: "Appearance", icon: FiMoon },
  { key: "change-password", label: "Change Password", icon: FiLock },
  { key: "deactivate", label: "Deactivate", icon: FiPower },
  { key: "logout", label: "Logout", icon: FiLogOut },
];

const formatDate = (value?: string) => {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatTimeAgo = (value?: string) => {
  if (!value) return "";
  const now = new Date().getTime();
  const created = new Date(value).getTime();
  const diff = now - created;

  const mins = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;

  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

const getCollectionLabel = (key: SavedCollectionKey) => {
  switch (key) {
    case "posts":
      return "Posts";
    case "blogs":
      return "Blogs";
    case "travelPicks":
      return "Travel Picks";
    case "itineraries":
      return "AI Itineraries";
    default:
      return "Saved";
  }
};

const getCollectionPreviewImages = (
  key: SavedCollectionKey,
  collections: SavedCollections
) => {
  if (key === "posts") {
    return collections.posts.items
      .slice(0, 4)
      .map((item) => item.imageUrl)
      .filter(Boolean) as string[];
  }

  if (key === "blogs") {
    return collections.blogs.items
      .slice(0, 4)
      .map((item) => item.coverImage)
      .filter(Boolean) as string[];
  }

  if (key === "travelPicks") {
    return collections.travelPicks.items
      .slice(0, 4)
      .map((item) => item.imageUrl)
      .filter(Boolean) as string[];
  }

  return [];
};

function SavedCollectionsOverview({
  collections,
  onOpenCollection,
}: {
  collections: SavedCollections;
  onOpenCollection: (key: SavedCollectionKey) => void;
}) {
  const collectionKeys: SavedCollectionKey[] = [
    "posts",
    "blogs",
    "travelPicks",
    "itineraries",
  ];

  return (
    <div className="saved-collections-phone-grid">
      {collectionKeys.map((key) => {
        const label = getCollectionLabel(key);
        const previewImages = getCollectionPreviewImages(key, collections);
        const count =
          key === "posts"
            ? collections.posts.count
            : key === "blogs"
            ? collections.blogs.count
            : key === "travelPicks"
            ? collections.travelPicks.count
            : collections.itineraries.count;

        return (
          <button
            key={key}
            type="button"
            className="saved-phone-folder"
            onClick={() => onOpenCollection(key)}
          >
            <div className="saved-phone-folder__preview">
              {key === "itineraries" ? (
                <div className="saved-phone-folder__ai">
                  <FiGrid />
                  <span>AI</span>
                </div>
              ) : previewImages.length > 0 ? (
                <div className="saved-phone-folder__mosaic">
                  {previewImages.slice(0, 4).map((image, index) => (
                    <div
                      key={`${image}-${index}`}
                      className="saved-phone-folder__tile"
                    >
                      <img src={getImageSrc(image)} alt={label} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="saved-phone-folder__empty">
                  <FiBookmark />
                </div>
              )}
            </div>

            <div className="saved-phone-folder__meta">
              <h4>{label}</h4>
              <p>{count} saved</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function PostSavedModal({
  post,
  onClose,
}: {
  post: SavedPost | null;
  onClose: () => void;
}) {
  if (!post) return null;

  return (
    <div className="saved-modal-backdrop" onClick={onClose}>
      <div className="saved-post-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="saved-modal-close" onClick={onClose}>
          <FiX />
        </button>

        <div className="saved-post-modal__media">
          {post.imageUrl ? (
            <img src={getImageSrc(post.imageUrl)} alt={post.caption || "Post"} />
          ) : (
            <div className="saved-post-modal__placeholder">Post</div>
          )}
        </div>

        <div className="saved-post-modal__side">
          <div className="saved-post-modal__user">
            {post.createdBy?.profileImage ? (
              <img
                src={getImageSrc(post.createdBy.profileImage)}
                alt={post.createdBy.username || "user"}
              />
            ) : (
              <div className="saved-post-modal__avatar-fallback">
                {getInitials(post.createdBy?.username, post.createdBy?.name)}
              </div>
            )}
            <div>
              <h4>{post.createdBy?.name || post.createdBy?.username || "User"}</h4>
              <p>{formatTimeAgo(post.createdAt)}</p>
            </div>
          </div>

          <div className="saved-post-modal__body">
            <p className="saved-post-modal__caption">
              {post.caption || "Saved post"}
            </p>

            {post.location ? (
              <span className="saved-post-modal__location">
                <FiMapPin />
                {post.location}
              </span>
            ) : null}
          </div>

          <div className="saved-post-modal__actions">
            <span>
              <FiHeart /> {post.likesCount || 0}
            </span>
            <span>
              <FiMessageCircle /> {post.commentsCount || 0}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function BlogSavedModal({
  blog,
  onClose,
}: {
  blog: SavedBlog | null;
  onClose: () => void;
}) {
  if (!blog) return null;

  return (
    <div className="saved-modal-backdrop" onClick={onClose}>
      <div className="saved-blog-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="saved-modal-close" onClick={onClose}>
          <FiX />
        </button>

        <div className="saved-blog-modal__media">
          {blog.coverImage ? (
            <img src={getImageSrc(blog.coverImage)} alt={blog.title || "Blog"} />
          ) : (
            <div className="saved-blog-modal__placeholder">Blog</div>
          )}
        </div>

        <div className="saved-blog-modal__content">
          <div className="saved-blog-modal__user">
            {blog.author?.profileImage ? (
              <img
                src={getImageSrc(blog.author.profileImage)}
                alt={blog.author.username || "user"}
              />
            ) : (
              <div className="saved-blog-modal__avatar-fallback">
                {getInitials(blog.author?.username, blog.author?.name)}
              </div>
            )}

            <div>
              <h4>{blog.author?.name || blog.author?.username || "User"}</h4>
              <p>{formatTimeAgo(blog.createdAt)}</p>
            </div>
          </div>

          <h3>{blog.title || "Saved blog"}</h3>

          {blog.location ? (
            <span className="saved-blog-modal__location">
              <FiMapPin />
              {blog.location}
            </span>
          ) : null}

          <p className="saved-blog-modal__excerpt">
            {blog.excerpt || blog.content || "Saved blog item"}
          </p>

          <div className="saved-blog-modal__actions">
            <span>
              <FiHeart /> {blog.likesCount || 0}
            </span>
            <span>
              <FiMessageCircle /> {blog.commentsCount || 0}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function SavedCollectionGrid({
  collectionKey,
  collections,
  onBack,
}: {
  collectionKey: SavedCollectionKey;
  collections: SavedCollections;
  onBack: () => void;
}) {
  const router = useRouter();
  const label = getCollectionLabel(collectionKey);

  const [selectedPost, setSelectedPost] = useState<SavedPost | null>(null);
  const [selectedBlog, setSelectedBlog] = useState<SavedBlog | null>(null);

  return (
    <>
      <div className="saved-phone-collection-page">
        <div className="saved-phone-collection-page__head">
          <button
            type="button"
            className="saved-phone-back-btn"
            onClick={onBack}
          >
            <FiChevronLeft />
          </button>

          <div className="saved-phone-collection-page__title">
            <h3>{label}</h3>
            <p>
              {collectionKey === "posts" && `${collections.posts.count} saved posts`}
              {collectionKey === "blogs" && `${collections.blogs.count} saved blogs`}
              {collectionKey === "travelPicks" &&
                `${collections.travelPicks.count} saved travel picks`}
              {collectionKey === "itineraries" &&
                `${collections.itineraries.count} saved itineraries`}
            </p>
          </div>
        </div>

        {collectionKey === "posts" && (
          <>
            {collections.posts.items.length ? (
              <div className="saved-phone-posts-grid">
                {collections.posts.items.map((item) => (
                  <button
                    key={item._id}
                    type="button"
                    className="saved-phone-grid-item"
                    onClick={() => setSelectedPost(item)}
                  >
                    {item.imageUrl ? (
                      <img
                        src={getImageSrc(item.imageUrl)}
                        alt={item.caption || "Post"}
                      />
                    ) : (
                      <div className="saved-phone-grid-item__placeholder">Post</div>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="saved-grid-empty">No saved posts yet.</div>
            )}
          </>
        )}

        {collectionKey === "blogs" && (
          <>
            {collections.blogs.items.length ? (
              <div className="saved-phone-posts-grid">
                {collections.blogs.items.map((item) => (
                  <button
                    key={item._id}
                    type="button"
                    className="saved-phone-grid-item"
                    onClick={() => setSelectedBlog(item)}
                  >
                    {item.coverImage ? (
                      <img
                        src={getImageSrc(item.coverImage)}
                        alt={item.title || "Blog"}
                      />
                    ) : (
                      <div className="saved-phone-grid-item__placeholder">Blog</div>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="saved-grid-empty">No saved blogs yet.</div>
            )}
          </>
        )}

        {collectionKey === "travelPicks" && (
          <>
            {collections.travelPicks.items.length ? (
              <div className="saved-phone-posts-grid">
                {collections.travelPicks.items.map((item) => (
                  <button
                    key={item._id}
                    type="button"
                    className="saved-phone-grid-item"
                    onClick={() => router.push(`/travel-picks/${item._id}`)}
                  >
                    {item.imageUrl ? (
                      <img
                        src={getImageSrc(item.imageUrl)}
                        alt={item.title || "Travel pick"}
                      />
                    ) : (
                      <div className="saved-phone-grid-item__placeholder">Trip</div>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="saved-grid-empty">No saved travel picks yet.</div>
            )}
          </>
        )}

        {collectionKey === "itineraries" && (
          <>
            {collections.itineraries.items.length ? (
              <div className="saved-itinerary-cards">
                {collections.itineraries.items.map((item) => (
                  <div key={item._id} className="saved-itinerary-card">
                    <h4>{item.generatedTitle || "AI Itinerary"}</h4>
                    <p>{item.generatedSummary || "Saved itinerary"}</p>
                    <span>
                      {item.destination || "Destination not set"} • {item.days || 0} days
                    </span>
                    <strong>
                      LKR {Number(item.estimatedCost || 0).toLocaleString()}
                    </strong>
                  </div>
                ))}
              </div>
            ) : (
              <div className="saved-grid-empty">No saved itineraries yet.</div>
            )}
          </>
        )}
      </div>

      <PostSavedModal post={selectedPost} onClose={() => setSelectedPost(null)} />
      <BlogSavedModal blog={selectedBlog} onClose={() => setSelectedBlog(null)} />
    </>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = (searchParams.get("tab") as SettingsTab) || "edit-profile";
  const currentCollection = searchParams.get("collection") as SavedCollectionKey | null;

  const [profile, setProfile] = useState<ProfileUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [theme, setTheme] = useState<AppTheme>("light");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [blockedAccounts, setBlockedAccounts] = useState<BlockedAccount[]>([]);
  const [blockedLoading, setBlockedLoading] = useState(false);
  const [savedCollections, setSavedCollections] =
    useState<SavedCollections>(emptyCollections);
  const [savedLoading, setSavedLoading] = useState(false);

  const [changePasswordForm, setChangePasswordForm] = useState<ChangePasswordForm>({
  currentPassword: "",
  newPassword: "",
  confirmNewPassword: "",
});
const [changingPassword, setChangingPassword] = useState(false);

const [deactivateForm, setDeactivateForm] = useState<DeactivateForm>({
  password: "",
  confirmText: "",
  agreed: false,
});
const [deactivating, setDeactivating] = useState(false);

  const [form, setForm] = useState<EditForm>({
    username: "",
    name: "",
    bio: "",
    travelInterest: "",
    location: "",
    work: "",
  });

  useEffect(() => {
    initTheme();
    setTheme(getSavedTheme());
  }, []);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const res = await api.get("/users/me");
        const user = res.data?.user;
        setProfile(user);

        setForm({
          username: user?.username || "",
          name: user?.name || "",
          bio: user?.bio || "",
          travelInterest: user?.travelInterest || "",
          location: user?.location || "",
          work: user?.work || "",
        });
      } catch (err: any) {
        setError(err?.response?.data?.message || "Failed to load settings.");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  useEffect(() => {
    if (currentTab !== "blocked-accounts") return;

    const loadBlockedAccounts = async () => {
      try {
        setBlockedLoading(true);
        const res = await api.get("/users/me/blocked-accounts");
        setBlockedAccounts(res.data?.blockedAccounts || []);
      } catch (err: any) {
        setError(err?.response?.data?.message || "Failed to load blocked accounts.");
      } finally {
        setBlockedLoading(false);
      }
    };

    loadBlockedAccounts();
  }, [currentTab]);

  useEffect(() => {
    if (currentTab !== "saved") return;

    const loadSavedCollections = async () => {
      try {
        setSavedLoading(true);
        const res = await api.get("/users/me/saved-collections");
        setSavedCollections(res.data?.collections || emptyCollections);
      } catch (err: any) {
        setError(err?.response?.data?.message || "Failed to load saved collections.");
      } finally {
        setSavedLoading(false);
      }
    };

    loadSavedCollections();
  }, [currentTab]);

  const interestTags = useMemo(
    () => formatJoinedInterests(form.travelInterest),
    [form.travelInterest]
  );

  const changeTab = (tab: SettingsTab) => {
    setMessage("");
    setError("");
    router.push(`/settings?tab=${tab}`);
  };

  const openSavedCollection = (key: SavedCollectionKey) => {
    router.push(`/settings?tab=saved&collection=${key}`);
  };

  const closeSavedCollection = () => {
    router.push(`/settings?tab=saved`);
  };

  const handleFieldChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordFieldChange = (event: ChangeEvent<HTMLInputElement>) => {
  const { name, value } = event.target;
  setChangePasswordForm((prev) => ({
    ...prev,
    [name]: value,
  }));
};

  const handleProfileSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const res = await api.put("/users/me", form);
      const updatedUser = res.data?.user || null;

      setProfile(updatedUser);
      setForm({
        username: updatedUser?.username || "",
        name: updatedUser?.name || "",
        bio: updatedUser?.bio || "",
        travelInterest: updatedUser?.travelInterest || "",
        location: updatedUser?.location || "",
        work: updatedUser?.work || "",
      });

      setMessage("Profile updated successfully.");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (event: FormEvent<HTMLFormElement>) => {
  event.preventDefault();

  try {
    setChangingPassword(true);
    setError("");
    setMessage("");

    await api.put("/auth/change-password", changePasswordForm);

    setChangePasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    });

    setMessage("Password changed successfully. Please log in again.");
  } catch (err: any) {
    setError(err?.response?.data?.message || "Failed to change password.");
  } finally {
    setChangingPassword(false);
  }
};

const handleDeactivateFieldChange = (
  event: ChangeEvent<HTMLInputElement>
) => {
  const { name, value, type, checked } = event.target;

  setDeactivateForm((prev) => ({
    ...prev,
    [name]: type === "checkbox" ? checked : value,
  }));
};

const handleDeactivateAccount = async (
  event: FormEvent<HTMLFormElement>
) => {
  event.preventDefault();

  try {
    setDeactivating(true);
    setError("");
    setMessage("");

    if (!deactivateForm.agreed) {
      setError("Please confirm that you understand this action.");
      return;
    }

    await api.patch("/users/me/deactivate", {
      password: deactivateForm.password,
      confirmText: deactivateForm.confirmText,
    });

    setDeactivateForm({
      password: "",
      confirmText: "",
      agreed: false,
    });

    setMessage("Account deactivated successfully.");
    router.push("/");
  } catch (err: any) {
    setError(err?.response?.data?.message || "Failed to deactivate account.");
  } finally {
    setDeactivating(false);
  }
};

  const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setAvatarUploading(true);
      setError("");
      setMessage("");

      const formData = new FormData();
      formData.append("image", file);

      const res = await api.post("/users/me/avatar", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setProfile(res.data?.user || null);
      setMessage("Profile photo updated successfully.");
    } catch (err: any) {
      setError(
        err?.response?.data?.message || "Failed to upload profile photo."
      );
    } finally {
      setAvatarUploading(false);
      event.target.value = "";
    }
  };

  const handleThemeChange = (nextTheme: AppTheme) => {
    setTheme(nextTheme);
    applyTheme(nextTheme);
  };

  const handleLogout = async () => {
    try {
      setLogoutLoading(true);
      await api.post("/auth/logout");
      router.push("/");
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      setLogoutLoading(false);
    }
  };

  const handleUnblock = async (userId: string) => {
    try {
      await api.post(`/users/${userId}/unblock`);
      setBlockedAccounts((prev) => prev.filter((item) => item._id !== userId));
      setMessage("Account unblocked successfully.");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to unblock account.");
    }
  };

  if (loading) {
    return <div className="profile-loading-shell">Loading settings...</div>;
  }

  if (!profile) {
    return <div className="profile-loading-shell">Settings not found.</div>;
  }

  return (
    <section className="settings-clean-page">
      <div className="settings-clean-shell">
        <aside className="settings-clean-sidebar">
          <div className="settings-clean-sidebar__head">
            <Link href="/profile" className="settings-clean-back">
              <FiChevronLeft />
            </Link>
            <h2>Settings</h2>
          </div>

          <div className="settings-clean-menu">
            {settingsItems.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.key}
                  type="button"
                  className={currentTab === item.key ? "active" : ""}
                  onClick={() => changeTab(item.key)}
                >
                  <Icon />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </aside>

        <div className="settings-clean-content">
          {(message || error) && (
            <div
              className={`profile-clean-alert ${error ? "error" : "success"}`}
            >
              {error || message}
            </div>
          )}

          {currentTab === "edit-profile" ? (
            <>
              <div className="settings-clean-content__head">
                <h3>Edit Profile</h3>
              </div>

              <form className="settings-clean-form" onSubmit={handleProfileSave}>
                <div className="settings-clean-avatar-row">
                  <div className="settings-clean-avatar">
                    {profile.profileImage ? (
                      <img
                        src={getImageSrc(profile.profileImage)}
                        alt={profile.username || profile.name}
                      />
                    ) : (
                      <div className="settings-clean-avatar__fallback">
                        {getInitials(profile.username, profile.name)}
                      </div>
                    )}
                  </div>

                  <label className="settings-clean-photo-btn">
                    <FiCamera />
                    {avatarUploading ? "Uploading..." : "Change photo"}
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={handleAvatarChange}
                    />
                  </label>
                </div>

                <div className="settings-clean-intro">
                  <h4>{form.username || profile.username}</h4>
                  <p>@{form.name || profile.name || profile.username}</p>
                </div>

                <div className="settings-clean-group">
                  <label>Bio</label>
                  <textarea
                    name="bio"
                    value={form.bio}
                    onChange={handleFieldChange}
                    rows={4}
                    placeholder="Tell people a little about your travel vibe"
                  />
                </div>

                <div className="settings-clean-group">
                  <label>Travel Interests</label>
                  <input
                    name="travelInterest"
                    value={form.travelInterest}
                    onChange={handleFieldChange}
                    placeholder="Beaches, Nature, Solo Trips"
                  />
                </div>

                {!!interestTags.length && (
                  <div className="profile-clean-tags profile-clean-tags--left">
                    {interestTags.map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                )}

                <div className="settings-clean-group">
                  <label>Location</label>
                  <input
                    name="location"
                    value={form.location}
                    onChange={handleFieldChange}
                    placeholder="Jaffna, Sri Lanka"
                  />
                </div>

                <div className="settings-clean-group">
                  <label>Name</label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleFieldChange}
                    placeholder="Your name"
                  />
                </div>

                <div className="settings-clean-row">
                  <div className="settings-clean-group">
                    <label>Work</label>
                    <input
                      name="work"
                      value={form.work}
                      onChange={handleFieldChange}
                      placeholder="Student / Travel Blogger"
                    />
                  </div>

                  <div className="settings-clean-group">
                    <label>Email</label>
                    <input value={profile.email || ""} readOnly placeholder="Email" />
                  </div>
                </div>

                <div className="settings-clean-group">
                  <label>Username</label>
                  <input
                    name="username"
                    value={form.username}
                    onChange={handleFieldChange}
                    placeholder="Username"
                  />
                </div>

                <div className="settings-clean-actions">
                  <button
                    type="submit"
                    className="profile-clean-primary-btn"
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </>
          ) : currentTab === "blocked-accounts" ? (
            <>
              <div className="settings-clean-content__head">
                <h3>Blocked Accounts</h3>
              </div>

              {blockedLoading ? (
                <div className="settings-clean-placeholder__body">
                  <p>Loading blocked accounts...</p>
                </div>
              ) : blockedAccounts.length === 0 ? (
                <div className="settings-clean-placeholder__body">
                  <p>No blocked accounts yet.</p>
                </div>
              ) : (
                <div className="settings-blocked-list">
                  {blockedAccounts.map((user) => (
                    <div key={user._id} className="settings-blocked-card">
                      <div className="settings-blocked-card__left">
                        <div className="settings-blocked-card__avatar">
                          {user.profileImage ? (
                            <img
                              src={getImageSrc(user.profileImage)}
                              alt={user.username}
                            />
                          ) : (
                            <div className="settings-blocked-card__avatar-fallback">
                              {getInitials(user.username, user.name)}
                            </div>
                          )}
                        </div>

                        <div className="settings-blocked-card__text">
                          <h4>{user.name || user.username}</h4>
                          <p>@{user.username}</p>
                          {user.bio ? <span>{user.bio}</span> : null}
                        </div>
                      </div>

                      <button
                        type="button"
                        className="settings-unblock-btn"
                        onClick={() => handleUnblock(user._id)}
                      >
                        Unblock
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : currentTab === "saved" ? (
            <>
              <div className="settings-clean-content__head">
                <h3>Saved</h3>
              </div>

              {savedLoading ? (
                <div className="settings-clean-placeholder__body">
                  <p>Loading saved collections...</p>
                </div>
              ) : currentCollection ? (
                <SavedCollectionGrid
                  collectionKey={currentCollection}
                  collections={savedCollections}
                  onBack={closeSavedCollection}
                />
              ) : (
                <SavedCollectionsOverview
                  collections={savedCollections}
                  onOpenCollection={openSavedCollection}
                />
              )}
            </>
          
          

          ) : currentTab === "change-password" ? (
  <>
    <div className="settings-clean-content__head">
      <h3>Change Password</h3>
    </div>

    <form className="settings-password-form" onSubmit={handleChangePassword}>
      
      <div className="settings-password-note">
        <p>
          Your password must be at least 8 characters and include a mix of letters, numbers and symbols.
        </p>
      </div>

      <div className="settings-password-field">
        <input
          type="password"
          name="currentPassword"
          value={changePasswordForm.currentPassword}
          onChange={handlePasswordFieldChange}
          placeholder="Current password"
        />
      </div>

      <div className="settings-password-field">
        <input
          type="password"
          name="newPassword"
          value={changePasswordForm.newPassword}
          onChange={handlePasswordFieldChange}
          placeholder="New password"
        />
      </div>

      <div className="settings-password-field">
        <input
          type="password"
          name="confirmNewPassword"
          value={changePasswordForm.confirmNewPassword}
          onChange={handlePasswordFieldChange}
          placeholder="Re-type new password"
        />
      </div>

      <div className="settings-password-extra">
        <Link href="/forgot-password" className="settings-password-forgot">
  Forgot password?
</Link>

        <label className="settings-password-logout">
          <input type="checkbox" />
          Log out of other devices
        </label>
      </div>

      <button
        type="submit"
        className="settings-password-btn"
        disabled={changingPassword}
      >
        {changingPassword ? "Updating..." : "Change password"}
      </button>
    </form>
  </>
     
     ) : currentTab === "deactivate" ? (
  <>
    <div className="settings-clean-content__head">
      <h3>Deactivate Account</h3>
    </div>

    <form className="settings-deactivate-form" onSubmit={handleDeactivateAccount}>
      <div className="settings-deactivate-warning">
        <h4>Deactivate your account</h4>
        <p>
          Deactivating your account will hide your profile and
           content from other users. You can reactivate anytime by logging back in. 
           This action does not delete your data, 
           but it will no longer be visible on the platform.
        </p>
      </div>

      <div className="settings-deactivate-field">
        <label>Password</label>
        <input
          type="password"
          name="password"
          value={deactivateForm.password}
          onChange={handleDeactivateFieldChange}
          placeholder="Enter your password"
        />
      </div>

      <div className="settings-deactivate-field">
        <label>Type DEACTIVATE to confirm</label>
        <input
          type="text"
          name="confirmText"
          value={deactivateForm.confirmText}
          onChange={handleDeactivateFieldChange}
          placeholder="DEACTIVATE"
        />
      </div>

      <label className="settings-deactivate-check">
        <input
          type="checkbox"
          name="agreed"
          checked={deactivateForm.agreed}
          onChange={handleDeactivateFieldChange}
        />
        <span>I understand that this action will deactivate my account.</span>
      </label>

      <div className="settings-deactivate-actions">
        <button
          type="submit"
          className="settings-deactivate-btn"
          disabled={deactivating}
        >
          {deactivating ? "Deactivating..." : "Deactivate account"}
        </button>
      </div>
    </form>
  </>
     
        ) : currentTab === "logout" ? (
            <div className="settings-clean-placeholder">
              <div className="settings-clean-placeholder__inner">
                <div className="settings-clean-content__head settings-clean-content__head--placeholder">
                  <h3>Logout</h3>
                </div>

                <div className="settings-logout-box">
                  <p>You can safely log out from here.</p>
                  <button
                    type="button"
                    className="settings-logout-box__btn"
                    onClick={handleLogout}
                    disabled={logoutLoading}
                  >
                    <FiLogOut />
                    {logoutLoading ? "Logging out..." : "Log out"}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="settings-clean-placeholder">
              <div className="settings-clean-placeholder__inner">
                <div className="settings-clean-content__head settings-clean-content__head--placeholder">
                  <h3>
                    {settingsItems.find((item) => item.key === currentTab)?.label}
                  </h3>
                </div>

                <div className="settings-clean-placeholder__body">
                  <p>This section can be connected next.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}