import express from "express";
import {
  addEntry,
  getEntries,
  uploadMiddleware,
  deleteEntry,
  getStreak,
} from "../controllers/entryController.js";
import { authMiddleware } from "../utils/authMiddleware.js";

const router = express.Router();

// 🔐 All routes protected
router.use(authMiddleware);

router.post("/add", uploadMiddleware, addEntry);
router.get("/", getEntries);
router.get("/streak", getStreak);
router.delete("/:id", deleteEntry);

export default router;
