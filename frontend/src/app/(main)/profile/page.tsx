"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/lib/axios";
import { FiGrid, FiMapPin, FiStar, FiUser } from "react-icons/fi";
import ProfilePostGrid from "@/components/profile/ProfilePostGrid";
import ProfileReviews from "@/components/profile/ProfileReviews";
import ProfileTravelHistory from "@/components/profile/ProfileTravelHistory";
import ProfileGridModal from "@/components/profile/ProfileGridModal";
import ProfileEditItemModal from "@/components/profile/ProfileEditItemModal";
import {
  formatJoinedInterests,
  getImageSrc,
  getInitials,
} from "@/components/profile/profileUtils";
import {
  ProfileGridItem,
  ProfileUser,
  ReviewItem,
  UserProfileBlog,
  UserProfilePost,
} from "@/components/profile/types";

export default function MyProfilePage() {
  const [profile, setProfile] = useState<ProfileUser | null>(null);
  const [posts, setPosts] = useState<ProfileGridItem[]>([]);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [activeTab, setActiveTab] = useState<"posts" | "reviews" | "history">(
    "posts"
  );
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [editingItem, setEditingItem] = useState<ProfileGridItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  useEffect(() => {
    const loadMyProfile = async () => {
      try {
        setLoading(true);
        setError("");
        setMessage("");

        const profileRes = await api.get("/users/me");
        const myUser = profileRes.data?.user || profileRes.data || null;
        setProfile(myUser);

        if (!myUser?._id) {
          setLoading(false);
          return;
        }

        const [postsRes, blogsRes, reviewsRes] = await Promise.allSettled([
          api.get(`/user-posts/user/${myUser._id}`),
          api.get(`/blogs/user/${myUser._id}`),
          api.get(`/users/${myUser._id}/reviews`),
        ]);

        const userPosts: ProfileGridItem[] =
          postsRes.status === "fulfilled"
            ? (postsRes.value.data?.posts || []).map((post: UserProfilePost) => ({
                ...post,
                type: "post" as const,
              }))
            : [];

        const userBlogs: ProfileGridItem[] =
          blogsRes.status === "fulfilled"
            ? (blogsRes.value.data?.blogs || []).map((blog: UserProfileBlog) => ({
                ...blog,
                type: "blog" as const,
              }))
            : [];

        const mergedItems = [...userPosts, ...userBlogs].sort((a, b) => {
          const aDate = new Date(a.createdAt || 0).getTime();
          const bDate = new Date(b.createdAt || 0).getTime();
          return bDate - aDate;
        });

        setPosts(mergedItems);

        if (reviewsRes.status === "fulfilled") {
          setReviews(reviewsRes.value.data?.reviews || reviewsRes.value.data || []);
        }
      } catch (err: any) {
        setError(err?.response?.data?.message || "Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };

    loadMyProfile();
  }, []);

  const interestTags = useMemo(
    () => formatJoinedInterests(profile?.travelInterest),
    [profile?.travelInterest]
  );

  const selectedItem =
    selectedIndex !== null && posts[selectedIndex] ? posts[selectedIndex] : null;

  const handleOpenItem = (item: ProfileGridItem) => {
    const index = posts.findIndex(
      (post) => post._id === item._id && post.type === item.type
    );

    if (index !== -1) {
      setSelectedIndex(index);
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setSelectedIndex(null);
    setIsModalOpen(false);
  };

  const handlePrevItem = () => {
    if (selectedIndex === null || posts.length === 0) return;
    setSelectedIndex((selectedIndex - 1 + posts.length) % posts.length);
  };

  const handleNextItem = () => {
    if (selectedIndex === null || posts.length === 0) return;
    setSelectedIndex((selectedIndex + 1) % posts.length);
  };

  const replaceItemInState = (updatedItem: ProfileGridItem) => {
    setPosts((prev) =>
      prev.map((item) =>
        item._id === updatedItem._id && item.type === updatedItem.type
          ? updatedItem
          : item
      )
    );

    if (selectedIndex !== null) {
      setSelectedIndex((currentIndex) => {
        if (currentIndex === null) return null;
        const current = posts[currentIndex];
        if (
          current &&
          current._id === updatedItem._id &&
          current.type === updatedItem.type
        ) {
          return currentIndex;
        }
        return currentIndex;
      });
    }
  };

  const handleOpenEdit = (item: ProfileGridItem) => {
    setEditingItem(item);
    setIsEditModalOpen(true);
  };

  const handleCloseEdit = () => {
    setEditingItem(null);
    setIsEditModalOpen(false);
  };

  const handleSaveEdit = async (payload: FormData) => {
    if (!editingItem) return;

    try {
      setIsSavingEdit(true);
      setError("");
      setMessage("");

      if (editingItem.type === "blog") {
        const res = await api.put(`/blogs/${editingItem._id}`, payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        const updatedBlog = res.data?.blog;
        if (updatedBlog) {
          const updatedItem: ProfileGridItem = {
            ...updatedBlog,
            type: "blog",
          };
          replaceItemInState(updatedItem);
          setMessage("Blog updated successfully.");
        }
      } else {
        const res = await api.put(`/user-posts/${editingItem._id}`, payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        const updatedPost = res.data?.post;
        if (updatedPost) {
          const updatedItem: ProfileGridItem = {
            ...updatedPost,
            type: "post",
          };
          replaceItemInState(updatedItem);
          setMessage("Post updated successfully.");
        }
      }

      handleCloseEdit();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to update item.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteItem = async (item: ProfileGridItem) => {
    try {
      setError("");
      setMessage("");

      if (item.type === "blog") {
        await api.delete(`/blogs/${item._id}`);
        setMessage("Blog deleted successfully.");
      } else {
        await api.delete(`/user-posts/${item._id}`);
        setMessage("Post deleted successfully.");
      }

      setPosts((prev) =>
        prev.filter((p) => !(p._id === item._id && p.type === item.type))
      );

      handleCloseModal();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to delete item.");
    }
  };

  const handleHideItem = async (item: ProfileGridItem) => {
    try {
      setError("");
      setMessage("");

      if (item.type === "blog") {
        const res = await api.patch(`/blogs/${item._id}/visibility`);
        const updatedBlog = res.data?.blog;

        if (updatedBlog) {
          replaceItemInState({
            ...updatedBlog,
            type: "blog",
          });
        }

        setMessage(
          updatedBlog?.isPublished === false
            ? "Blog hidden from users."
            : "Blog visible to users again."
        );
      } else {
        const res = await api.patch(`/user-posts/${item._id}/visibility`);
        const updatedPost = res.data?.post;

        if (updatedPost) {
          replaceItemInState({
            ...updatedPost,
            type: "post",
          });
        }

        setMessage(
          updatedPost?.isPublished === false
            ? "Post hidden from users."
            : "Post visible to users again."
        );
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Failed to change visibility of item."
      );
    }
  };

  if (loading) {
    return <div className="profile-loading-shell">Loading profile...</div>;
  }

  if (!profile) {
    return <div className="profile-loading-shell">Profile not found.</div>;
  }

  return (
    <section className="profile-clean-page">
      <div className="profile-clean-shell">
        <div className="profile-clean-header">
          <div className="profile-clean-avatar">
            {profile.profileImage ? (
              <img
                src={getImageSrc(profile.profileImage)}
                alt={profile.name || profile.username || "Profile"}
              />
            ) : (
              <div className="profile-clean-avatar__fallback">
                {getInitials(profile.name, profile.username)}
              </div>
            )}
          </div>

          <div className="profile-clean-main">
            <div className="profile-clean-main__head">
              <div>
                <h2>{profile.name || profile.username}</h2>
                <p>@{profile.username}</p>
              </div>
            </div>

            <div className="profile-clean-stats">
              <span>
                <strong>{posts.length}</strong> posts
              </span>
              <span>
                <strong>{profile.followersCount || 0}</strong> followers
              </span>
              <span>
                <strong>{profile.followingCount || 0}</strong> following
              </span>
            </div>

            <div className="profile-clean-meta">
              {profile.bio && <p className="profile-clean-bio">{profile.bio}</p>}

              {!!interestTags.length && (
                <div className="profile-clean-tags">
                  {interestTags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
              )}

              {profile.location && (
                <div className="profile-clean-location">
                  <FiMapPin />
                  <span>{profile.location}</span>
                </div>
              )}

              {profile.work && (
                <div className="profile-clean-tags">
                  <span>{profile.work}</span>
                </div>
              )}
            </div>

            {(message || error) && (
              <div
                className={`profile-clean-alert ${error ? "error" : "success"}`}
              >
                {error || message}
              </div>
            )}
          </div>
        </div>

        <div className="profile-clean-tabs">
          <button
            type="button"
            className={activeTab === "posts" ? "active" : ""}
            onClick={() => setActiveTab("posts")}
          >
            <FiGrid />
            <span>Posts</span>
          </button>

          <button
            type="button"
            className={activeTab === "reviews" ? "active" : ""}
            onClick={() => setActiveTab("reviews")}
          >
            <FiStar />
            <span>Reviews</span>
          </button>

          <button
            type="button"
            className={activeTab === "history" ? "active" : ""}
            onClick={() => setActiveTab("history")}
          >
            <FiUser />
            <span>Travel History</span>
          </button>
        </div>

        <div className="profile-clean-content">
          {activeTab === "posts" && (
            <ProfilePostGrid
              posts={posts}
              onOpenItem={handleOpenItem}
              emptyText="No posts shared yet."
            />
          )}

          {activeTab === "reviews" && (
            <ProfileReviews reviews={reviews} emptyText="No reviews yet." />
          )}

          {activeTab === "history" && (
            <ProfileTravelHistory
              location={profile.location}
              interests={interestTags}
              work={profile.work}
            />
          )}
        </div>
      </div>

      <ProfileGridModal
        open={isModalOpen}
        item={selectedItem}
        onClose={handleCloseModal}
        onPrev={handlePrevItem}
        onNext={handleNextItem}
        isOwnProfile
        onEdit={handleOpenEdit}
        onHide={handleHideItem}
        onDelete={handleDeleteItem}
      />

      <ProfileEditItemModal
        open={isEditModalOpen}
        item={editingItem}
        onClose={handleCloseEdit}
        onSave={handleSaveEdit}
        saving={isSavingEdit}
      />
    </section>
  );
}