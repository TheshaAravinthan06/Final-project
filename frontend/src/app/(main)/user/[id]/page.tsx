"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
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

export default function UserProfilePage() {
  const params = useParams();
  const userId = params?.id as string;

  const [user, setUser] = useState<ProfileUser | null>(null);
  const [posts, setPosts] = useState<ProfileGridItem[]>([]);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [activeTab, setActiveTab] = useState<"posts" | "reviews" | "history">(
    "posts"
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        setLoading(true);
        setError("");
        setMessage("");

        const userRes = await api.get(`/users/${userId}`);
        const userData = userRes.data?.user || null;
        setUser(userData);

        const [postsRes, blogsRes, reviewsRes] = await Promise.allSettled([
          api.get(`/user-posts/user/${userId}`),
          api.get(`/blogs/user/${userId}`),
          api.get(`/users/${userId}/reviews`),
        ]);

        const userPosts: ProfileGridItem[] =
          postsRes.status === "fulfilled"
            ? (postsRes.value.data?.posts || []).map(
                (post: UserProfilePost) => ({
                  ...post,
                  _id: post._id,
                  createdAt: post.createdAt,
                  type: "post" as const,
                })
              )
            : [];

        const userBlogs: ProfileGridItem[] =
          blogsRes.status === "fulfilled"
            ? (blogsRes.value.data?.blogs || []).map(
                (blog: UserProfileBlog) => ({
                  ...blog,
                  _id: blog._id,
                  createdAt: blog.createdAt,
                  type: "blog" as const,
                })
              )
            : [];

        const mergedItems = [...userPosts, ...userBlogs]
          .filter((item) => item._id)
          .sort((a, b) => {
            const aDate = new Date(a.createdAt || 0).getTime();
            const bDate = new Date(b.createdAt || 0).getTime();
            return bDate - aDate;
          });

        setPosts(mergedItems);

        if (reviewsRes.status === "fulfilled") {
          setReviews(reviewsRes.value.data?.reviews || []);
        }
      } catch (err: any) {
        setError(err?.response?.data?.message || "Failed to load user.");
      } finally {
        setLoading(false);
      }
    };

    if (userId) loadUserProfile();
  }, [userId]);

  const interestTags = useMemo(
    () => formatJoinedInterests(user?.travelInterest),
    [user?.travelInterest]
  );

  const handleFollowToggle = async () => {
    if (!user?._id || followLoading) return;

    try {
      setFollowLoading(true);
      setError("");
      setMessage("");

      const isFollowing = !!user.isFollowing;

      if (isFollowing) {
        await api.delete(`/users/${user._id}/follow`);
      } else {
        await api.post(`/users/${user._id}/follow`);
      }

      setUser((prev) =>
        prev
          ? {
              ...prev,
              isFollowing: !isFollowing,
              followersCount: isFollowing
                ? Math.max((prev.followersCount || 1) - 1, 0)
                : (prev.followersCount || 0) + 1,
            }
          : prev
      );
    } catch (err: any) {
      setError(err?.response?.data?.message || "Follow failed.");
    } finally {
      setFollowLoading(false);
    }
  };

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

  if (loading) {
    return <div className="profile-loading-shell">Loading...</div>;
  }

  if (!user) {
    return <div className="profile-loading-shell">User not found</div>;
  }

  return (
    <section className="profile-clean-page">
      <div className="profile-clean-shell">
        <div className="profile-clean-header">
          <div className="profile-clean-avatar">
            {user.profileImage ? (
              <img src={getImageSrc(user.profileImage)} alt={user.username} />
            ) : (
              <div className="profile-clean-avatar__fallback">
                {getInitials(user.name, user.username)}
              </div>
            )}
          </div>

          <div className="profile-clean-main">
            <div className="profile-clean-main__head">
              <div>
                <h2>{user.name || user.username}</h2>
                <p>@{user.username}</p>
              </div>

              <button
                className="follow-btn"
                onClick={handleFollowToggle}
                disabled={followLoading}
              >
                {followLoading
                  ? "Please wait..."
                  : user.isFollowing
                  ? "Following"
                  : "Follow"}
              </button>
            </div>

            <div className="profile-clean-stats">
              <span>
                <strong>{posts.length}</strong> posts
              </span>
              <span>
                <strong>{user.followersCount || 0}</strong> followers
              </span>
              <span>
                <strong>{user.followingCount || 0}</strong> following
              </span>
            </div>

            <div className="profile-clean-meta">
              {user.bio && <p>{user.bio}</p>}

              {!!interestTags.length && (
                <div className="profile-clean-tags">
                  {interestTags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
              )}

              {user.location && (
                <div className="profile-clean-location">
                  <FiMapPin />
                  <span>{user.location}</span>
                </div>
              )}
            </div>

            {(error || message) && (
              <div className={`profile-clean-alert ${error ? "error" : ""}`}>
                {error || message}
              </div>
            )}
          </div>
        </div>

        <div className="profile-clean-tabs">
          <button
            className={activeTab === "posts" ? "active" : ""}
            onClick={() => setActiveTab("posts")}
          >
            <FiGrid /> Posts
          </button>

          <button
            className={activeTab === "reviews" ? "active" : ""}
            onClick={() => setActiveTab("reviews")}
          >
            <FiStar /> Reviews
          </button>

          <button
            className={activeTab === "history" ? "active" : ""}
            onClick={() => setActiveTab("history")}
          >
            <FiUser /> Travel History
          </button>
        </div>

        <div className="profile-clean-content">
          {activeTab === "posts" && (
            <ProfilePostGrid
              posts={posts}
              emptyText="No posts or blogs yet."
              onOpenItem={handleOpenItem}
            />
          )}

          {activeTab === "reviews" && (
            <ProfileReviews
              reviews={reviews}
              emptyText="No reviews yet."
            />
          )}

          {activeTab === "history" && (
            <ProfileTravelHistory
              location={user.location}
              interests={interestTags}
              work={user.work}
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
        isOwnProfile={false}
      />
    </section>
  );
}