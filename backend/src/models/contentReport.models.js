import mongoose from "mongoose";

const contentReportSchema = new mongoose.Schema(
  {
    reportType: {
      type: String,
      enum: ["user_post", "blog", "user_account"],
      required: true,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    targetUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reason: {
      type: String,
      trim: true,
      maxlength: 300,
      default: "",
    },
    details: {
      type: String,
      trim: true,
      maxlength: 1500,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "reviewed", "resolved"],
      default: "pending",
    },
  },
  { timestamps: true }
);

contentReportSchema.index({ reportType: 1, entityId: 1, reportedBy: 1 }, { unique: true });

export default mongoose.model("ContentReport", contentReportSchema);
