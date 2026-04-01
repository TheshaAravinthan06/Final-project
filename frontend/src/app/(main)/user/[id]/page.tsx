"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/lib/axios";
import { useParams } from "next/navigation";
import {
  FiAlertTriangle,
  FiCopy,
  FiGrid,
  FiMapPin,
  FiMessageCircle,
  FiMoreHorizontal,
  FiShield,
  FiStar,
  FiUser,
  FiUserPlus,
  FiX,
} from "react-icons/fi";
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

export default function OtherUserProfilePage() {
  const params = useParams<{ id: string }>();
  const userId = params?.id;

  const [profile, setProfile] = useState<ProfileUser | null>(null);
  const [posts, setPosts] = useState<ProfileGridItem[]>([]);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [activeTab, setActiveTab] = useState<"posts" | "reviews" | "history">(
    "posts"
  );
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const loadUserProfile = async () => {
      if (!userId) return;

      try {
        setLoading(true);
        setError("");

        const [profileRes, postsRes, blogsRes, reviewsRes] =
          await Promise.allSettled([
            api.get(`/users/${userId}`),
            api.get(`/user-posts/user/${userId}`),
            api.get(`/blogs/user/${userId}`),
            api.get(`/users/${userId}/reviews`),
          ]);

        if (profileRes.status === "fulfilled") {
          setProfile(profileRes.value.data?.user || null);
        } else {
          setError("Failed to load user profile.");
        }

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
      } finally {
        setLoading(false);
      }
    };

    loadUserProfile();
  }, [userId]);

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

  const handleFollowToggle = async () => {
    if (!profile?._id) return;

    try {
      setFollowLoading(true);
      setMessage("");
      setError("");

      const endpoint = profile.isFollowing
        ? `/users/${profile._id}/unfollow`
        : `/users/${profile._id}/follow`;

      const res = await api.post(endpoint);
      setProfile(res.data?.user || null);
      setMessage(
        profile.isFollowing ? "Unfollowed user." : "Started following user."
      );
    } catch (err: any) {
      setError(err?.response?.data?.message || "Action failed.");
    } finally {
      setFollowLoading(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setMessage("Profile link copied.");
      setMenuOpen(false);
    } catch {
      setError("Could not copy profile link.");
    }
  };

  if (loading) {
    return <div className="profile-loading-shell">Loading profile...</div>;
  }

  if (!profile) {
    return <div className="profile-loading-shell">User not found.</div>;
  }

  return (
    <section className="profile-clean-page">
      <div className="profile-clean-shell">
        <div className="profile-clean-header profile-clean-header--other">
          <div className="profile-clean-avatar">
            {profile.profileImage ? (
              <img
                src={getImageSrc(profile.profileImage)}
                alt={profile.name || profile.username}
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

              <div className="profile-clean-header-right">
                <div className="profile-clean-actions">
                  <button
                    type="button"
                    className="profile-clean-primary-btn"
                    onClick={handleFollowToggle}
                    disabled={followLoading}
                  >
                    <FiUserPlus />
                    {followLoading
                      ? "Please wait..."
                      : profile.isFollowing
                      ? "Following"
                      : "Follow"}
                  </button>

                  <button
                    type="button"
                    className="profile-clean-secondary-btn"
                  >
                    <FiMessageCircle />
                    Message
                  </button>

                  <button
                    type="button"
                    className="profile-clean-secondary-btn"
                  >
                    <FiStar />
                    Review
                  </button>
                </div>

                <div className="profile-clean-more">
                  <button
                    type="button"
                    className="profile-clean-icon-btn"
                    onClick={() => setMenuOpen((prev) => !prev)}
                  >
                    <FiMoreHorizontal />
                  </button>

                  {menuOpen && (
                    <div className="profile-clean-more-menu">
                      <button type="button" className="danger">
                        <FiShield />
                        Block
                      </button>
                      <button type="button">
                        <FiAlertTriangle />
                        Report
                      </button>
                      <button type="button" onClick={handleCopyLink}>
                        <FiCopy />
                        Copy Profile Link
                      </button>
                      <button type="button" onClick={() => setMenuOpen(false)}>
                        <FiX />
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
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

            {(profile.bio || profile.location || interestTags.length > 0) && (
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
              </div>
            )}

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
              emptyText="No posts shared yet."
              onOpenItem={handleOpenItem}
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
  onEdit={(item) => console.log("edit", item)}
  onHide={(item) => console.log("hide", item)}
  onDelete={(item) => console.log("delete", item)}
/>
    </section>
  );
}