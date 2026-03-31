import User from "../models/user.models.js";
import Place from "../models/place.models.js";
import TravelPick from "../models/travelPick.models.js";
import Itinerary from "../models/itinerary.models.js";
import Booking from "../models/booking.models.js";

const buildRegex = (q) => new RegExp(String(q || "").trim(), "i");

const getImageUrl = (path = "") => path || "";

export const searchForUsers = async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();

    if (!q) {
      return res.status(200).json({
        users: [],
      });
    }

    const regex = buildRegex(q);

    const users = await User.find({
      role: "user",
      isActive: true,
      $or: [
        { username: regex },
        { name: regex },
        { bio: regex },
        { travelInterest: regex },
        { location: regex },
        { work: regex },
      ],
    })
      .select("username name profileImage bio location work followers following")
      .sort({ createdAt: -1 })
      .limit(15);

    return res.status(200).json({
      users: users.map((user) => ({
        _id: user._id,
        username: user.username,
        name: user.name || "",
        profileImage: getImageUrl(user.profileImage),
        bio: user.bio || "",
        location: user.location || "",
        work: user.work || "",
        followersCount: user.followers?.length || 0,
        followingCount: user.following?.length || 0,
      })),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const adminGlobalSearch = async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();

    if (!q) {
      return res.status(200).json({
        users: [],
        places: [],
        travelPicks: [],
        itineraries: [],
        bookings: [],
      });
    }

    const regex = buildRegex(q);

    const [users, places, travelPicks, itineraries, bookings] =
      await Promise.all([
        User.find({
          $or: [
            { username: regex },
            { name: regex },
            { email: regex },
            { location: regex },
          ],
        })
          .select("username name email role profileImage isActive")
          .limit(8),

        Place.find({
          $or: [
            { placeName: regex },
            { location: regex },
            { caption: regex },
            { moodTags: regex },
          ],
        })
          .select("placeName location imageUrl isPublished createdAt")
          .limit(8),

        TravelPick.find({
          $or: [{ title: regex }, { place: regex }, { caption: regex }],
        })
          .select("title place imageUrl startDate endDate createdAt")
          .limit(8),

        Itinerary.find({
          $or: [{ title: regex }, { status: regex }, { destination: regex }],
        })
          .populate("user", "username")
          .select("title destination status createdAt user")
          .limit(8),

        Booking.find({})
          .populate("user", "username")
          .populate("travelPick", "title place")
          .sort({ createdAt: -1 })
          .limit(20),
      ]);

    const filteredBookings = bookings.filter((item) => {
      const username = item.user?.username || "";
      const title = item.travelPick?.title || "";
      const place = item.travelPick?.place || "";
      return regex.test(username) || regex.test(title) || regex.test(place);
    });

    return res.status(200).json({
      users: users.map((u) => ({
        _id: u._id,
        username: u.username,
        name: u.name || "",
        email: u.email || "",
        role: u.role,
        profileImage: u.profileImage || "",
        isActive: u.isActive,
      })),
      places: places.map((p) => ({
        _id: p._id,
        placeName: p.placeName,
        location: p.location,
        imageUrl: p.imageUrl || "",
        isPublished: p.isPublished,
        createdAt: p.createdAt,
      })),
      travelPicks: travelPicks.map((p) => ({
        _id: p._id,
        title: p.title,
        place: p.place,
        imageUrl: p.imageUrl || "",
        startDate: p.startDate,
        endDate: p.endDate,
        createdAt: p.createdAt,
      })),
      itineraries: itineraries.map((i) => ({
        _id: i._id,
        title: i.title || "",
        destination: i.destination || "",
        status: i.status || "",
        createdAt: i.createdAt,
        user: i.user
          ? {
              _id: i.user._id,
              username: i.user.username,
            }
          : null,
      })),
      bookings: filteredBookings.map((b) => ({
        _id: b._id,
        createdAt: b.createdAt,
        bookingStatus: b.bookingStatus,
        paymentStatus: b.paymentStatus,
        user: b.user
          ? {
              _id: b.user._id,
              username: b.user.username,
            }
          : null,
        travelPick: b.travelPick
          ? {
              _id: b.travelPick._id,
              title: b.travelPick.title,
              place: b.travelPick.place,
            }
          : null,
      })),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};