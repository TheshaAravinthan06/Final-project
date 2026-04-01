"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import api from "@/lib/axios";
import {
  FiEdit2,
  FiGrid,
  FiMapPin,
  FiSettings,
  FiShare2,
  FiStar,
  FiUser,
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

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileUser | null>(null);
  const [posts, setPosts] = useState<ProfileGridItem[]>([]);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [activeTab, setActiveTab] = useState<"posts" | "reviews" | "history">(
    "posts"
  );
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const loadProfileData = async () => {
      try {
        setLoading(true);

        const profileRes = await api.get("/users/me");
        const currentProfile = profileRes.data?.user;
        setProfile(currentProfile);

        if (currentProfile?._id) {
          const [postsRes, blogsRes, reviewsRes] = await Promise.allSettled([
            api.get(`/user-posts/user/${currentProfile._id}`),
            api.get(`/blogs/user/${currentProfile._id}`),
            api.get(`/users/${currentProfile._id}/reviews`),
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
        }
      } catch (error) {
        console.error("Failed to load profile", error);
      } finally {
        setLoading(false);
      }
    };

    loadProfileData();
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

  if (loading) {
    return <div className="profile-loading-shell">Loading profile...</div>;
  }

  if (!profile) {
    return <div className="profile-loading-shell">Profile not found.</div>;
  }

  return (
    <section className="profile-clean-page">
      <div className="profile-clean-shell">
        <div className="profile-clean-topbar">
          <h1>My Profile</h1>

          <Link
            href="/settings"
            className="profile-clean-icon-btn"
            aria-label="Open settings"
          >
            <FiSettings />
          </Link>
        </div>

        <div className="profile-clean-header">
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
                <h1>{profile.username}</h1>
                <p className="profile-handle">
                  @{profile.name || profile.username}
                </p>
              </div>

              <div className="profile-clean-actions">
                <Link
                  href="/settings?tab=edit-profile"
                  className="profile-clean-primary-btn"
                >
                  <FiEdit2 />
                  Edit Profile
                </Link>

                <button type="button" className="profile-clean-secondary-btn">
                  <FiShare2 />
                  Share
                </button>
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
              emptyText="You have not posted any travel memories yet."
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
              isOwnProfile
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