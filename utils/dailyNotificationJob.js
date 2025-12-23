import cron from "node-cron";
import User from "../models/User.js";
import { sendViaHttpV1 } from "./fcmHttpV1.js";

/* ======================================================
   MESSAGE POOLS
====================================================== */

const MORNING_MESSAGES = [
  "Good morning ☀️ Start your day with gratitude",
  "A grateful morning sets the tone for a peaceful day",
  "What are you thankful for as today begins?",
  "Take one minute this morning to feel grateful 🌱",
  "Good morning ☀️ Start your day with gratitude",
  "A grateful morning sets the tone for a peaceful day",
  "What are you thankful for as today begins?",
  "Take one minute this morning to feel grateful 🌱",
  "Take a moment and note something you're grateful for!",
  "A small reflection today can brighten your whole day 🌟",
  "Your gratitude journal misses you ✨",
  "Pause and reflect — what made you smile today?",
  "Your gratitude streak is growing strong 💪",
  "What's one beautiful thing that happened today?",
  "Don't break the chain! Add to your gratitude streak 📝",
  "Reflect on today's blessings before they fade away",
  "Your future self will thank you for today's entry",
  "Gratitude turns what we have into enough ✨",
  "Capture today's joy before it slips away",
  "Keep your gratitude flame burning 🔥",
  "What made your heart feel light today?",
  "Notice the small things - they matter most🎉",
  "Gratitude is the best attitude to cultivate",
  "Today's memories deserve to be cherished",
  "Don't let today's blessings go unrecorded",
  "Your consistency is building something beautiful",
  "What moment today made you feel alive?",
  "Gratitude makes every day a good day",
  "Keep filling your life with thankful moments",
  "What unexpected joy did you find today?",
  "Your gratitude practice is changing your brain 🧠",
  "Even on tough days, there's always something to appreciate",
  "What made you feel supported today?",
  "Gratitude is the music of the heart 🎵",
  "Don't miss today's chance to count your blessings",
  "What made today different and special?",
  "Your consistency is creating positive patterns",
  "Even small gratitudes create big happiness",
  "What lesson are you grateful for today?",
  "Keep your gratitude momentum going!",
  "What connection are you thankful for today?",
  "Gratitude transforms ordinary days into blessings",
  "Your journal is waiting for today's story",
  "What comfort are you grateful for right now?",
  "Keep adding to your collection of happy moments",
  "What beauty did you notice in the world today?",
  "Gratitude is the heart's memory 💖",
  "Don't let today's magic go unrecorded",
  "What made you feel proud today?",
  "Your daily practice is changing your perspective",
  "Even challenges have hidden blessings",
  "What opportunity are you grateful for?",
  "What simple pleasure brightened your day?",
  "Gratitude makes sense of our past and peace for today",
  "Your consistency is your superpower 🦸",
  "What growth are you thankful for?",
  "Keep weaving gratitude into your daily life",
  "What kindness did you receive or give today?",
  "Gratitude is the sweetest thing in life",
  "Don't miss today's chance to appreciate",
  "What made you feel safe today?",
  "Your practice is making you more resilient",
  "Even ordinary moments hold extraordinary gratitude",
  "What progress are you thankful for?",
  "What made you laugh or smile today?",
  "Gratitude is the healthiest of all emotions",
  "Your dedication is building character",
  "What nature moment are you grateful for?",
  "Keep collecting moments of thankfulness",
  "What knowledge are you thankful for today?",
  "Gratitude makes life richer and deeper",
  "Don't let today's gifts go unnoticed",
  "What strength did you discover today?",
  "Your habit is creating neural pathways of positivity",
  "Even setbacks contain hidden blessings",
  "What freedom are you grateful for?",
  "What comfort are you thankful for?",
  "Gratitude is the memory of the heart",
  "Your persistence is building mental strength",
  "What conversation enriched your day?",
  "Keep building your gratitude reservoir",
  "What technology are you grateful for?",
  "Gratitude turns denial into acceptance",
  "Don't skip today's opportunity to reflect",
  "What accomplishment made you proud?",
  "Your practice is rewiring your brain for happiness",
  "Even difficult people teach us valuable lessons",
];

const EVENING_MESSAGES = [
  "Before the day ends — write one thing you're grateful for 🌙",
  "Don’t break your gratitude streak tonight ✨",
  "The day isn’t over yet — add today’s gratitude",
  "A small reflection tonight can change your mood 💭",
];

/* ======================================================
   DATE HELPERS (IST SAFE)
====================================================== */

const todayDateOnly = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const yesterdayDateOnly = () => {
  const d = todayDateOnly();
  d.setDate(d.getDate() - 1);
  return d;
};

const normalize = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const pickRandom = (arr) =>
  arr[Math.floor(Math.random() * arr.length)];

/* ======================================================
   TOKEN EXTRACTOR
====================================================== */

const extractTokens = (users) =>
  users
    .flatMap((u) =>
      Array.isArray(u.fcmToken) ? u.fcmToken : [u.fcmToken]
    )
    .filter(Boolean);

/* ======================================================
   CRON 1 — MORNING MOTIVATION (8 AM)
====================================================== */

export const runMorningJob = async () => {
  try {
    const users = await User.find({ fcmToken: { $ne: null } }).lean();
    const tokens = extractTokens(users);

    if (!tokens.length) return;

    await sendViaHttpV1(
      tokens,
      "MyThanks",
      pickRandom(MORNING_MESSAGES)
    );

    console.log("🌅 Morning notifications sent");
  } catch (err) {
    console.error("❌ Morning job error:", err);
  }
};

/* ======================================================
   CRON 2 — EVENING REMINDER (9 PM) ✅ FIXED
====================================================== */

export const runEveningReminderJob = async () => {
  try {
    // Today in YYYY-MM-DD (IST-safe)
    const todayStr = new Date().toISOString().slice(0, 10);

    const users = await User.find({ fcmToken: { $ne: null } }).lean();

    const reminderUsers = users.filter((u) => {
      // Never added any entry
      if (!u.lastEntryDate) return true;

      // lastEntryDate is already YYYY-MM-DD
      return u.lastEntryDate !== todayStr;
    });

    const tokens = extractTokens(reminderUsers);
    if (!tokens.length) {
      console.log("🌙 Evening reminder: no eligible users");
      return;
    }

    await sendViaHttpV1(
      tokens,
      "MyThanks reminder",
      pickRandom(EVENING_MESSAGES)
    );

    console.log(`🌙 Evening reminders sent to ${tokens.length} users`);
  } catch (err) {
    console.error("❌ Evening reminder error:", err);
  }
};


/* ======================================================
   CRON 3 — STREAK RESET (12:05 AM)
====================================================== */

export const runStreakResetJob = async () => {
  try {
    const yesterday = yesterdayDateOnly();
    const users = await User.find();

    for (const user of users) {
      if (!user.lastEntryDate) continue;

      const last = normalize(user.lastEntryDate);

      if (last < yesterday) {
        if (user.streak !== 0) {
          user.streak = 0;
          user.lastEntryDate = null;
          await user.save();
          console.log(`🔁 Streak reset for ${user.username}`);
        }
      }
    }
  } catch (err) {
    console.error("❌ Streak reset job error:", err);
  }
};

/* ======================================================
   MANUAL TRIGGER (USED BY /tasks/run-daily)
====================================================== */

export const runDailyJobOnce = async () => {
  await runMorningJob();
  await runEveningReminderJob();
  await runStreakResetJob();
};

/* ======================================================
   START ALL CRONS
====================================================== */

export const startDailyJob = () => {
  if (global._dailyGratitudeJobsStarted) return;
  global._dailyGratitudeJobsStarted = true;

  // Render runs in UTC → adjust if needed later
  cron.schedule("30 2 * * *", runMorningJob);          // 8:00 AM ITC
  cron.schedule("30 15 * * *", runEveningReminderJob); // 9:00 PM ITC
  cron.schedule("35 18 * * *", runStreakResetJob);      // 12:05 AM ITC

  console.log("⏰ All daily cron jobs scheduled");
};

export default {
  startDailyJob,
  runMorningJob,
  runEveningReminderJob,
  runStreakResetJob,
  runDailyJobOnce,
};
