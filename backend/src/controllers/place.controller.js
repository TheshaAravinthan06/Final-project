import mongoose from "mongoose";
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

    const createdPlace = await Place.findById(place._id).populate(
      "createdBy",
      "username email role"
    );

    return res.status(201).json({
      message: "Place created successfully",
      place: createdPlace,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// USER HOME FEED - GET ALL PUBLISHED PLACES
export const getAllPlaces = async (req, res) => {
  try {
    const places = await Place.find({ isPublished: true })
      .populate("createdBy", "username")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: places.length,
      places,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// USER HOME FEED - GET SINGLE PUBLISHED PLACE
export const getPlaceById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid place id" });
    }

    const place = await Place.findOne({ _id: id, isPublished: true }).populate(
      "createdBy",
      "username"
    );

    if (!place) {
      return res.status(404).json({ message: "Place not found" });
    }

    return res.status(200).json({ place });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ADMIN - GET ALL PLACES
export const adminGetAllPlaces = async (req, res) => {
  try {
    const places = await Place.find()
      .populate("createdBy", "username email role")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: places.length,
      places,
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

    const place = await Place.findById(id).populate(
      "createdBy",
      "username email role"
    );

    if (!place) {
      return res.status(404).json({ message: "Place not found" });
    }

    return res.status(200).json({ place });
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

    if (placeName !== undefined) {
      place.placeName = placeName.trim();
    }

    if (location !== undefined) {
      place.location = location.trim();
    }

    if (caption !== undefined) {
      place.caption = caption.trim();
    }

    if (moodTags !== undefined) {
      place.moodTags = parseArrayField(moodTags);
    }

    if (activities !== undefined) {
      place.activities = parseArrayField(activities);
    }

    if (bestTime !== undefined) {
      place.bestTime = bestTime.trim();
    }

    if (weather !== undefined) {
      place.weather = weather.trim();
    }

    if (vibe !== undefined) {
      place.vibe = vibe.trim();
    }

    if (travelTip !== undefined) {
      place.travelTip = travelTip.trim();
    }

    if (isPublished !== undefined) {
      place.isPublished =
        String(isPublished).toLowerCase() === "false" ? false : true;
    }

    await place.save();

    const updatedPlace = await Place.findById(place._id).populate(
      "createdBy",
      "username email role"
    );

    return res.status(200).json({
      message: "Place updated successfully",
      place: updatedPlace,
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