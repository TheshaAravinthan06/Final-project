import mongoose from "mongoose";

const problemReportSchema = new mongoose.Schema(
  {
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1500,
    },
    status: {
      type: String,
      enum: ["pending", "reviewed", "resolved"],
      default: "pending",
    },
    reportType: {
      type: String,
      default: "problem",
    },
  },
  { timestamps: true }
);

export default mongoose.model("ProblemReport", problemReportSchema);