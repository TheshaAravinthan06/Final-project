import User from "../models/user.models.js";
import bcrypt from "bcryptjs";
import generateToken from "../utils/generateToken.js";
import crypto from "crypto";
import sendEmail from "../utils/sendEmail.js";

const sha256 = (value) =>
  crypto.createHash("sha256").update(value).digest("hex");

const accessCookieOptions = {
  httpOnly: true,
  secure: false, // change to true in production
  sameSite: "strict",
  maxAge: 24 * 60 * 60 * 1000, // 1 day
};

const refreshCookieOptions = {
  httpOnly: true,
  secure: false, // change to true in production
  sameSite: "strict",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// REGISTER
export const register = async (req, res) => {
  try {
    const { username, email, password, confirmPassword, dob } = req.body;

    if (!username || !email || !password || !confirmPassword || !dob) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters",
      });
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(400).json({
        message: "Email or username already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      dob,
      role: "user",
    });

    const token = generateToken(user);

    return res.status(201).json({
      message: "User registered successfully",
      token,
      role: user.role,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        dob: user.dob,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// LOGIN
export const login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase().trim() },
        { username: identifier.trim() },
      ],
    });

    if (!user || !user.isActive) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (user.googleId && !user.password) {
      return res.status(400).json({ message: "Use Google login" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    user.lastLogin = new Date();

    // generate access token
    const token = generateToken(user);

    // generate refresh token
    const refreshToken = crypto.randomBytes(40).toString("hex");

    // save hashed refresh token in DB
    user.refreshTokenHash = sha256(refreshToken);
    user.refreshTokenExpire = Date.now() + 7 * 24 * 60 * 60 * 1000;

    await user.save();

    // set cookies
    res.cookie("token", token, accessCookieOptions);
    res.cookie("refreshToken", refreshToken, refreshCookieOptions);

    return res.status(200).json({
      message: "Login successful",
      token,
      refreshToken,
      role: user.role,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        dob: user.dob,
        role: user.role,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// REFRESH TOKEN
export const refreshToken = async (req, res) => {
  try {
    const tokenFromCookie = req.cookies?.refreshToken;

    if (!tokenFromCookie) {
      return res.status(401).json({ message: "Refresh token missing" });
    }

    const hashedToken = sha256(tokenFromCookie);

    const user = await User.findOne({
      refreshTokenHash: hashedToken,
      refreshTokenExpire: { $gt: Date.now() },
      isActive: true,
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid or expired refresh token",
      });
    }

    const newAccessToken = generateToken(user);

    res.cookie("token", newAccessToken, accessCookieOptions);

    return res.status(200).json({
      message: "Access token refreshed",
      token: newAccessToken,
      role: user.role,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// LOGOUT
export const logoutUser = async (req, res) => {
  try {
    const refreshTokenFromCookie = req.cookies?.refreshToken;

    if (refreshTokenFromCookie) {
      const hashedToken = sha256(refreshTokenFromCookie);

      await User.findOneAndUpdate(
        { refreshTokenHash: hashedToken },
        {
          $unset: {
            refreshTokenHash: 1,
            refreshTokenExpire: 1,
          },
        }
      );
    }

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
      message: "Logged out successfully",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// FORGOT PASSWORD
export const forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({
      email: req.body.email?.toLowerCase()?.trim(),
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const resetToken = crypto.randomBytes(20).toString("hex");

    user.resetPasswordToken = sha256(resetToken);
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    const message = `
You requested a password reset.

Click this link:
${resetUrl}

This link expires in 10 minutes.
`;

    await sendEmail({
      email: user.email,
      subject: "Password Reset Request",
      message,
    });

    return res.status(200).json({
      message: "Reset link sent to email",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// RESET PASSWORD
export const resetPassword = async (req, res) => {
  try {
    const resetPasswordToken = sha256(req.params.token);

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    if (req.body.password !== req.body.confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    user.password = await bcrypt.hash(req.body.password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    return res.status(200).json({
      message: "Password reset successful",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};