import User from "../models/User.js";

// ✅ Register or fetch existing user
export const registerUser = async (req, res) => {
  try {
    const { deviceId } = req.body;
    console.log("📥 Received request to register:", req.body);
    if (!deviceId) return res.status(400).json({ error: "Device ID required" });

    let user = await User.findOne({ deviceId });
    if (user) {
      console.log("✅ Existing user found:", user.deviceId);
    } else {
      // Create new user
      user = await User.create({ deviceId });
      console.log("🆕 New user created:", user.deviceId);
    }

    res.json(user);
  } catch (error) {
    console.error("Error in user registration:", error);
    res.status(500).json({ error: "Failed to register or fetch user" });
  }
};

// ✅ Update streak when user adds an entry
export const updateStreak = async (req, res) => {
  try {
    const { deviceId, currentDate } = req.body;
    console.log("📥 Received request to register:", req.body);
    if (!deviceId || !currentDate) {
      return res.status(400).json({ error: "Missing deviceId or currentDate" });
    }

    const user = await User.findOne({ deviceId });
    if (!user) return res.status(404).json({ error: "User not found" });

    const lastEntryDate = user.lastEntryDate;
    const today = new Date(currentDate);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    // Convert dates to strings for comparison
    const last = lastEntryDate ? new Date(lastEntryDate).toDateString() : null;
    const todayStr = today.toDateString();
    const yesterdayStr = yesterday.toDateString();

    if (last === todayStr) {
      // already counted today
      return res.json({ message: "Already updated today", streak: user.streak });
    } else if (last === yesterdayStr) {
      // continued streak
      user.streak += 1;
    } else {
      // missed a day or new start
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
