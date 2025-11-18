import express from "express";
import { addEntry, getEntries, uploadMiddleware,deleteEntry, getStreak } from "../controllers/entryController.js";

const router = express.Router();

router.post("/add", uploadMiddleware, addEntry);
router.get("/:deviceId", getEntries);
router.get("/streak/:deviceId", getStreak);
router.delete("/:id", deleteEntry);

export default router;
