import mongoose from "mongoose";
import User from "../models/user.models.js";
import UserPost from "../models/userPost.models.js";
import UserBlog from "../models/userBlog.models.js";
import TravelPick from "../models/travelPick.models.js";
import Itinerary from "../models/itinerary.models.js";
import fs from "fs";
import Review from "../models/review.models.js";
import { createUserNotification } from "../utils/createUserNotification.js";
import ProblemReport from "../models/problemReport.models.js";
import bcrypt from "bcryptjs";

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const formatProfile = (
  user,
  postsCount = 0,
  isOwnProfile = false,
  currentUserId = null
) => {
  const followers = user.followers || [];
  const following = user.following || [];

  return {
    _id: user._id,
    username: user.username,
    email: isOwnProfile ? user.email : undefined,
    dob: isOwnProfile ? user.dob : undefined,
    role: user.role,
    profileImage: user.profileImage || "",
    name: user.name || "",
    bio: user.bio || "",
    travelInterest: user.travelInterest || "",
    location: user.location || "",
    work: user.work || "",
    postsCount,
    followersCount: followers.length,
    followingCount: following.length,
    isFollowing: currentUserId
      ? followers.some((id) => String(id) === String(currentUserId))
      : false,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

const formatUserListItem = (user) => {
  return {
    _id: user._id,
    username: user.username,
    name: user.name || "",
    profileImage: user.profileImage || "",
    bio: user.bio || "",
    location: user.location || "",
    work: user.work || "",
  };
};

const formatBlockedAccount = (user) => ({
  _id: user._id,
  username: user.username,
  name: user.name || "",
  profileImage: user.profileImage || "",
  bio: user.bio || "",
  location: user.location || "",
  work: user.work || "",
});

const formatSavedPostCard = (post) => ({
  _id: post._id,
  imageUrl: post.imageUrl || "",
  caption: post.caption || "",
  location: post.location || "",
  createdAt: post.createdAt,
  createdBy: post.createdBy
    ? {
        _id: post.createdBy._id,
        username: post.createdBy.username,
        name: post.createdBy.name || "",
        profileImage: post.createdBy.profileImage || "",
      }
    : null,
});

const formatSavedBlogCard = (blog) => ({
  _id: blog._id,
  title: blog.title || "",
  coverImage: blog.coverImage || "",
  excerpt: blog.excerpt || "",
  location: blog.location || "",
  createdAt: blog.createdAt,
  author: blog.author
    ? {
        _id: blog.author._id,
        username: blog.author.username,
        name: blog.author.name || "",
        profileImage: blog.author.profileImage || "",
      }
    : null,
});

const formatSavedTravelPickCard = (pick) => ({
  _id: pick._id,
  title: pick.title || "",
  place: pick.place || "",
  imageUrl: pick.imageUrl || "",
  startDate: pick.startDate,
  endDate: pick.endDate,
  price: pick.price || 0,
  createdAt: pick.createdAt,
});

const formatSavedItineraryCard = (itinerary) => ({
  _id: itinerary._id,
  generatedTitle: itinerary.generatedTitle || "",
  generatedSummary: itinerary.generatedSummary || "",
  estimatedCost: itinerary.estimatedCost || 0,
  mood: itinerary.mood || "",
  destination: itinerary.destination || "",
  days: itinerary.days || 0,
  status: itinerary.status || "generated",
  createdAt: itinerary.createdAt,
});

// GET MY PROFILE
export const getMyProfile = async (req, res) => {
  try {
    const postsCount = await UserPost.countDocuments({ createdBy: req.user._id });

    return res.status(200).json({
      user: formatProfile(req.user, postsCount, true, req.user._id),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// UPDATE MY PROFILE
export const updateMyProfile = async (req, res) => {
  try {
    const { username, name, bio, travelInterest, location, work } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (username && username.trim() !== user.username) {
      const existingUsername = await User.findOne({
        username: username.trim(),
        _id: { $ne: user._id },
      });

      if (existingUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }

      user.username = username.trim();
    }

    if (typeof name === "string") {
      user.name = name.trim();
    }

    if (typeof bio === "string") {
      user.bio = bio.trim();
    }

    if (typeof travelInterest === "string") {
      user.travelInterest = travelInterest.trim();
    }

    if (typeof location === "string") {
      user.location = location.trim();
    }

    if (typeof work === "string") {
      user.work = work.trim();
    }

    await user.save();

    const postsCount = await UserPost.countDocuments({ createdBy: user._id });

    return res.status(200).json({
      message: "Profile updated successfully",
      user: formatProfile(user, postsCount, true, user._id),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// GET OTHER USER PROFILE
export const getUserProfileById = async (req, res) => {
  try {
    const { id } = req.params;
    let currentUserId = null;

    if (req.user?._id) {
      currentUserId = req.user._id;
    }

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const user = await User.findById(id).select(
      "-password -refreshTokenHash -refreshTokenExpire -resetPasswordToken -resetPasswordExpire"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const postsCount = await UserPost.countDocuments({ createdBy: user._id });

    return res.status(200).json({
      user: formatProfile(user, postsCount, false, currentUserId),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// FOLLOW USER
export const followUser = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user._id;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    if (String(currentUserId) === String(id)) {
      return res.status(400).json({ message: "You cannot follow yourself" });
    }

    const userToFollow = await User.findById(id);
    const currentUser = await User.findById(currentUserId);

    if (!userToFollow) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!currentUser) {
      return res.status(404).json({ message: "Current user not found" });
    }

    const alreadyFollowing = currentUser.following.some(
      (userId) => String(userId) === String(id)
    );

    if (alreadyFollowing) {
      return res.status(400).json({ message: "You already follow this user" });
    }

    currentUser.following.push(userToFollow._id);
    userToFollow.followers.push(currentUser._id);

    await currentUser.save();
    await userToFollow.save();

    await createUserNotification({
      recipient: userToFollow._id,
      actor: currentUser._id,
      type: "follow",
      title: "New follower",
      message: `${currentUser.username} started following you`,
      entityType: "user",
      entityId: currentUser._id,
      previewImage: currentUser.profileImage || "",
    });

    const postsCount = await UserPost.countDocuments({
      createdBy: userToFollow._id,
    });

    return res.status(200).json({
      message: "User followed successfully",
      user: formatProfile(userToFollow, postsCount, false, currentUserId),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// UNFOLLOW USER
export const unfollowUser = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user._id;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    if (String(currentUserId) === String(id)) {
      return res.status(400).json({ message: "You cannot unfollow yourself" });
    }

    const userToUnfollow = await User.findById(id);
    const currentUser = await User.findById(currentUserId);

    if (!userToUnfollow) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!currentUser) {
      return res.status(404).json({ message: "Current user not found" });
    }

    const isFollowing = currentUser.following.some(
      (userId) => String(userId) === String(id)
    );

    if (!isFollowing) {
      return res.status(400).json({ message: "You do not follow this user" });
    }

    currentUser.following = currentUser.following.filter(
      (userId) => String(userId) !== String(id)
    );

    userToUnfollow.followers = userToUnfollow.followers.filter(
      (userId) => String(userId) !== String(currentUserId)
    );

    await currentUser.save();
    await userToUnfollow.save();

    const postsCount = await UserPost.countDocuments({
      createdBy: userToUnfollow._id,
    });

    return res.status(200).json({
      message: "User unfollowed successfully",
      user: formatProfile(userToUnfollow, postsCount, false, currentUserId),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// GET FOLLOWERS LIST
export const getFollowersList = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const user = await User.findById(id).populate(
      "followers",
      "username name profileImage bio location work"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      count: user.followers.length,
      followers: user.followers.map(formatUserListItem),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// GET FOLLOWING LIST
export const getFollowingList = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const user = await User.findById(id).populate(
      "following",
      "username name profileImage bio location work"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      count: user.following.length,
      following: user.following.map(formatUserListItem),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getBlockedAccounts = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate(
      "blockedUsers",
      "username name profileImage bio location work"
    );

    return res.status(200).json({
      count: user?.blockedUsers?.length || 0,
      blockedAccounts: (user?.blockedUsers || []).map(formatBlockedAccount),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const blockUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    if (String(req.user._id) === String(id)) {
      return res.status(400).json({ message: "You cannot block yourself" });
    }

    const currentUser = await User.findById(req.user._id);
    const userToBlock = await User.findById(id);

    if (!currentUser || !userToBlock) {
      return res.status(404).json({ message: "User not found" });
    }

    const alreadyBlocked = currentUser.blockedUsers.some(
      (userId) => String(userId) === String(id)
    );

    if (alreadyBlocked) {
      return res.status(400).json({ message: "User already blocked" });
    }

    currentUser.blockedUsers.push(userToBlock._id);

    currentUser.following = currentUser.following.filter(
      (userId) => String(userId) !== String(userToBlock._id)
    );

    currentUser.followers = currentUser.followers.filter(
      (userId) => String(userId) !== String(userToBlock._id)
    );

    userToBlock.following = userToBlock.following.filter(
      (userId) => String(userId) !== String(currentUser._id)
    );

    userToBlock.followers = userToBlock.followers.filter(
      (userId) => String(userId) !== String(currentUser._id)
    );

    await currentUser.save();
    await userToBlock.save();

    return res.status(200).json({
      message: "User blocked successfully",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const unblockUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const currentUser = await User.findById(req.user._id);

    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    currentUser.blockedUsers = currentUser.blockedUsers.filter(
      (userId) => String(userId) !== String(id)
    );

    await currentUser.save();

    return res.status(200).json({
      message: "User unblocked successfully",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getMySavedCollections = async (req, res) => {
  try {
    const [savedPosts, savedBlogs, savedTravelPicks, savedItineraries] =
      await Promise.all([
        UserPost.find({
          savedBy: req.user._id,
          isPublished: { $ne: false },
        })
          .populate("createdBy", "username name profileImage")
          .sort({ createdAt: -1 }),

        UserBlog.find({
          savedBy: req.user._id,
          isPublished: { $ne: false },
        })
          .populate("author", "username name profileImage")
          .sort({ createdAt: -1 }),

        TravelPick.find({
          savedBy: req.user._id,
          isPublished: true,
        })
          .populate("createdBy", "username")
          .sort({ createdAt: -1 }),

        Itinerary.find({
          user: req.user._id,
          status: { $in: ["generated", "sent_to_admin", "approved", "rejected"] },
        }).sort({ createdAt: -1 }),
      ]);

    return res.status(200).json({
      collections: {
        posts: {
          title: "Posts",
          count: savedPosts.length,
          items: savedPosts.map(formatSavedPostCard),
        },
        blogs: {
          title: "Blogs",
          count: savedBlogs.length,
          items: savedBlogs.map(formatSavedBlogCard),
        },
        travelPicks: {
          title: "Travel Picks",
          count: savedTravelPicks.length,
          items: savedTravelPicks.map(formatSavedTravelPickCard),
        },
        itineraries: {
          title: "AI Itineraries",
          count: savedItineraries.length,
          items: savedItineraries.map(formatSavedItineraryCard),
        },
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// UPLOAD MY PROFILE IMAGE
export const uploadMyProfileImage = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Profile image is required" });
    }

    if (user.profileImage) {
      const oldImagePath = user.profileImage.replace(/^\/+/, "");

      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }

    user.profileImage = `/uploads/profiles/${req.file.filename}`;
    await user.save();

    const postsCount = await UserPost.countDocuments({ createdBy: user._id });

    return res.status(200).json({
      message: "Profile image uploaded successfully",
      user: formatProfile(user, postsCount, true, user._id),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const formatReview = (review) => {
  return {
    _id: review._id,
    rating: review.rating,
    text: review.text,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
    reviewer: review.reviewer
      ? {
          _id: review.reviewer._id,
          username: review.reviewer.username,
          name: review.reviewer.name || "",
          profileImage: review.reviewer.profileImage || "",
        }
      : null,
    reviewedUser: review.reviewedUser
      ? {
          _id: review.reviewedUser._id,
          username: review.reviewedUser.username,
          name: review.reviewedUser.name || "",
          profileImage: review.reviewedUser.profileImage || "",
        }
      : null,
  };
};

// ADD REVIEW TO USER
export const addReviewToUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, text } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    if (String(req.user._id) === String(id)) {
      return res.status(400).json({ message: "You cannot review yourself" });
    }

    if (!rating || Number(rating) < 1 || Number(rating) > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Review text is required" });
    }

    const reviewedUser = await User.findById(id);

    if (!reviewedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const existingReview = await Review.findOne({
      reviewer: req.user._id,
      reviewedUser: id,
    });

    if (existingReview) {
      return res
        .status(400)
        .json({ message: "You have already reviewed this user" });
    }

    const review = await Review.create({
      reviewer: req.user._id,
      reviewedUser: id,
      rating: Number(rating),
      text: text.trim(),
    });

    const populatedReview = await Review.findById(review._id)
      .populate("reviewer", "username name profileImage")
      .populate("reviewedUser", "username name profileImage");

    return res.status(201).json({
      message: "Review added successfully",
      review: formatReview(populatedReview),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ message: "You have already reviewed this user" });
    }

    return res.status(500).json({ message: error.message });
  }
};

// GET REVIEWS OF A USER
export const getReviewsOfUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const reviews = await Review.find({ reviewedUser: id })
      .populate("reviewer", "username name profileImage")
      .populate("reviewedUser", "username name profileImage")
      .sort({ createdAt: -1 });

    const averageRating =
      reviews.length > 0
        ? Number(
            (
              reviews.reduce((sum, review) => sum + review.rating, 0) /
              reviews.length
            ).toFixed(1)
          )
        : 0;

    return res.status(200).json({
      count: reviews.length,
      averageRating,
      reviews: reviews.map(formatReview),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// DELETE MY REVIEW
export const deleteMyReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    if (!isValidObjectId(reviewId)) {
      return res.status(400).json({ message: "Invalid review id" });
    }

    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    if (String(review.reviewer) !== String(req.user._id)) {
      return res
        .status(403)
        .json({ message: "You can only delete your own review" });
    }

    await review.deleteOne();

    return res.status(200).json({
      message: "Review deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// REPORT A PROBLEM
export const createProblemReport = async (req, res) => {
  try {
    const { subject, message } = req.body;

    if (!subject?.trim() || !message?.trim()) {
      return res.status(400).json({
        message: "Subject and message are required",
      });
    }

    const report = await ProblemReport.create({
      reportedBy: req.user._id,
      subject: subject.trim(),
      message: message.trim(),
    });

    return res.status(201).json({
      message: "Problem report submitted successfully",
      report,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const deactivateMyAccount = async (req, res) => {
  try {
    const { password, confirmText } = req.body;

    if (!password || !confirmText) {
      return res.status(400).json({
        message: "Password and confirmation are required",
      });
    }

    if (String(confirmText).trim().toLowerCase() !== "deactivate") {
      return res.status(400).json({
        message: 'Please type "DEACTIVATE" to confirm',
      });
    }

    const user = await User.findById(req.user._id).select("+password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.googleId && !user.password) {
      return res.status(400).json({
        message: "This account does not support password-based deactivation here",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect password" });
    }

    user.isActive = false;
    user.refreshTokenHash = undefined;
    user.refreshTokenExpire = undefined;

    await user.save();

    res.clearCookie("token", {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
    });

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
    });

    return res.status(200).json({
      message: "Account deactivated successfully",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};