require("dotenv").config();

const express = require("express");
const path = require("path");
const cors = require("cors");
const { YoutubeTranscript } = require("youtube-transcript");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();

const genAI = new GoogleGenerativeAI(
    process.env.GEMINI_API_KEY
);

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));

function getVideoId(url) {

    try {

        const parsedUrl = new URL(url);

        if (parsedUrl.pathname.includes("/shorts/")) {
            return parsedUrl.pathname.split("/shorts/")[1];
        }

        if (parsedUrl.hostname === "youtu.be") {
            return parsedUrl.pathname.substring(1);
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

        const transcript =
            await YoutubeTranscript.fetchTranscript(videoId);

        const transcriptText = transcript
            .map(item => item.text)
            .join(" ");

        if (!transcriptText) {
            return res.status(400).json({
                success: false,
                message: "No transcript found for this video."
            });
        }

        const limitedTranscript =
            transcriptText.substring(0, 15000);

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash"
        });

        const prompt = `
Analyze this YouTube transcript.

Return ONLY valid JSON.

{
  "summary": "Detailed summary here",
  "topics": [
    "Topic 1",
    "Topic 2",
    "Topic 3"
  ],
  "explanation": "Detailed explanation here"
}

Transcript:
${limitedTranscript}
`;

        const result =
            await model.generateContent(prompt);

        let responseText =
            result.response.text();

        responseText = responseText
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();

        console.log("Gemini Response:");
        console.log(responseText);

        let parsedData;

        try {

            parsedData = JSON.parse(responseText);

        } catch {

            parsedData = {
                summary: responseText,
                topics: ["AI generated topics unavailable"],
                explanation: responseText
            };
        }

        if (!Array.isArray(parsedData.topics)) {

            parsedData.topics = [
                String(parsedData.topics || "General Topic")
            ];
        }

        res.json({
            success: true,
            summary: parsedData.summary,
            topics: parsedData.topics,
            explanation: parsedData.explanation
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

});

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});