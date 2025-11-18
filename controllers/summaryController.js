import Summary from "../models/Summary.js";
import Entry from "../models/Entry.js";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const generateSummary = async (req, res) => {
  try {
    const { deviceId, month } = req.body;

    if (!deviceId || !month) {
      return res.status(400).json({ error: "deviceId and month are required" });
    }

    // Validate month format (YYYY-MM)
    const monthRegex = /^\d{4}-\d{2}$/;
    if (!monthRegex.test(month)) {
      return res.status(400).json({ error: "Month must be in YYYY-MM format" });
    }

    // Get entries for the specific month
    const entries = await Entry.find({ 
      deviceId,
      date: { $regex: `^${month}` } // Match dates starting with the month
    });

    if (entries.length === 0) {
      return res.status(404).json({ error: "No entries found for this month" });
    }

    // Filter and prepare text data
    const textData = entries
      .filter((e) => e.text && e.text.trim() !== "")
      .map((e) => `- ${e.text}`)
      .join("\n");

    if (!textData) {
      return res.status(400).json({ error: "No text content found for summary" });
    }

    // Enhanced prompt for better summaries
    const prompt = `
      Create a warm, reflective monthly gratitude summary based on these journal entries. 
      The summary should be uplifting, personal, and highlight recurring themes or special moments.
      Write it in first person as if the person is reflecting on their month.
      
      Journal Entries:
      ${textData}
      
      Please provide a thoughtful summary that captures the essence of their gratitude journey this month and keep it short and sharp in 1 paragraph.
    `;

    const response = await openai.responses.create({
      model: "gpt-4o-mini",
      input: prompt,
    });

    const summaryText = response.output[0].content[0].text;

    // Save or update summary (using upsert to handle duplicates)
    const summary = await Summary.findOneAndUpdate(
      { deviceId, month },
      { summaryText },
      { upsert: true, new: true, runValidators: true }
    );

    res.json({
      success: true,
      summary: summaryText,
      month: month,
      entriesCount: entries.length
    });

  } catch (error) {
    console.error("Summary generation error:", error);
    
    if (error.code === 11000) {
      return res.status(409).json({ error: "Summary already exists for this month" });
    }
    
    res.status(500).json({ 
      error: "Failed to generate summary",
      details: error.message 
    });
  }
};

export const getSummary = async (req, res) => {
  try {
    const { deviceId, month } = req.params;

    if (!deviceId || !month) {
      return res.status(400).json({ error: "deviceId and month are required" });
    }

    const summary = await Summary.findOne({ deviceId, month });

    if (!summary) {
      return res.status(404).json({ 
        message: "No summary found for this month. Generate one first!",
        hasSummary: false
      });
    }

    res.json({
      success: true,
      summary: summary.summaryText,
      month: summary.month,
      createdAt: summary.createdAt,
      hasSummary: true
    });

  } catch (error) {
    console.error("Get summary error:", error);
    res.status(500).json({ error: "Failed to fetch summary" });
  }
};

export const getAvailableMonths = async (req, res) => {
  try {
    const { deviceId } = req.params;

    if (!deviceId) {
      return res.status(400).json({ error: "deviceId is required" });
    }

    // Get distinct months from entries
    const monthsWithEntries = await Entry.distinct("date", { deviceId });
    const uniqueMonths = [...new Set(monthsWithEntries.map(date => date.substring(0, 7)))].sort().reverse();

    // Get months that already have summaries
    const summaries = await Summary.find({ deviceId }).select("month");
    const monthsWithSummaries = summaries.map(s => s.month);

    res.json({
      success: true,
      availableMonths: uniqueMonths,
      monthsWithSummaries: monthsWithSummaries
    });

  } catch (error) {
    console.error("Get available months error:", error);
    res.status(500).json({ error: "Failed to fetch available months" });
  }
};