import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import session from "express-session";
import path from "path";
import passport from "./config/passport.js";
import authRoutes from "./routes/auth.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import placeRoutes from "./routes/place.routes.js";
import travelPickRoutes from "./routes/travelPick.routes.js";
import bookingRoutes from "./routes/booking.routes.js";

const app = express();

// IMPORTANT FIX:
// Allow frontend on localhost:3000 to load images from backend localhost:5000
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve uploaded files
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.use(
  session({
    secret: "googleauthsecret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
      sameSite: "lax",
    },
  })
);

app.use(passport.initialize());

app.get("/", (req, res) => {
  res.json({ message: "Backend is running" });
});

app.use("/auth", authRoutes);
app.use("/admin", adminRoutes);
app.use("/places", placeRoutes);
app.use("/travel-picks", travelPickRoutes);
app.use("/bookings", bookingRoutes);

export default app;