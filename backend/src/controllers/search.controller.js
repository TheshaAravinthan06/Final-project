import User from "../models/user.models.js";
import Place from "../models/place.models.js";
import TravelPick from "../models/travelPick.models.js";
import Itinerary from "../models/itinerary.models.js";
import Booking from "../models/booking.models.js";
import UserPost from "../models/userPost.models.js";
import UserBlog from "../models/userBlog.models.js";

const buildRegex = (q) => new RegExp(String(q || "").trim(), "i");

const getImageUrl = (path = "") => path || "";

const uniqueUsersById = (users = []) => {
  const map = new Map();
  users.forEach((user) => {
    if (user?._id) {
      map.set(String(user._id), user);
    }
  });
  return Array.from(map.values());
};

export const searchForUsers = async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();

    if (!q) {
      return res.status(200).json({ users: [] });
    }

    const regex = buildRegex(q);

    // 1. direct match from user profile fields
    const directUsers = await User.find({
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
      .limit(12);

    // 2. find users from matching posts
    const matchedPostUserIds = await UserPost.find({
      $or: [{ caption: regex }, { location: regex }],
    }).distinct("createdBy");

    // 3. find users from matching blogs
    const matchedBlogUserIds = await UserBlog.find({
      $or: [{ title: regex }, { excerpt: regex }, { content: regex }, { location: regex }],
    }).distinct("author");

    const relatedUserIds = [...matchedPostUserIds, ...matchedBlogUserIds];

    let relatedUsers = [];
    if (relatedUserIds.length > 0) {
      relatedUsers = await User.find({
        _id: { $in: relatedUserIds },
        role: "user",
        isActive: true,
      })
        .select("username name profileImage bio location work followers following")
        .sort({ createdAt: -1 })
        .limit(12);
    }

    const mergedUsers = uniqueUsersById([...directUsers, ...relatedUsers]).slice(0, 15);

    const usersWithReason = await Promise.all(
      mergedUsers.map(async (user) => {
        let matchLabel = "Profile match";

        const directMatch =
          regex.test(user.username || "") ||
          regex.test(user.name || "") ||
          regex.test(user.bio || "") ||
          regex.test(user.travelInterest || "") ||
          regex.test(user.location || "") ||
          regex.test(user.work || "");

        if (directMatch) {
          if (regex.test(user.username || "")) matchLabel = "Matched by username";
          else if (regex.test(user.name || "")) matchLabel = "Matched by name";
          else if (regex.test(user.location || "")) matchLabel = "Matched by location";
          else if (regex.test(user.bio || "") || regex.test(user.travelInterest || "")) {
            matchLabel = "Matched by mood / interest";
          }
        } else {
          const matchedPost = await UserPost.findOne({
            createdBy: user._id,
            $or: [{ caption: regex }, { location: regex }],
          }).select("caption location");

          const matchedBlog = await UserBlog.findOne({
            author: user._id,
            $or: [{ title: regex }, { excerpt: regex }, { content: regex }, { location: regex }],
          }).select("title location");

          if (matchedPost?.location && regex.test(matchedPost.location)) {
            matchLabel = `Matched in post location`;
          } else if (matchedPost?.caption && regex.test(matchedPost.caption)) {
            matchLabel = `Matched in post caption`;
          } else if (matchedBlog?.location && regex.test(matchedBlog.location)) {
            matchLabel = `Matched in blog location`;
          } else if (matchedBlog) {
            matchLabel = `Matched in blog`;
          }
        }

        return {
          _id: user._id,
          username: user.username,
          name: user.name || "",
          profileImage: getImageUrl(user.profileImage),
          bio: user.bio || "",
          location: user.location || "",
          work: user.work || "",
          followersCount: user.followers?.length || 0,
          followingCount: user.following?.length || 0,
          matchLabel,
        };
      })
    );

    return res.status(200).json({
      users: usersWithReason,
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

    const [users, places, travelPicks, itineraries, bookings] = await Promise.all([
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