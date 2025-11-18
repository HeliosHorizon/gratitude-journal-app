import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  deviceId: { type: String, required: true, unique: true },
  streak: { type: Number, default: 0 },
  lastEntryDate: { type: String, default: null },
}, { timestamps: true });

export default mongoose.model("User", userSchema);
