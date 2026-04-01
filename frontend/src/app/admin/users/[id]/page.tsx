// admin seeing user details and editing them

"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/lib/axios";
import { useParams, useRouter } from "next/navigation";
import {
  FiArrowLeft,
  FiGrid,
  FiMapPin,
  FiShield,
  FiStar,
  FiUser,
} from "react-icons/fi";
import ProfilePostGrid from "@/components/profile/ProfilePostGrid";
import ProfileReviews from "@/components/profile/ProfileReviews";
import ProfileTravelHistory from "@/components/profile/ProfileTravelHistory";
import {
  formatJoinedInterests,
  getImageSrc,
  getInitials,
} from "@/components/profile/profileUtils";
import {
  ProfileUser,
  ReviewItem,
  UserProfilePost,
} from "@/components/profile/types";

type AdminProfileUser = ProfileUser & {
  isActive?: boolean;
  role?: string;
};

export default function AdminUserProfilePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const userId = params?.id;

  const [profile, setProfile] = useState<AdminProfileUser | null>(null);
  const [posts, setPosts] = useState<UserProfilePost[]>([]);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [activeTab, setActiveTab] = useState<"posts" | "reviews" | "history">(
    "posts"
  );
  const [loading, setLoading] = useState(true);
  const [blockLoading, setBlockLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const loadUserProfile = async () => {
      if (!userId) return;

      try {
        setLoading(true);
        setError("");
        setMessage("");

        const [profileRes, postsRes, reviewsRes] = await Promise.allSettled([
          api.get(`/admin/users/${userId}`),
          api.get(`/user-posts/user/${userId}`),
          api.get(`/users/${userId}/reviews`),
        ]);

        if (profileRes.status === "fulfilled") {
          setProfile(profileRes.value.data?.user || null);
        } else {
          setError("Failed to load user profile.");
        }

        if (postsRes.status === "fulfilled") {
          setPosts(postsRes.value.data?.posts || []);
        }

        if (reviewsRes.status === "fulfilled") {
          setReviews(reviewsRes.value.data?.reviews || []);
        }
      } catch {
        setError("Failed to load user profile.");
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

  const handleBlockUser = async () => {
    if (!profile?._id || !profile.isActive) return;

    try {
      setBlockLoading(true);
      setError("");
      setMessage("");

      await api.patch(`/admin/users/${profile._id}/block`);
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              isActive: false,
            }
          : prev
      );
      setMessage("User blocked successfully.");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to block user.");
    } finally {
      setBlockLoading(false);
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
        <div className="admin-page-head">
          <div>
            <h1>User Profile</h1>
            <p>View this user from the admin dashboard without leaving admin side.</p>
          </div>

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <button
              type="button"
              className="profile-clean-secondary-btn"
              onClick={() => router.back()}
            >
              <FiArrowLeft />
              Back
            </button>

            <button
              type="button"
              className="profile-clean-secondary-btn"
              onClick={() => router.push("/admin")}
            >
              Dashboard
            </button>
          </div>
        </div>

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
                    disabled={!profile.isActive || blockLoading}
                    onClick={handleBlockUser}
                  >
                    <FiShield />
                    {blockLoading
                      ? "Please wait..."
                      : profile.isActive === false
                      ? "Blocked"
                      : "Block User"}
                  </button>
                </div>
              </div>
            </div>

            <div className="profile-clean-stats">
              <span>
                <strong>{profile.postsCount || posts.length}</strong> posts
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

              <div className="profile-clean-tags">
                <span>{profile.role || "user"}</span>
                <span>{profile.isActive === false ? "Inactive" : "Active"}</span>
              </div>
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
            <ProfilePostGrid posts={posts} emptyText="No posts shared yet." />
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
    </section>
  );
}