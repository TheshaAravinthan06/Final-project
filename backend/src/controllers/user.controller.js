import mongoose from "mongoose";
import User from "../models/user.models.js";
import UserPost from "../models/userPost.models.js";

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const formatProfile = (user, postsCount = 0, isOwnProfile = false) => {
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
    followersCount: user.followers?.length || 0,
    followingCount: user.following?.length || 0,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

// GET MY PROFILE
export const getMyProfile = async (req, res) => {
  try {
    const postsCount = await UserPost.countDocuments({ createdBy: req.user._id });

    return res.status(200).json({
      user: formatProfile(req.user, postsCount, true),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// UPDATE MY PROFILE
export const updateMyProfile = async (req, res) => {
  try {
    const {
      username,
      name,
      bio,
      travelInterest,
      location,
      work,
    } = req.body;

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
      user: formatProfile(user, postsCount, true),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// GET OTHER USER PROFILE
export const getUserProfileById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const user = await User.findById(id).select("-password -refreshTokenHash -refreshTokenExpire -resetPasswordToken -resetPasswordExpire");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const postsCount = await UserPost.countDocuments({ createdBy: user._id });

    return res.status(200).json({
      user: formatProfile(user, postsCount, false),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};