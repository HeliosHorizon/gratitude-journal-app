import mongoose from "mongoose";

const summarySchema = new mongoose.Schema({
  deviceId: { type: String, required: true },
  month: { type: String, required: true }, // Format: "2024-11"
  summaryText: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

// Compound index to ensure one summary per device per month
summarySchema.index({ deviceId: 1, month: 1 }, { unique: true });

export default mongoose.model("Summary", summarySchema);