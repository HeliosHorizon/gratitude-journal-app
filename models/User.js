// models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  deviceId: { type: String, required: true, unique: true },
  fcmToken: { type: String, default: null },   // <-- single token per device
  streak: { type: Number, default: 0 },
  lastEntryDate: { type: String, default: null },
}, { timestamps: true });

// keep updatedAt auto-updated
userSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.models.User || mongoose.model("User", userSchema);
