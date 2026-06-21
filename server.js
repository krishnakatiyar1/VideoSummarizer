require("dotenv").config();

const express = require("express");
const path = require("path");
const cors = require("cors");
const { YoutubeTranscript } = require("youtube-transcript");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();

const PORT = process.env.PORT || 3000;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function getVideoId(url) {
    try {
        const parsedUrl = new URL(url);

        if (parsedUrl.hostname === "youtu.be") {
            return parsedUrl.pathname.slice(1);
        }

        if (parsedUrl.pathname.includes("/shorts/")) {
            return parsedUrl.pathname.split("/shorts/")[1];
        }

        return parsedUrl.searchParams.get("v");
    } catch {
        return null;
    }
}

app.post("/api/summarize", async (req, res) => {
    try {
        const { url } = req.body;

        if (!url) {
            return res.status(400).json({
                success: false,
                message: "YouTube URL is required"
            });
        }

        const videoId = getVideoId(url);

        if (!videoId) {
            return res.status(400).json({
                success: false,
                message: "Invalid YouTube URL"
            });
        }

        console.log("Fetching transcript...");

        const transcript = await YoutubeTranscript.fetchTranscript(videoId);

        const transcriptText = transcript.map(t => t.text).join(" ");

        if (!transcriptText) {
            return res.status(400).json({
                success: false,
                message: "No transcript found"
            });
        }

        const limitedTranscript = transcriptText.slice(0, 15000);

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash"
        });

        const prompt = `
Return ONLY valid JSON.

{
  "summary": "...",
  "topics": ["..."],
  "explanation": "..."
}

Transcript:
${limitedTranscript}
`;

        const result = await model.generateContent(prompt);

        let text = result.response.text();

        text = text.replace(/```json/g, "").replace(/```/g, "").trim();

        let data;

        try {
            data = JSON.parse(text);
        } catch {
            data = {
                summary: text,
                topics: ["General"],
                explanation: text
            };
        }

        if (!Array.isArray(data.topics)) {
            data.topics = [String(data.topics || "General")];
        }

        return res.json({
            success: true,
            summary: data.summary,
            topics: data.topics,
            explanation: data.explanation
        });

    } catch (err) {
        console.error("API ERROR:", err);

        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
});

app.get("/health", (req, res) => {
    res.json({ status: "ok" });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});