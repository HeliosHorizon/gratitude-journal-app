import express from "express";
import { registerUser, updateStreak } from "../controllers/userContollers.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/streak", updateStreak);

export default router;
