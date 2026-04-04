import express from "express";
import {
  register,
  login,
  logoutUser,
  forgotPassword,
  resetPassword,
  refreshToken,
  changePassword,
  googleAuthCallback,
} from "../controllers/auth.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import passport, { isGoogleAuthEnabled } from "../config/passport.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refreshToken);
router.post("/logout", logoutUser);
router.post("/forgot-password", forgotPassword);
router.put("/reset-password/:token", resetPassword);
router.put("/change-password", protect, changePassword);

router.get("/me", protect, (req, res) => {
  res.json({
    message: "Protected route working",
    user: req.user,
  });
});

const googleFailureRedirect = `${(process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/$/, "")}/?error=google_denied`;

if (isGoogleAuthEnabled) {
  router.get(
    "/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
  );
  router.get(
    "/google/callback",
    passport.authenticate("google", {
      session: false,
      failureRedirect: googleFailureRedirect,
    }),
    googleAuthCallback
  );
} else {
  router.get("/google", (req, res) => {
    res.status(503).json({
      message:
        "Google login is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in backend .env",
    });
  });
  router.get("/google/callback", (req, res) => {
    res.status(503).json({ message: "Google OAuth not configured." });
  });
}

export default router;