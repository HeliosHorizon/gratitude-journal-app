// // utils/dailyNotificationJob.js
// import cron from "node-cron";
// import User from "../models/User.js";
// import rawAdmin from "./firebaseAdmin.js";
// import { sendViaHttpV1 } from "./fcmHttpV1.js";

// const admin = (rawAdmin && rawAdmin.default) ? rawAdmin.default : rawAdmin;

// /* ======================================================
//    MESSAGE POOLS
// ====================================================== */

// const MORNING_MESSAGES = [
//   "Good morning ☀️ Start your day with gratitude",
//   "A grateful morning sets the tone for a peaceful day",
//   "What are you thankful for as today begins?",
//   "Take one minute this morning to feel grateful 🌱",
//   "Take a moment and note something you're grateful for!",
//   "A small reflection today can brighten your whole day 🌟",
//   "Your gratitude journal misses you ✨",
//   "Pause and reflect — what made you smile today?",
//   "Your gratitude streak is growing strong 💪",
//   "What's one beautiful thing that happened today?",
//   "Don't break the chain! Add to your gratitude streak 📝",
//   "Reflect on today's blessings before they fade away",
//   "Your future self will thank you for today's entry",
//   "Gratitude turns what we have into enough ✨",
//   "Capture today's joy before it slips away",
//   "Keep your gratitude flame burning 🔥",
//   "What made your heart feel light today?",
//   "Notice the small things - they matter most🎉",
//   "Gratitude is the best attitude to cultivate",
//   "Today's memories deserve to be cherished",
//   "Don't let today's blessings go unrecorded",
//   "Your consistency is building something beautiful",
//   "What moment today made you feel alive?",
//   "Gratitude makes every day a good day",
//   "Keep filling your life with thankful moments",
//   "What unexpected joy did you find today?",
//   "Your gratitude practice is changing your brain 🧠",
//   "Even on tough days, there's always something to appreciate",
//   "What made you feel supported today?",
//   "Gratitude is the music of the heart 🎵",
//   "Don't miss today's chance to count your blessings",
//   "What made today different and special?",
//   "Your consistency is creating positive patterns",
//   "Even small gratitudes create big happiness",
//   "What lesson are you grateful for today?",
//   "Keep your gratitude momentum going!",
//   "What connection are you thankful for today?",
//   "Gratitude transforms ordinary days into blessings",
//   "Your journal is waiting for today's story",
//   "What comfort are you grateful for right now?",
//   "Keep adding to your collection of happy moments",
//   "What beauty did you notice in the world today?",
//   "Gratitude is the heart's memory 💖",
//   "Don't let today's magic go unrecorded",
//   "What made you feel proud today?",
//   "Your daily practice is changing your perspective",
//   "Even challenges have hidden blessings",
//   "What opportunity are you grateful for?",
//   "What simple pleasure brightened your day?",
//   "Gratitude makes sense of our past and peace for today",
//   "Your consistency is your superpower 🦸",
//   "What growth are you thankful for?",
//   "Keep weaving gratitude into your daily life",
//   "What kindness did you receive or give today?",
//   "Gratitude is the sweetest thing in life",
//   "Don't miss today's chance to appreciate",
//   "What made you feel safe today?",
//   "Your practice is making you more resilient",
//   "Even ordinary moments hold extraordinary gratitude",
//   "What progress are you thankful for?",
//   "What made you laugh or smile today?",
//   "Gratitude is the healthiest of all emotions",
//   "Your dedication is building character",
//   "What nature moment are you grateful for?",
//   "Keep collecting moments of thankfulness",
//   "What knowledge are you thankful for today?",
//   "Gratitude makes life richer and deeper",
//   "Don't let today's gifts go unnoticed",
//   "What strength did you discover today?",
//   "Your habit is creating neural pathways of positivity",
//   "Even setbacks contain hidden blessings",
//   "What freedom are you grateful for?",
//   "What comfort are you thankful for?",
//   "Gratitude is the memory of the heart",
//   "Your persistence is building mental strength",
//   "What conversation enriched your day?",
//   "Keep building your gratitude reservoir",
//   "What technology are you grateful for?",
//   "Gratitude turns denial into acceptance",
//   "Don't skip today's opportunity to reflect",
//   "What accomplishment made you proud?",
//   "Your practice is rewiring your brain for happiness",
//   "Even difficult people teach us valuable lessons",
// ];

// const EVENING_MESSAGES = [
//   "Before the day ends — write one thing you're grateful for 🌙",
//   "Don’t break your gratitude streak tonight ✨",
//   "The day isn’t over yet — add today’s gratitude",
//   "A small reflection tonight can change your mood 💭",
// ];

// /* ======================================================
//    DATE HELPERS
// ====================================================== */

// const normalizeDate = (d) => {
//   const x = new Date(d);
//   x.setHours(0, 0, 0, 0);
//   return x;
// };

// const startOfToday = () => {
//   const d = new Date();
//   d.setHours(0, 0, 0, 0);
//   return d;
// };

// const startOfYesterday = () => {
//   const d = startOfToday();
//   d.setDate(d.getDate() - 1);
//   return d;
// };

// const pickRandom = (arr) =>
//   arr[Math.floor(Math.random() * arr.length)];

// /* ======================================================
//    TOKEN HELPER
// ====================================================== */

// const extractTokens = (users) =>
//   users
//     .flatMap((u) =>
//       Array.isArray(u.fcmToken) ? u.fcmToken : [u.fcmToken]
//     )
//     .filter(Boolean);

// /* ======================================================
//    CRON 1 — MORNING MOTIVATION (8 AM)
// ====================================================== */

// export const runMorningJob = async () => {
//   try {
//     const users = await User.find({ fcmToken: { $ne: null } });
//     const tokens = extractTokens(users);

//     if (!tokens.length) return;

//     await admin.messaging().sendMulticast({
//       tokens,
//       notification: {
//         title: "MyThanks",
//         body: pickRandom(MORNING_MESSAGES),
//       },
//     });

//     console.log("🌅 Morning notifications sent");
//   } catch (err) {
//     console.error("❌ Morning job error:", err);
//   }
// };

// /* ======================================================
//    CRON 2 — EVENING REMINDER (9 PM)
// ====================================================== */

// export const runEveningReminderJob = async () => {
//   try {
//     const today = startOfToday();
//     const users = await User.find({ fcmToken: { $ne: null } });

//     const reminderUsers = users.filter((user) => {
//       if (!user.lastEntryDate) return true;
//       const last = normalizeDate(user.lastEntryDate);
//       return last.getTime() !== today.getTime();
//     });

//     const tokens = extractTokens(reminderUsers);
//     if (!tokens.length) return;

//     await admin.messaging().sendMulticast({
//       tokens,
//       notification: {
//         title: "MyThanks reminder",
//         body: pickRandom(EVENING_MESSAGES),
//       },
//     });

//     console.log("🌙 Evening reminders sent");
//   } catch (err) {
//     console.error("❌ Evening reminder error:", err);
//   }
// };

// /* ======================================================
//    CRON 3 — STREAK RESET (12:05 AM)
// ====================================================== */

// export const runStreakResetJob = async () => {
//   try {
//     const yesterday = startOfYesterday();
//     const users = await User.find();

//     for (const user of users) {
//       if (!user.lastEntryDate) continue;

//       const last = normalizeDate(user.lastEntryDate);

//       if (last.getTime() < yesterday.getTime()) {
//         if (user.streak !== 0) {
//           user.streak = 0;
//           user.lastEntryDate = null;
//           await user.save();
//           console.log(`🔁 Streak reset for ${user.username}`);
//         }
//       }
//     }
//   } catch (err) {
//     console.error("❌ Streak reset job error:", err);
//   }
// };

// /* ======================================================
//    START ALL CRON JOBS
// ====================================================== */

// export const startDailyJob = () => {
//   if (global._dailyGratitudeJobsStarted) {
//     console.log("⏰ Cron jobs already running");
//     return;
//   }
//   global._dailyGratitudeJobsStarted = true;

//   // ⏰ TIMES ARE SERVER TIME (Render = UTC)
//   cron.schedule("0 8 * * *", runMorningJob);          // 8:00 AM
//   cron.schedule("0 21 * * *", runEveningReminderJob); // 9:00 PM
//   cron.schedule("5 0 * * *", runStreakResetJob);      // 12:05 AM

//   console.log("⏰ All daily cron jobs scheduled");
// };

// export default {
//   startDailyJob,
//   runMorningJob,
//   runEveningReminderJob,
//   runStreakResetJob,
// };
// utils/streakCalculator.js
import Entry from "../models/Entry.js";

/**
 * Timezone-safe, backend-safe, cron-safe streak calculator.
 * Works even if server timezone changes.
 */
export const calculateConsecutiveStreak = async (userId) => {
  const entries = await Entry.find({ user: userId })
    .select("date")
    .sort({ date: -1 }); // YYYY-MM-DD DESC (string-safe)

  if (!entries.length) return 0;

  const uniqueDates = [...new Set(entries.map(e => e.date))];

  let streak = 1;

  for (let i = 0; i < uniqueDates.length - 1; i++) {
    const today = uniqueDates[i];
    const prev = uniqueDates[i + 1];

    // convert YYYY-MM-DD → day number (no timezone)
    const [y1, m1, d1] = today.split("-").map(Number);
    const [y2, m2, d2] = prev.split("-").map(Number);

    const dayIndex1 = Date.UTC(y1, m1 - 1, d1) / 86400000;
    const dayIndex2 = Date.UTC(y2, m2 - 1, d2) / 86400000;

    if (dayIndex1 - dayIndex2 === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
};
