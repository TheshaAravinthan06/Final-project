import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
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
    paymentType: {
      type: String,
      enum: ["advance", "balance"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "LKR",
      trim: true,
      uppercase: true,
    },
    paymentMethod: {
      type: String,
      enum: ["card", "bank_transfer", "cash", "online_transfer", "other"],
      required: true,
    },
    transactionId: {
      type: String,
      trim: true,
      default: "",
    },
    note: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    status: {
      type: String,
      enum: ["completed", "failed", "refunded"],
      default: "completed",
    },
    paidAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Payment", paymentSchema);