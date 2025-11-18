// controllers/entryController.js
import Entry from "../models/Entry.js";
import cloudinary from "../utils/cloudinary.js";
import multer from "multer";
import fs from "fs";

// upload middleware (unchanged)
const upload = multer({ dest: "uploads/" });
export const uploadMiddleware = upload.single("image");

// streak (unchanged)
const calculateStreak = async (deviceId) => {
  const entries = await Entry.find({ deviceId });
  const uniqueDays = [...new Set(entries.map((e) => e.date))];
  return uniqueDays.length;
};

// Add entry: store imagePublicId
export const addEntry = async (req, res) => {
  try {
    const { deviceId, text, date } = req.body;
    if (!deviceId || !date) return res.status(400).json({ error: "Missing fields" });

    let imageUrl = null;
    let imagePublicId = null;

    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "gratitude_entries",
      });
      imageUrl = result.secure_url;
      imagePublicId = result.public_id;     // 👈 keep it
      fs.unlinkSync(req.file.path);
    }

    const entry = await Entry.create({ deviceId, text, imageUrl, imagePublicId, date });
    const streak = await calculateStreak(deviceId);
    res.json({ entry, streak });
  } catch (error) {
    console.error("❌ Error creating entry:", error);
    res.status(500).json({ error: "Failed to save entry" });
  }
};

// Get entries (unchanged)
export const getEntries = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const entries = await Entry.find({ deviceId }).sort({ date: 1, _id: 1 });
    res.json(entries);
  } catch (error) {
    console.error("Error fetching entries:", error);
    res.status(500).json({ error: "Failed to fetch entries" });
  }
};

// Delete by Mongo _id + deviceId
export const deleteEntry = async (req, res) => {
  try {
    const { id } = req.params;               // 👈 param name is "id"
    const { deviceId } = req.body;

    if (!deviceId) return res.status(400).json({ error: "deviceId required" });

    const entry = await Entry.findOne({ _id: id, deviceId }); // 👈 use _id
    if (!entry) return res.status(404).json({ error: "Entry not found" });

    if (entry.imagePublicId) {
      try { await cloudinary.uploader.destroy(entry.imagePublicId); } catch {}
    }

    await Entry.deleteOne({ _id: entry._id, deviceId });      // 👈 secure delete
    res.json({ message: "Entry deleted", id });
  } catch (error) {
    console.error("Error deleting entry:", error);
    res.status(500).json({ error: "Failed to delete entry" });
  }
};

// Streak (unchanged)
export const getStreak = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const streak = await calculateStreak(deviceId);
    res.json({ streak });
  } catch (error) {
    console.error("❌ Error fetching streak:", error);
    res.status(500).json({ error: "Failed to fetch streak" });
  }
};
