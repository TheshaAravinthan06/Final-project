import mongoose from "mongoose";
import Itinerary from "../models/itinerary.models.js";

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const normalizeStringArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).trim())
      .filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

const normalizeGeneratedItinerary = (value) => {
  if (!Array.isArray(value)) return [];

  return value
    .map((day, index) => ({
      dayNumber: Number(day.dayNumber || index + 1),
      title: day.title ? String(day.title).trim() : "",
      activities: normalizeStringArray(day.activities),
      stay: day.stay ? String(day.stay).trim() : "",
      meals: day.meals ? String(day.meals).trim() : "",
      transport: day.transport ? String(day.transport).trim() : "",
      notes: day.notes ? String(day.notes).trim() : "",
    }))
    .filter((day) => day.dayNumber > 0);
};

// USER - CREATE ITINERARY REQUEST
export const createItinerary = async (req, res) => {
  try {
    const {
      mood,
      destination,
      budget,
      days,
      travelersCount,
      travelWithStrangers,
      startDate,
      preferences,
      specialNote,
    } = req.body;

    if (!mood || !String(mood).trim()) {
      return res.status(400).json({ message: "Mood is required" });
    }

    const totalDays = Number(days);
    if (Number.isNaN(totalDays) || totalDays < 1 || totalDays > 30) {
      return res.status(400).json({
        message: "Days must be a number between 1 and 30",
      });
    }

    const totalTravelers = Number(travelersCount || 1);
    if (Number.isNaN(totalTravelers) || totalTravelers < 1) {
      return res.status(400).json({
        message: "Travelers count must be at least 1",
      });
    }

    const parsedBudget = Number(budget || 0);
    if (Number.isNaN(parsedBudget) || parsedBudget < 0) {
      return res.status(400).json({
        message: "Budget must be 0 or more",
      });
    }

    const itinerary = await Itinerary.create({
      user: req.user._id,
      mood: String(mood).trim(),
      destination: destination ? String(destination).trim() : "",
      budget: parsedBudget,
      days: totalDays,
      travelersCount: totalTravelers,
      travelWithStrangers: Boolean(travelWithStrangers),
      startDate: startDate ? new Date(startDate) : null,
      preferences: normalizeStringArray(preferences),
      specialNote: specialNote ? String(specialNote).trim() : "",
    });

    const populatedItinerary = await Itinerary.findById(itinerary._id).populate(
      "user",
      "username email"
    );

    return res.status(201).json({
      message: "Itinerary request created successfully",
      itinerary: populatedItinerary,
    });
  } catch (error) {
    console.error("createItinerary error:", error);
    return res.status(500).json({ message: error.message });
  }
};

// USER - GET MY ITINERARIES
export const getMyItineraries = async (req, res) => {
  try {
    const itineraries = await Itinerary.find({ user: req.user._id })
      .populate("reviewedBy", "username email role")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: itineraries.length,
      itineraries,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// USER - GET MY SINGLE ITINERARY
export const getMyItineraryById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid itinerary id" });
    }

    const itinerary = await Itinerary.findOne({
      _id: id,
      user: req.user._id,
    })
      .populate("user", "username email")
      .populate("reviewedBy", "username email role");

    if (!itinerary) {
      return res.status(404).json({ message: "Itinerary not found" });
    }

    return res.status(200).json({ itinerary });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// USER - UPDATE OWN REQUEST BEFORE REVIEW
export const updateMyItinerary = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      mood,
      destination,
      budget,
      days,
      travelersCount,
      travelWithStrangers,
      startDate,
      preferences,
      specialNote,
    } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid itinerary id" });
    }

    const itinerary = await Itinerary.findOne({
      _id: id,
      user: req.user._id,
    });

    if (!itinerary) {
      return res.status(404).json({ message: "Itinerary not found" });
    }

    if (itinerary.status !== "draft") {
      return res.status(400).json({
        message: "Only pending itinerary requests can be edited by the user",
      });
    }

    if (mood !== undefined) {
      if (!String(mood).trim()) {
        return res.status(400).json({ message: "Mood cannot be empty" });
      }
      itinerary.mood = String(mood).trim();
    }

    if (destination !== undefined) {
      itinerary.destination = destination ? String(destination).trim() : "";
    }

    if (budget !== undefined) {
      const parsedBudget = Number(budget);
      if (Number.isNaN(parsedBudget) || parsedBudget < 0) {
        return res.status(400).json({
          message: "Budget must be 0 or more",
        });
      }
      itinerary.budget = parsedBudget;
    }

    if (days !== undefined) {
      const totalDays = Number(days);
      if (Number.isNaN(totalDays) || totalDays < 1 || totalDays > 30) {
        return res.status(400).json({
          message: "Days must be a number between 1 and 30",
        });
      }
      itinerary.days = totalDays;
    }

    if (travelersCount !== undefined) {
      const totalTravelers = Number(travelersCount);
      if (Number.isNaN(totalTravelers) || totalTravelers < 1) {
        return res.status(400).json({
          message: "Travelers count must be at least 1",
        });
      }
      itinerary.travelersCount = totalTravelers;
    }

    if (travelWithStrangers !== undefined) {
      itinerary.travelWithStrangers = Boolean(travelWithStrangers);
    }

    if (startDate !== undefined) {
      itinerary.startDate = startDate ? new Date(startDate) : null;
    }

    if (preferences !== undefined) {
      itinerary.preferences = normalizeStringArray(preferences);
    }

    if (specialNote !== undefined) {
      itinerary.specialNote = specialNote ? String(specialNote).trim() : "";
    }

    await itinerary.save();

    const updatedItinerary = await Itinerary.findById(itinerary._id)
      .populate("user", "username email")
      .populate("reviewedBy", "username email role");

    return res.status(200).json({
      message: "Itinerary updated successfully",
      itinerary: updatedItinerary,
    });
  } catch (error) {
    console.error("updateMyItinerary error:", error);
    return res.status(500).json({ message: error.message });
  }
};

// USER - DELETE OWN PENDING REQUEST
export const deleteMyItinerary = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid itinerary id" });
    }

    const itinerary = await Itinerary.findOne({
      _id: id,
      user: req.user._id,
    });

    if (!itinerary) {
      return res.status(404).json({ message: "Itinerary not found" });
    }

    if (itinerary.status !== "pending") {
      return res.status(400).json({
        message: "Only pending itinerary requests can be deleted by the user",
      });
    }

    await itinerary.deleteOne();

    return res.status(200).json({
      message: "Itinerary deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ADMIN - GET ALL ITINERARIES
export const adminGetAllItineraries = async (req, res) => {
  try {
    const itineraries = await Itinerary.find()
      .populate("user", "username email role")
      .populate("reviewedBy", "username email role")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: itineraries.length,
      itineraries,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ADMIN - GET SINGLE ITINERARY
export const adminGetItineraryById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid itinerary id" });
    }

    const itinerary = await Itinerary.findById(id)
      .populate("user", "username email role")
      .populate("reviewedBy", "username email role");

    if (!itinerary) {
      return res.status(404).json({ message: "Itinerary not found" });
    }

    return res.status(200).json({ itinerary });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ADMIN - UPDATE / REVIEW ITINERARY
export const adminUpdateItinerary = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      status,
      destination,
      budget,
      days,
      travelersCount,
      travelWithStrangers,
      startDate,
      preferences,
      specialNote,
      aiPrompt,
      generatedTitle,
      generatedSummary,
      generatedItinerary,
      estimatedCost,
      adminNote,
    } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid itinerary id" });
    }

    const itinerary = await Itinerary.findById(id);

    if (!itinerary) {
      return res.status(404).json({ message: "Itinerary not found" });
    }

    if (
      status !== undefined &&
      !["pending", "generated", "approved", "rejected"].includes(status)
    ) {
      return res.status(400).json({
        message: "Status must be pending, generated, approved, or rejected",
      });
    }

    if (status !== undefined) itinerary.status = status;
    if (destination !== undefined) {
      itinerary.destination = destination ? String(destination).trim() : "";
    }

    if (budget !== undefined) {
      const parsedBudget = Number(budget);
      if (Number.isNaN(parsedBudget) || parsedBudget < 0) {
        return res.status(400).json({
          message: "Budget must be 0 or more",
        });
      }
      itinerary.budget = parsedBudget;
    }

    if (days !== undefined) {
      const totalDays = Number(days);
      if (Number.isNaN(totalDays) || totalDays < 1 || totalDays > 30) {
        return res.status(400).json({
          message: "Days must be a number between 1 and 30",
        });
      }
      itinerary.days = totalDays;
    }

    if (travelersCount !== undefined) {
      const totalTravelers = Number(travelersCount);
      if (Number.isNaN(totalTravelers) || totalTravelers < 1) {
        return res.status(400).json({
          message: "Travelers count must be at least 1",
        });
      }
      itinerary.travelersCount = totalTravelers;
    }

    if (travelWithStrangers !== undefined) {
      itinerary.travelWithStrangers = Boolean(travelWithStrangers);
    }

    if (startDate !== undefined) {
      itinerary.startDate = startDate ? new Date(startDate) : null;
    }

    if (preferences !== undefined) {
      itinerary.preferences = normalizeStringArray(preferences);
    }

    if (specialNote !== undefined) {
      itinerary.specialNote = specialNote ? String(specialNote).trim() : "";
    }

    if (aiPrompt !== undefined) {
      itinerary.aiPrompt = aiPrompt ? String(aiPrompt).trim() : "";
    }

    if (generatedTitle !== undefined) {
      itinerary.generatedTitle = generatedTitle
        ? String(generatedTitle).trim()
        : "";
    }

    if (generatedSummary !== undefined) {
      itinerary.generatedSummary = generatedSummary
        ? String(generatedSummary).trim()
        : "";
    }

    if (generatedItinerary !== undefined) {
      itinerary.generatedItinerary =
        normalizeGeneratedItinerary(generatedItinerary);
    }

    if (estimatedCost !== undefined) {
      const parsedCost = Number(estimatedCost);
      if (Number.isNaN(parsedCost) || parsedCost < 0) {
        return res.status(400).json({
          message: "Estimated cost must be 0 or more",
        });
      }
      itinerary.estimatedCost = parsedCost;
    }

    if (adminNote !== undefined) {
      itinerary.adminNote = adminNote ? String(adminNote).trim() : "";
    }

    itinerary.reviewedBy = req.user._id;
    itinerary.reviewedAt = new Date();

    await itinerary.save();

    const updatedItinerary = await Itinerary.findById(itinerary._id)
      .populate("user", "username email role")
      .populate("reviewedBy", "username email role");

    return res.status(200).json({
      message: "Itinerary updated successfully",
      itinerary: updatedItinerary,
    });
  } catch (error) {
    console.error("adminUpdateItinerary error:", error);
    return res.status(500).json({ message: error.message });
  }
};

// ADMIN - DELETE ITINERARY
export const adminDeleteItinerary = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid itinerary id" });
    }

    const itinerary = await Itinerary.findById(id);

    if (!itinerary) {
      return res.status(404).json({ message: "Itinerary not found" });
    }

    await itinerary.deleteOne();

    return res.status(200).json({
      message: "Itinerary deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};