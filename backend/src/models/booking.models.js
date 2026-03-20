import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    travelPick: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TravelPick",
      required: true,
    },

    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      maxlength: 120,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
    },

    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
      maxlength: 30,
    },

    travelersCount: {
      type: Number,
      required: [true, "Travelers count is required"],
      min: 1,
      default: 1,
    },

    specialNote: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },

    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    advancePercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },

    advanceAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    remainingAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    bookingStatus: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "pending",
    },

    paymentStatus: {
      type: String,
      enum: ["unpaid", "advance_paid", "paid", "refunded"],
      default: "unpaid",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Booking", bookingSchema);