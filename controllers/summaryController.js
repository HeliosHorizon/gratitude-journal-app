import Summary from "../models/Summary.js";
import Entry from "../models/Entry.js";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Helper to compute UTC month start/end
 */
function monthBoundsUTC(month) {
  const start = new Date(`${month}-01T00:00:00.000Z`);
  const next = new Date(start);
  next.setUTCMonth(next.getUTCMonth() + 1);
  const end = new Date(next.getTime() - 1);
  return { start, end };
}

/**
 * POST /api/summary/generate
 * Always generates a FRESH summary.
 * Old summary (if any) is deleted before generation.
 */
export const generateSummary = async (req, res) => {
  try {
    const { deviceId, month } = req.body;
    if (!deviceId || !month) {
      return res.status(400).json({ error: "deviceId and month are required" });
    }

    if (!/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ error: "Month must be in YYYY-MM format" });
    }

    const { start, end } = monthBoundsUTC(month);

    const dateRangeQuery = { date: { $gte: start, $lte: end } };
    const stringMonthRegexQuery = {
      date: { $type: "string", $regex: `^${month}` },
    };

    // Fetch entries
    const entries = await Entry.find({
      deviceId,
      $or: [dateRangeQuery, stringMonthRegexQuery],
    }).lean();

    if (!entries.length) {
      // 🔥 If no entries, remove any existing summary
      await Summary.deleteOne({ deviceId, month });
      return res.status(404).json({
        error: "No entries found for this month",
        entriesCount: 0,
      });
    }

    const textData = entries
      .filter((e) => e.text && e.text.trim())
      .map((e) => `- ${e.text.trim()}`)
      .join("\n");

    if (!textData) {
      await Summary.deleteOne({ deviceId, month });
      return res.status(400).json({
        error: "No text content found for summary",
        entriesCount: entries.length,
      });
    }

    // 🔥 HARD RESET: delete old summary BEFORE generation
    await Summary.deleteOne({ deviceId, month });

    const entryCount = entries.length;

    const prompt = `
You are generating a BRAND NEW monthly gratitude summary.

CRITICAL RULES:
- Ignore any previously generated summaries.
- Do NOT continue or reference past summaries.
- Base the summary ONLY on the journal entries below.

Writing rules:
- First person
- Warm, reflective, uplifting
- No bullet points, no quoting entries

Length rules:
- More than 8 entries → 1 short paragraph
- 3–8 entries → ~4–5 lines
- 1–2 entries → 1–2 lines

Journal entries (count: ${entryCount}):
${textData}

Output ONLY the summary text.
`;

    const response = await openai.responses.create({
      model: "gpt-4o-mini",
      input: prompt,
    });

    const summaryText =
      response?.output?.[0]?.content?.[0]?.text?.trim() ||
      response.output_text?.trim();

    if (!summaryText) {
      return res.status(500).json({ error: "Failed to generate summary" });
    }

    const saved = await Summary.create({
      deviceId,
      month,
      summaryText,
      entriesCountAtLastGenerate: entryCount,
      generatedAt: new Date(),
    });

    return res.status(200).json({
      success: true,
      summary: saved.summaryText,
      month,
      needsRegeneration: false,
      entriesCount: entryCount,
      generatedAt: saved.generatedAt,
    });
  } catch (error) {
    console.error("Summary generation error:", error);
    res.status(500).json({
      error: "Failed to generate summary",
      details: error.message,
    });
  }
};

/**
 * GET /api/summary/:deviceId/:month
 */
export const getSummary = async (req, res) => {
  try {
    const { deviceId, month } = req.params;
    if (!deviceId || !month) {
      return res.status(400).json({ error: "deviceId and month are required" });
    }

    if (!/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ error: "Month must be in YYYY-MM format" });
    }

    const { start, end } = monthBoundsUTC(month);

    const dateRangeQuery = { date: { $gte: start, $lte: end } };
    const stringMonthRegexQuery = {
      date: { $type: "string", $regex: `^${month}` },
    };

    const entriesCount = await Entry.countDocuments({
      deviceId,
      $or: [dateRangeQuery, stringMonthRegexQuery],
    });

    const summaryDoc = await Summary.findOne({ deviceId, month });

    return res.status(200).json({
      success: true,
      summary: summaryDoc ? summaryDoc.summaryText : null,
      hasSummary: Boolean(summaryDoc),
      needsRegeneration: entriesCount > 0,
      entriesCount,
      generatedAt: summaryDoc?.generatedAt || null,
    });
  } catch (error) {
    console.error("Get summary error:", error);
    res.status(500).json({ error: "Failed to fetch summary" });
  }
};

/**
 * GET /api/summary/months/:deviceId
 */
export const getAvailableMonths = async (req, res) => {
  try {
    const { deviceId } = req.params;
    if (!deviceId) {
      return res.status(400).json({ error: "deviceId is required" });
    }

    const monthsAgg = await Entry.aggregate([
      { $match: { deviceId } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m", date: "$date" },
          },
        },
      },
      { $sort: { _id: -1 } },
    ]);

    const availableMonths = monthsAgg.map((m) => m._id);

    return res.json({
      success: true,
      availableMonths,
    });
  } catch (error) {
    console.error("Get available months error:", error);
    res.status(500).json({ error: "Failed to fetch available months" });
  }
};
