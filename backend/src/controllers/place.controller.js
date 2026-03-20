import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import Place from "../models/place.models.js";

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const parseArrayField = (value) => {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const getOptionalUserId = (req) => {
  try {
    let token = null;

    if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token || !process.env.JWT_SECRET) {
      return null;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded?.id || null;
  } catch {
    return null;
  }
};

const formatPlace = (placeDoc, userId = null) => {
  const place = placeDoc.toObject ? placeDoc.toObject() : placeDoc;

  return {
    _id: place._id,
    placeName: place.placeName,
    location: place.location,
    imageUrl: place.imageUrl,
    caption: place.caption,
    moodTags: place.moodTags || [],
    activities: place.activities || [],
    bestTime: place.bestTime || "",
    weather: place.weather || "",
    vibe: place.vibe || "",
    travelTip: place.travelTip || "",
    createdBy: place.createdBy,
    isPublished: place.isPublished,
    createdAt: place.createdAt,
    updatedAt: place.updatedAt,
    likesCount: place.likes?.length || 0,
    savesCount: place.savedBy?.length || 0,
    commentsCount: place.comments?.length || 0,
    shareCount: place.shareCount || 0,
    isLiked: userId
      ? (place.likes || []).some((id) => String(id) === String(userId))
      : false,
    isSaved: userId
      ? (place.savedBy || []).some((id) => String(id) === String(userId))
      : false,
    comments: (place.comments || []).map((comment) => ({
      _id: comment._id,
      text: comment.text,
      createdAt: comment.createdAt,
      user: comment.user
        ? {
            _id: comment.user._id,
            username: comment.user.username,
          }
        : null,
    })),
  };
};

// ADMIN - CREATE PLACE
export const createPlace = async (req, res) => {
  try {
    const {
      placeName,
      location,
      caption,
      moodTags,
      activities,
      bestTime,
      weather,
      vibe,
      travelTip,
      isPublished,
    } = req.body;

    if (!req.file) {
      return res.status(400).json({
        message: "Image is required",
      });
    }

    if (!placeName || !location || !caption) {
      return res.status(400).json({
        message: "Place name, location, and caption are required",
      });
    }

    const imageUrl = `/uploads/places/${req.file.filename}`;

    const place = await Place.create({
      placeName: placeName.trim(),
      location: location.trim(),
      imageUrl,
      caption: caption.trim(),
      moodTags: parseArrayField(moodTags),
      activities: parseArrayField(activities),
      bestTime: bestTime ? bestTime.trim() : "",
      weather: weather ? weather.trim() : "",
      vibe: vibe ? vibe.trim() : "",
      travelTip: travelTip ? travelTip.trim() : "",
      isPublished:
        String(isPublished).toLowerCase() === "false" ? false : true,
      createdBy: req.user._id,
    });

    const createdPlace = await Place.findById(place._id)
      .populate("createdBy", "username email role")
      .populate("comments.user", "username");

    return res.status(201).json({
      message: "Place created successfully",
      place: formatPlace(createdPlace, req.user._id),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// USER HOME FEED - GET ALL PUBLISHED PLACES
export const getAllPlaces = async (req, res) => {
  try {
    const userId = getOptionalUserId(req);

    const places = await Place.find({ isPublished: true })
      .populate("createdBy", "username")
      .populate("comments.user", "username")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: places.length,
      places: places.map((place) => formatPlace(place, userId)),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// USER HOME FEED - GET SINGLE PUBLISHED PLACE
export const getPlaceById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = getOptionalUserId(req);

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid place id" });
    }

    const place = await Place.findOne({ _id: id, isPublished: true })
      .populate("createdBy", "username")
      .populate("comments.user", "username");

    if (!place) {
      return res.status(404).json({ message: "Place not found" });
    }

    return res.status(200).json({ place: formatPlace(place, userId) });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ADMIN - GET ALL PLACES
export const adminGetAllPlaces = async (req, res) => {
  try {
    const places = await Place.find()
      .populate("createdBy", "username email role")
      .populate("comments.user", "username")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: places.length,
      places: places.map((place) => formatPlace(place, req.user._id)),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ADMIN - GET SINGLE PLACE
export const adminGetPlaceById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid place id" });
    }

    const place = await Place.findById(id)
      .populate("createdBy", "username email role")
      .populate("comments.user", "username");

    if (!place) {
      return res.status(404).json({ message: "Place not found" });
    }

    return res.status(200).json({ place: formatPlace(place, req.user._id) });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ADMIN - UPDATE PLACE
export const updatePlace = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid place id" });
    }

    const place = await Place.findById(id);

    if (!place) {
      return res.status(404).json({ message: "Place not found" });
    }

    const {
      placeName,
      location,
      caption,
      moodTags,
      activities,
      bestTime,
      weather,
      vibe,
      travelTip,
      isPublished,
    } = req.body;

    if (req.file) {
      place.imageUrl = `/uploads/places/${req.file.filename}`;
    }

    if (placeName !== undefined) place.placeName = placeName.trim();
    if (location !== undefined) place.location = location.trim();
    if (caption !== undefined) place.caption = caption.trim();
    if (moodTags !== undefined) place.moodTags = parseArrayField(moodTags);
    if (activities !== undefined) place.activities = parseArrayField(activities);
    if (bestTime !== undefined) place.bestTime = bestTime.trim();
    if (weather !== undefined) place.weather = weather.trim();
    if (vibe !== undefined) place.vibe = vibe.trim();
    if (travelTip !== undefined) place.travelTip = travelTip.trim();

    if (isPublished !== undefined) {
      place.isPublished =
        String(isPublished).toLowerCase() === "false" ? false : true;
    }

    await place.save();

    const updatedPlace = await Place.findById(place._id)
      .populate("createdBy", "username email role")
      .populate("comments.user", "username");

    return res.status(200).json({
      message: "Place updated successfully",
      place: formatPlace(updatedPlace, req.user._id),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ADMIN - DELETE PLACE
export const deletePlace = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid place id" });
    }

    const place = await Place.findById(id);

    if (!place) {
      return res.status(404).json({ message: "Place not found" });
    }

    await place.deleteOne();

    return res.status(200).json({
      message: "Place deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// USER - TOGGLE LIKE
export const togglePlaceLike = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid place id" });
    }

    const place = await Place.findById(id)
      .populate("createdBy", "username")
      .populate("comments.user", "username");

    if (!place || !place.isPublished) {
      return res.status(404).json({ message: "Place not found" });
    }

    const alreadyLiked = place.likes.some(
      (userId) => String(userId) === String(req.user._id)
    );

    if (alreadyLiked) {
      place.likes = place.likes.filter(
        (userId) => String(userId) !== String(req.user._id)
      );
    } else {
      place.likes.push(req.user._id);
    }

    await place.save();

    return res.status(200).json({
      message: alreadyLiked ? "Like removed" : "Place liked",
      place: formatPlace(place, req.user._id),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// USER - TOGGLE SAVE
export const togglePlaceSave = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid place id" });
    }

    const place = await Place.findById(id)
      .populate("createdBy", "username")
      .populate("comments.user", "username");

    if (!place || !place.isPublished) {
      return res.status(404).json({ message: "Place not found" });
    }

    const alreadySaved = place.savedBy.some(
      (userId) => String(userId) === String(req.user._id)
    );

    if (alreadySaved) {
      place.savedBy = place.savedBy.filter(
        (userId) => String(userId) !== String(req.user._id)
      );
    } else {
      place.savedBy.push(req.user._id);
    }

    await place.save();

    return res.status(200).json({
      message: alreadySaved ? "Save removed" : "Place saved",
      place: formatPlace(place, req.user._id),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// USER - ADD COMMENT
export const addPlaceComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid place id" });
    }

    if (!text || !String(text).trim()) {
      return res.status(400).json({ message: "Comment text is required" });
    }

    const place = await Place.findById(id);

    if (!place || !place.isPublished) {
      return res.status(404).json({ message: "Place not found" });
    }

    place.comments.push({
      user: req.user._id,
      text: String(text).trim(),
    });

    await place.save();

    const updatedPlace = await Place.findById(id)
      .populate("createdBy", "username")
      .populate("comments.user", "username");

    return res.status(201).json({
      message: "Comment added successfully",
      place: formatPlace(updatedPlace, req.user._id),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// USER - SHARE COUNT
export const incrementPlaceShare = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid place id" });
    }

    const place = await Place.findById(id)
      .populate("createdBy", "username")
      .populate("comments.user", "username");

    if (!place || !place.isPublished) {
      return res.status(404).json({ message: "Place not found" });
    }

    place.shareCount += 1;
    await place.save();

    return res.status(200).json({
      message: "Share count updated",
      place: formatPlace(place, req.user._id),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};