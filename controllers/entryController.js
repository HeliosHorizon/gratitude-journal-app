import Entry from "../models/Entry.js";
import cloudinary from "../utils/cloudinary.js";
import multer from "multer";
import fs from "fs";

// upload middleware (unchanged)
const upload = multer({ dest: "uploads/" });
export const uploadMiddleware = upload.single("image");

/* -------------------------
   STREAK (user-based)
--------------------------*/
const calculateStreak = async (userId) => {
  const entries = await Entry.find({ user: userId }).select("date");
  const uniqueDays = [...new Set(entries.map((e) => e.date))];
  return uniqueDays.length;
};

/* -------------------------
   ADD ENTRY
--------------------------*/
export const addEntry = async (req, res) => {
  try {
    const userId = req.user._id;
    const { text, date } = req.body;

    if (!text && !req.file) {
      return res.status(400).json({ error: "Text or image required" });
    }
    if (!date) {
      return res.status(400).json({ error: "Date is required" });
    }

    let imageUrl = null;
    let imagePublicId = null;

    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "gratitude_entries",
      });
      imageUrl = result.secure_url;
      imagePublicId = result.public_id;
      fs.unlinkSync(req.file.path);
    }

    const entry = await Entry.create({
      user: userId,
      text,
      imageUrl,
      imagePublicId,
      date,
    });

    const streak = await calculateStreak(userId);

    res.json({ entry, streak });
  } catch (error) {
    console.error("❌ Error creating entry:", error);
    res.status(500).json({ error: "Failed to save entry" });
  }
};

/* -------------------------
   GET ENTRIES
--------------------------*/
export const getEntries = async (req, res) => {
  try {
    const userId = req.user._id;

    const entries = await Entry.find({ user: userId })
      .sort({ date: 1, _id: 1 });

    res.json(entries);
  } catch (error) {
    console.error("❌ Error fetching entries:", error);
    res.status(500).json({ error: "Failed to fetch entries" });
  }
};

/* -------------------------
   DELETE ENTRY
--------------------------*/
export const deleteEntry = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const entry = await Entry.findOne({ _id: id, user: userId });
    if (!entry) {
      return res.status(404).json({ error: "Entry not found" });
    }

    if (entry.imagePublicId) {
      try {
        await cloudinary.uploader.destroy(entry.imagePublicId);
      } catch {}
    }

    await Entry.deleteOne({ _id: entry._id });

    res.json({ message: "Entry deleted", id });
  } catch (error) {
    console.error("❌ Error deleting entry:", error);
    res.status(500).json({ error: "Failed to delete entry" });
  }
};

/* -------------------------
   GET STREAK
--------------------------*/
export const getStreak = async (req, res) => {
  try {
    const userId = req.user._id;
    const streak = await calculateStreak(userId);
    res.json({ streak });
  } catch (error) {
    console.error("❌ Error fetching streak:", error);
    res.status(500).json({ error: "Failed to fetch streak" });
  }
};
