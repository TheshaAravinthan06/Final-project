"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/lib/axios";
import { FiGrid, FiMapPin, FiStar, FiUser } from "react-icons/fi";
import ProfilePostGrid from "@/components/profile/ProfilePostGrid";
import ProfileReviews from "@/components/profile/ProfileReviews";
import ProfileTravelHistory from "@/components/profile/ProfileTravelHistory";
import ProfileGridModal from "@/components/profile/ProfileGridModal";
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

  useEffect(() => {
    const loadMyProfile = async () => {
      try {
        setLoading(true);
        setError("");
        setMessage("");

        const profileRes = await api.get("/users/me");
        const myUser = profileRes.data?.user || null;
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
            ? (postsRes.value.data?.posts || []).map(
                (post: UserProfilePost) => ({
                  ...post,
                  type: "post" as const,
                })
              )
            : [];

        const userBlogs: ProfileGridItem[] =
          blogsRes.status === "fulfilled"
            ? (blogsRes.value.data?.blogs || []).map(
                (blog: UserProfileBlog) => ({
                  ...blog,
                  type: "blog" as const,
                })
              )
            : [];

        const mergedItems = [...userPosts, ...userBlogs].sort((a, b) => {
          const aDate = new Date(a.createdAt || 0).getTime();
          const bDate = new Date(b.createdAt || 0).getTime();
          return bDate - aDate;
        });

        setPosts(mergedItems);

        if (reviewsRes.status === "fulfilled") {
          setReviews(reviewsRes.value.data?.reviews || []);
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

  const handleDeleteItem = async (item: ProfileGridItem) => {
    try {
      setError("");
      setMessage("");

      if (item.type === "blog") {
        await api.delete(`/blogs/${item._id}`);
        setPosts((prev) =>
          prev.filter((p) => !(p._id === item._id && p.type === item.type))
        );
        setMessage("Blog deleted successfully.");
      } else {
        setError("Post delete endpoint is not available yet in backend.");
      }

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
        await api.patch(`/blogs/${item._id}/hide`);
        setMessage("Blog hidden successfully.");
      } else {
        setError("Post hide endpoint is not available yet in backend.");
      }

      handleCloseModal();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to hide item.");
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
        item={selectedIndex !== null ? posts[selectedIndex] : null}
        onClose={handleCloseModal}
        onPrev={handlePrevItem}
        onNext={handleNextItem}
        isOwnProfile
        onHide={handleHideItem}
        onDelete={handleDeleteItem}
      />
    </section>
  );
}