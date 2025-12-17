// routes/summary.js
import express from "express";
import { generateSummary, getSummary } from "../controllers/summaryController.js";
import { authMiddleware } from "../utils/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/:month", getSummary);
router.post("/generate", generateSummary);

export default router;
