// models/Entry.js
import mongoose from "mongoose";

const entrySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    text: { type: String, required: true },
    imageUrl: { type: String },
    imagePublicId: { type: String },
    date: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Entry", entrySchema);
