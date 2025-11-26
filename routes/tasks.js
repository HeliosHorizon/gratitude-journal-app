// // routes/tasks.js (or in your main server file)
// import express from "express";
// import { runDailyJobOnce  } from "../utils/dailyNotificationJob.js";
// const router = express.Router();

// const SECRET = process.env.TASK_SECRET || "replace_me";

// // POST /tasks/run-daily?secret=...
// router.post("/run-daily", async (req, res) => {
//   try {
//     const token = req.query.secret || req.headers["x-task-secret"];
//     if (!token || token !== SECRET) {
//       return res.status(401).json({ ok: false, message: "Unauthorized" });
//     }

//     // call a function that runs the job once (not the cron-scheduled wrapper)
//     await runDailyJobOnce();
//     return res.json({ ok: true, message: "Triggered daily job" });
//   } catch (err) {
//     console.error("Trigger endpoint error:", err);
//     return res.status(500).json({ ok: false, error: err.message });
//   }
// });

// export default router;
