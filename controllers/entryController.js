import Entry from "../models/Entry.js";
import User from "../models/User.js";
import cloudinary from "../utils/cloudinary.js";
import multer from "multer";
import fs from "fs";

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

    // Create entry
    const entry = await Entry.create({
      user: userId,
      text,
      imageUrl,
      imagePublicId,
      date: entryDate,
    });

    // 🔥 STREAK LOGIC (SOURCE OF TRUTH)
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.lastEntryDate) {
      // First entry ever
      user.streak = 1;
    } else {
      const diff = daysBetween(user.lastEntryDate, entryDate);

      if (diff === 0) {
        // same day → do nothing
      } else if (diff === 1) {
        // consecutive day
        user.streak += 1;
      } else {
        // missed one or more days
        user.streak = 1;
      }
    }

    user.lastEntryDate = entryDate;
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
export const deleteEntry = async (req, res) => {
  try {
    const userId = req.user.userId;
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
