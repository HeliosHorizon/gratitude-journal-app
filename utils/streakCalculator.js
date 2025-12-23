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
