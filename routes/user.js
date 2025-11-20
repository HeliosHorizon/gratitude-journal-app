// routes/users.js
import express from "express";
import {
  registerUser,
  updateStreak,
  saveFcmToken,
  sendNotificationToAll,
} from "../controllers/userContollers.js";

const router = express.Router();

// existing endpoints
router.post("/register", registerUser);
router.post("/streak", updateStreak);

// fcm token endpoint (frontend should call this)
router.post("/register-token", saveFcmToken);

// optional admin/test endpoint to trigger a notification to all users
// body: { title: "Your title", body: "Notification body" }
router.post("/notify", async (req, res) => {
  try {
    const { title, body } = req.body;
    if (!title || !body) return res.status(400).json({ error: "title & body required" });

    await sendNotificationToAll(title, body);
    res.json({ message: "Notification job queued/sent" });
  } catch (err) {
    console.error("Notify route error:", err);
    res.status(500).json({ error: "Failed to send notifications" });
  }
});

export default router;
