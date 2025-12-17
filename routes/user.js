import express from "express";
import {
  registerUser,
  loginUser,
  updateStreak,
  saveFcmToken,
  sendNotificationToAll,
} from "../controllers/userContollers.js"; // ✅ EXACT NAME

import { authMiddleware } from "../utils/authMiddleware.js";

const router = express.Router();

// auth
router.post("/register", registerUser);
router.post("/login", loginUser);

// protected
router.post("/streak", authMiddleware, updateStreak);
router.post("/register-token", authMiddleware, saveFcmToken);

// admin/test
router.post("/notify", async (req, res) => {
  const { title, body } = req.body;
  if (!title || !body) {
    return res.status(400).json({ error: "title & body required" });
  }

  await sendNotificationToAll(title, body);
  res.json({ message: "Notification sent" });
});

export default router;
