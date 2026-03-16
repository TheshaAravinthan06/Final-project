import mongoose from "mongoose";
import User from "../models/user.models.js";

// GET /admin/users
export const adminGetAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-password -resetPasswordToken -resetPasswordExpire -refreshTokenHash -refreshTokenExpire")
      .sort({ createdAt: -1 });

    return res.status(200).json({ count: users.length, users });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// GET /admin/users/:id
export const adminGetUserById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ message: "Invalid user id" });

    const user = await User.findById(id).select(
      "-password -resetPasswordToken -resetPasswordExpire -refreshTokenHash -refreshTokenExpire"
    );

    if (!user) return res.status(404).json({ message: "User not found" });

    return res.status(200).json({ user });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// PATCH /admin/users/:id/role  body: { "role": "admin" } or { "role": "user" }
export const adminUpdateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ message: "Invalid user id" });

    if (!role || !["admin", "user"].includes(role)) {
      return res.status(400).json({ message: "Role must be admin or user" });
    }

    // prevent self-demote
    if (req.user?._id?.toString() === id) {
      return res.status(400).json({ message: "You cannot change your own role" });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.role = role;
    await user.save();

    return res.status(200).json({
      message: "Role updated successfully",
      user: { id: user._id, username: user.username, email: user.email, role: user.role },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};