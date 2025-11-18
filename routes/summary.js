import express from "express";
import { generateSummary, getSummary, getAvailableMonths } from "../controllers/summaryController.js";

const router = express.Router();

router.post("/generate", generateSummary);
router.get("/:deviceId/:month", getSummary);
router.get("/months/:deviceId", getAvailableMonths);

export default router;