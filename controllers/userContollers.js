// controllers/userControllers.js
import User from "../models/User.js";
import admin from "../utils/firebaseAdmin.js"; 

/* ---------------------------------------
   REGISTER USER (same as your old logic)
------------------------------------------*/
export const registerUser = async (req, res) => {
  try {
    const { deviceId } = req.body;
    console.log("📥 Received request to register:", req.body);
    if (!deviceId) return res.status(400).json({ error: "Device ID required" });

    let user = await User.findOne({ deviceId });
    if (user) {
      console.log("✅ Existing user found:", user.deviceId);
    } else {
      user = await User.create({ deviceId });
      console.log("🆕 New user created:", user.deviceId);
    }

    res.json(user);
  } catch (error) {
    console.error("Error in user registration:", error);
    res.status(500).json({ error: "Failed to register or fetch user" });
  }
};

/* ---------------------------------------
   UPDATE STREAK (same as your old logic)
------------------------------------------*/
export const updateStreak = async (req, res) => {
  try {
    const { deviceId, currentDate } = req.body;
    if (!deviceId || !currentDate) {
      return res.status(400).json({ error: "Missing deviceId or currentDate" });
    }

    const user = await User.findOne({ deviceId });
    if (!user) return res.status(404).json({ error: "User not found" });

    const lastEntryDate = user.lastEntryDate;
    const today = new Date(currentDate);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const last = lastEntryDate ? new Date(lastEntryDate).toDateString() : null;
    const todayStr = today.toDateString();
    const yesterdayStr = yesterday.toDateString();

    if (last === todayStr) {
      return res.json({ message: "Already updated today", streak: user.streak });
    } else if (last === yesterdayStr) {
      user.streak += 1;
    } else {
      user.streak = 1;
    }

    user.lastEntryDate = currentDate;
    await user.save();

    res.json({ message: "Streak updated", streak: user.streak });
  } catch (error) {
    console.error("Error updating streak:", error);
    res.status(500).json({ error: "Failed to update streak" });
  }
};

/* ---------------------------------------
   SAVE LATEST FCM TOKEN (new endpoint)
------------------------------------------*/
// controllers/userControllers.js (replace saveFcmToken)
export const saveFcmToken = async (req, res) => {
  try {
    console.log("📥 /save-fcm-token body:", req.body);

    const { deviceId, fcmToken, platform } = req.body || {};

    if (!deviceId) return res.status(400).json({ error: "deviceId required" });
    if (!fcmToken) return res.status(400).json({ error: "fcmToken required" });

    // Upsert pattern: if user exists, update token; otherwise create new
    const user = await User.findOneAndUpdate(
      { deviceId },
      {
        $set: {
          fcmToken,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          deviceId,
          streak: 0,
          lastEntryDate: null,
          createdAt: new Date(),
        }
      },
      { new: true, upsert: true }
    );

    console.log("✅ saveFcmToken result user:", user.deviceId, user.fcmToken);

    return res.json({ message: "Token saved", user });
  } catch (error) {
    console.error("Save FCM error:", error);
    return res.status(500).json({ error: "Failed to save FCM token" });
  }
};


/* ---------------------------------------
   SEND NOTIFICATION TO ALL USERS (scheduler)
------------------------------------------*/
export const sendNotificationToAll = async (title, body) => {
  try {
    const users = await User.find({ fcmToken: { $ne: null } });

    if (!users.length) {
      console.log("❌ No FCM tokens to send");
      return;
    }

    const tokens = users.map((u) => u.fcmToken);

    const message = {
      notification: { title, body },
      tokens,
    };

    const response = await admin.messaging().sendMulticast(message);

    console.log(
      `📤 Notification sent | Success: ${response.successCount} | Fail: ${response.failureCount}`
    );
  } catch (err) {
    console.error("Error sending notifications:", err);
  }
};
