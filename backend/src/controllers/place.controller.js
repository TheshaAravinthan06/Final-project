import mongoose from "mongoose";
import Place from "../models/place.models.js";

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// ADMIN - CREATE PLACE
export const createPlace = async (req, res) => {
  try {
    const { imageUrl, caption, moodTags, isPublished } = req.body;

    if (!imageUrl || !caption) {
      return res.status(400).json({
        message: "Image URL and caption are required",
      });
    }

    let parsedMoodTags = [];

    if (Array.isArray(moodTags)) {
      parsedMoodTags = moodTags.map((tag) => tag.trim()).filter(Boolean);
    } else if (typeof moodTags === "string" && moodTags.trim()) {
      parsedMoodTags = moodTags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);
    }

    const place = await Place.create({
      imageUrl: imageUrl.trim(),
      caption: caption.trim(),
      moodTags: parsedMoodTags,
      isPublished: typeof isPublished === "boolean" ? isPublished : true,
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

// USER HOME - GET ALL PUBLISHED PLACES
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

// USER HOME - GET SINGLE PUBLISHED PLACE
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
    const { imageUrl, caption, moodTags, isPublished } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid place id" });
    }

    const place = await Place.findById(id);

    if (!place) {
      return res.status(404).json({ message: "Place not found" });
    }

    if (imageUrl !== undefined) {
      place.imageUrl = imageUrl.trim();
    }

    if (caption !== undefined) {
      place.caption = caption.trim();
    }

    if (moodTags !== undefined) {
      if (Array.isArray(moodTags)) {
        place.moodTags = moodTags.map((tag) => tag.trim()).filter(Boolean);
      } else if (typeof moodTags === "string") {
        place.moodTags = moodTags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean);
      }
    }

    if (typeof isPublished === "boolean") {
      place.isPublished = isPublished;
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