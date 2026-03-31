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
import paymentRoutes from "./routes/payment.routes.js";
import itineraryRoutes from "./routes/itinerary.routes.js";
import userRoutes from "./routes/user.routes.js";
import userPostRoutes from "./routes/userPost.routes.js";
import aiRoutes from "./routes/ai.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import searchRoutes from "./routes/search.routes.js";
import blogRoutes from "./routes/userBlog.routes.js";



const app = express();

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
app.use("/payments", paymentRoutes);
app.use("/itineraries", itineraryRoutes);
app.use("/users", userRoutes);
app.use("/user-posts", userPostRoutes);
app.use("/ai", aiRoutes);
app.use("/notifications", notificationRoutes);
app.use("/search", searchRoutes);
app.use("/blogs", blogRoutes);

export default app;