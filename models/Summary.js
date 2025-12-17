// models/Summary.js
import mongoose from "mongoose";

const summarySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    month: {
      type: String, // YYYY-MM
      required: true,
      index: true,
    },
    summary: {
      type: String,
      required: true,
    },
    entriesCountAtLastGenerate: {
      type: Number,
      default: 0,
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// one summary per user per month
summarySchema.index({ user: 1, month: 1 }, { unique: true });

export default mongoose.model("Summary", summarySchema);
