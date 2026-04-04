import User from "../models/user.models.js";
import bcrypt from "bcryptjs";
import generateToken from "../utils/generateToken.js";
import crypto from "crypto";
import sendEmail from "../utils/sendEmail.js";

const sha256 = (value) =>
  crypto.createHash("sha256").update(value).digest("hex");

const accessCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 24 * 60 * 60 * 1000,
};

const refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
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

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedUsername = username.trim();

    const existingUser = await User.findOne({
      $or: [{ email: normalizedEmail }, { username: normalizedUsername }],
    });

    if (existingUser) {
      return res.status(400).json({
        message: "Email or username already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username: normalizedUsername,
      email: normalizedEmail,
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
    console.error("REGISTER ERROR:", error);
    return res.status(500).json({
      message: error.message || "Server error during registration",
    });
  }
};

const frontendBase = () =>
  (process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/$/, "");

// Google OAuth: set same cookies as email login, then send user to the app
export const googleAuthCallback = async (req, res) => {
  try {
    const payload = req.user;
    if (!payload?.user || !payload?.token) {
      return res.redirect(`${frontendBase()}/?error=google_auth`);
    }

    const { user, token } = payload;
    const refreshToken = crypto.randomBytes(40).toString("hex");

    user.refreshTokenHash = sha256(refreshToken);
    user.refreshTokenExpire = Date.now() + 7 * 24 * 60 * 60 * 1000;
    user.lastLogin = new Date();
    await user.save();

    res.cookie("token", token, accessCookieOptions);
    res.cookie("refreshToken", refreshToken, refreshCookieOptions);

    return res.redirect(`${frontendBase()}/`);
  } catch (error) {
    console.error("GOOGLE CALLBACK ERROR:", error);
    return res.redirect(`${frontendBase()}/?error=google_auth`);
  }
};

// LOGIN
export const login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const trimmedIdentifier = identifier.trim();

    const user = await User.findOne({
      $or: [
        { email: trimmedIdentifier.toLowerCase() },
        { username: trimmedIdentifier },
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

    const token = generateToken(user);
    const refreshToken = crypto.randomBytes(40).toString("hex");

    user.refreshTokenHash = sha256(refreshToken);
    user.refreshTokenExpire = Date.now() + 7 * 24 * 60 * 60 * 1000;

    await user.save();

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
    console.error("LOGIN ERROR:", error);
    return res.status(500).json({
      message: error.message || "Server error during login",
    });
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
    console.error("REFRESH TOKEN ERROR:", error);
    return res.status(500).json({
      message: error.message || "Server error during refresh",
    });
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
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    return res.status(200).json({
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("LOGOUT ERROR:", error);
    return res.status(500).json({
      message: error.message || "Server error during logout",
    });
  }
};

// CHANGE PASSWORD
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findById(req.user._id);

    if (!user || !user.isActive) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.googleId && !user.password) {
      return res.status(400).json({
        message: "Password change is not available for Google-only accounts",
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        message: "New password must be at least 8 characters",
      });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ message: "New passwords do not match" });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        message: "New password must be different from current password",
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);

    user.refreshTokenHash = undefined;
    user.refreshTokenExpire = undefined;

    await user.save();

    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    return res.status(200).json({
      message: "Password changed successfully. Please log in again.",
    });
  } catch (error) {
    console.error("CHANGE PASSWORD ERROR:", error);
    return res.status(500).json({
      message: error.message || "Server error during password change",
    });
  }
};

// FORGOT PASSWORD
export const forgotPassword = async (req, res) => {
  try {
    const email = req.body.email?.toLowerCase()?.trim();

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const resetToken = crypto.randomBytes(20).toString("hex");

    user.resetPasswordToken = sha256(resetToken);
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

    await user.save();

    const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/$/, "");
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    const userName = user.name || user.username || "there";

    const message = `
Hello ${userName},

You requested to reset your PackPalz password.

Use this link to continue:
${resetUrl}

This link will expire in 10 minutes.

If you did not request this, you can safely ignore this email.

- PackPalz
`;

    const html = `
      <div style="margin:0;padding:0;background:#f5f7f6;font-family:Arial,sans-serif;">
        <div style="max-width:620px;margin:0 auto;padding:32px 18px;">
          <div style="background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 18px 45px rgba(15,23,42,0.08);border:1px solid #e7ece9;">
            <div style="padding:28px 32px;background:linear-gradient(135deg,#123524 0%,#1f5a3d 100%);color:#ffffff;">
              <div style="font-size:28px;font-weight:800;letter-spacing:0.3px;">PackPalz</div>
              <div style="margin-top:8px;font-size:14px;opacity:0.92;">Reset your password securely</div>
            </div>

            <div style="padding:32px;">
              <p style="margin:0 0 14px;font-size:16px;color:#1f2937;">Hi ${userName},</p>

              <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#475467;">
                We received a request to reset your PackPalz account password.
                Click the button below to create a new password.
              </p>

              <div style="margin:28px 0;text-align:center;">
                <a
                  href="${resetUrl}"
                  style="display:inline-block;background:#123524;color:#ffffff;text-decoration:none;padding:14px 26px;border-radius:999px;font-size:15px;font-weight:700;"
                >
                  Reset Password
                </a>
              </div>

              <p style="margin:0 0 12px;font-size:14px;line-height:1.7;color:#667085;">
                This link will expire in <strong>10 minutes</strong>.
              </p>

              <p style="margin:0 0 18px;font-size:14px;line-height:1.7;color:#667085;">
                If the button does not work, copy and paste this link into your browser:
              </p>

              <p style="margin:0 0 22px;word-break:break-word;font-size:13px;line-height:1.7;color:#14532d;background:#f6fbf8;border:1px solid #dbe8df;padding:12px 14px;border-radius:14px;">
                ${resetUrl}
              </p>

              <p style="margin:0;font-size:14px;line-height:1.7;color:#667085;">
                If you didn’t request this, you can safely ignore this email.
              </p>
            </div>

            <div style="padding:18px 32px;background:#f8faf9;border-top:1px solid #e7ece9;font-size:12px;color:#6b7280;line-height:1.6;">
              Sent by PackPalz • Travel together, travel easier
            </div>
          </div>
        </div>
      </div>
    `;

    await sendEmail({
      email: user.email,
      subject: "PackPalz Password Reset",
      message,
      html,
    });

    return res.status(200).json({
      message: "Password reset link sent to your email",
    });
  } catch (error) {
    console.error("FORGOT PASSWORD ERROR:", error);
    return res.status(500).json({
      message: error.message || "Server error during forgot password",
    });
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
      return res.status(400).json({
        message: "Invalid or expired reset token",
      });
    }

    const { password, confirmPassword } = req.body;

    if (!password || !confirmPassword) {
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

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    return res.status(200).json({
      message: "Password reset successful",
    });
  } catch (error) {
    console.error("RESET PASSWORD ERROR:", error);
    return res.status(500).json({
      message: error.message || "Server error during password reset",
    });
  }
};