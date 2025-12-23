import Entry from "../models/Entry.js";
import User from "../models/User.js";
import cloudinary from "../utils/cloudinary.js";
import multer from "multer";
import fs from "fs";
import { calculateConsecutiveStreak } from "../utils/streakCalculator.js";
const upload = multer({ dest: "uploads/" });
export const uploadMiddleware = upload.single("image");

/* -------------------------
   DATE HELPERS
--------------------------*/
const toDateOnly = (d) =>
  new Date(d).toISOString().slice(0, 10); // YYYY-MM-DD

const daysBetween = (a, b) => {
  const d1 = new Date(a);
  const d2 = new Date(b);
  return Math.floor((d2 - d1) / (1000 * 60 * 60 * 24));
};

/* -------------------------
   ADD ENTRY (AUTH)
--------------------------*/
export const addEntry = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { text, date } = req.body;

    if (!text && !req.file) {
      return res.status(400).json({ error: "Text or image required" });
    }
    if (!date) {
      return res.status(400).json({ error: "Date is required" });
    }

    const entryDate = toDateOnly(date);

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

    /* -------------------------
       CREATE ENTRY
    --------------------------*/
    const entry = await Entry.create({
      user: userId,
      text,
      imageUrl,
      imagePublicId,
      date: entryDate,
    });

    /* -------------------------
       STREAK = SOURCE OF TRUTH
    --------------------------*/
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // 🔥 derive streak from DB (not from assumptions)
    const streak = await calculateConsecutiveStreak(userId);

    // 🔥 derive lastEntryDate from latest entry
    const latestEntry = await Entry.findOne({ user: userId })
      .sort({ date: -1 })
      .select("date");

    user.streak = streak;
    user.lastEntryDate = streak > 0 ? entryDate : null;

    await user.save();

    res.json({
      entry,
      streak: user.streak,
      lastEntryDate: user.lastEntryDate,
    });
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
    const userId = req.user.userId;

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
/* -------------------------
   DELETE ENTRY (STREAK SAFE)
--------------------------*/
export const deleteEntry = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const entry = await Entry.findOne({ _id: id, user: userId });
    if (!entry) {
      return res.status(404).json({ error: "Entry not found" });
    }

    // Remove image if exists
    if (entry.imagePublicId) {
      try {
        await cloudinary.uploader.destroy(entry.imagePublicId);
      } catch {}
    }

    // Delete entry
    await Entry.deleteOne({ _id: entry._id });

    // 🔥 Recalculate streak (SOURCE OF TRUTH)
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const newStreak = await calculateConsecutiveStreak(userId);

    user.streak = newStreak;
    user.lastEntryDate =
      newStreak > 0
        ? new Date().toISOString().slice(0, 10)
        : null;

    await user.save();

    res.json({
      message: "Entry deleted",
      id,
      streak: user.streak,
      lastEntryDate: user.lastEntryDate,
    });
  } catch (error) {
    console.error("❌ Error deleting entry:", error);
    res.status(500).json({ error: "Failed to delete entry" });
  }
};


/* -------------------------
   GET STREAK (SOURCE OF TRUTH)
--------------------------*/
export const getStreak = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId).select("streak lastEntryDate");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      streak: user.streak,
      lastEntryDate: user.lastEntryDate,
    });
  } catch (error) {
    console.error("❌ Error fetching streak:", error);
    res.status(500).json({ error: "Failed to fetch streak" });
  }
};
