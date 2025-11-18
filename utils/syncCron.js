import cron from "node-cron";
import axios from "axios";
import Entry from "../models/Entry.js";
import dotenv from "dotenv";

dotenv.config();

// Replace this with your local device sync endpoint if needed
const FRONTEND_SYNC_URL = process.env.FRONTEND_SYNC_URL || "http://192.168.1.86:5000/api/sync"; 

// Function to sync entries from frontend
const syncEntriesFromFrontend = async () => {
  try {
    console.log("🕛 Daily Sync started...");

    // Get data from frontend (you’ll make a small endpoint on frontend to expose AsyncStorage data)
    const { data: entries } = await axios.get(FRONTEND_SYNC_URL);

    if (!entries || entries.length === 0) {
      console.log("ℹ️ No entries from frontend to sync.");
      return;
    }

    for (const entry of entries) {
      const exists = await Entry.findOne({
        deviceId: entry.deviceId,
        date: entry.date,
      });

      if (!exists) {
        await Entry.create(entry);
        console.log(`✅ Synced entry for ${entry.date} (${entry.deviceId})`);
      } else {
        console.log(`⚠️ Skipped duplicate entry for ${entry.date}`);
      }
    }

    console.log("✅ Daily Sync completed successfully.");
  } catch (error) {
    console.error("❌ Daily Sync failed:", error.message);
  }
};

// Schedule to run every day at midnight (server time)
export const startDailySync = () => {
  cron.schedule("0 0 * * *", syncEntriesFromFrontend);
  console.log("🕓 Daily Sync cron job scheduled (midnight every day)");
};
