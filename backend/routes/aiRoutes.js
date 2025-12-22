const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");

router.post('/parse-order', async (req, res) => {
    try {
        if (!process.env.GEMINI_API_KEY) {
            console.error("GEMINI_API_KEY is missing in backend environment.");
            return res.status(500).json({ message: "Server Error: GEMINI_API_KEY is not configured." });
        }

        const { prompt } = req.body;
        console.log("Received AI Prompt:", prompt);

        if (!prompt) {
            return res.status(400).json({ message: "Prompt is required" });
        }

        // Initialize with Official SDK
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        // Using user-specified model which was validated to work
        const model = genAI.getGenerativeModel({ model: "gemini-3-pro-preview" });

        const systemPrompt = `
        You are an intelligent assistant for a Canteen Management System.
        Your task is to extract order details from natural language text and return them as a JSON object.

        Target Schema (JSON only):
        {
            "eventName": "string (default: 'Canteen Order')",
            "eventType": "string (options: 'Guest', 'Function', 'Exam'. Default: 'Guest')",
            "department": "string (infer from text, e.g. 'IT', 'Comp', 'Mech')",
            "date": "string (YYYY-MM-DD format. If 'today', use today's date. If 'tomorrow', use tomorrow's date. If day name 'Friday', find next coming Friday)",
            "time": "string (HH:mm format, 24hr)",
            "venue": "string (default: 'Canteen')",
            "serviceType": "string (options: 'Lunch', 'Snacks', 'Both'. Default: 'Lunch')",
            "numberOfPersons": "number (default: 1)",
            "notes": "string (any extra details)"
        }

        Current Date: ${new Date().toISOString().split('T')[0]}

        Rules:
        1. Return ONLY the JSON object. No markdown formatting.
        2. Infer missing details reasonably.
        3. If specific details aren't provided, use defaults.
        `;

        const fullPrompt = `${systemPrompt}\n\nUser Prompt: ${prompt}`;

        const result = await model.generateContent(fullPrompt);
        const responseText = result.response.text();

        console.log("Raw AI Response:", responseText);

        let cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsedOrder = JSON.parse(cleanJson);

        console.log("Parsed JSON:", parsedOrder);
        res.json(parsedOrder);

    } catch (error) {
        console.error("AI Parse Error:", error);
        res.status(500).json({ message: "Failed to parse order. " + (error.message || "Unknown error") });
    }
});

router.post('/schedule-announcement', async (req, res) => {
    try {
        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ message: "GEMINI_API_KEY is not configured." });
        }

        const { prompt } = req.body;
        if (!prompt) {
            return res.status(400).json({ message: "Prompt is required" });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        // Using a reliable model
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const systemPrompt = `
        You are a smart assistant for a Canteen Management System.
        Your task is to take a user's intent to schedule an announcement and return a structured JSON object.

        Target Schema (JSON only):
        {
            "title": "string (concise and catchy)",
            "content": "string (detailed but professional announcement text)",
            "type": "string (options: 'Info', 'Warning', 'Success', 'Alert')",
            "targetAudience": "string (options: 'All', 'Students', 'hostel-a', 'hostel-b', 'hostel-c')",
            "scheduledDate": "string (ISO 8601 format. If user says 'tomorrow morning', pick 9 AM tomorrow. If 'Friday evening', pick 6 PM Friday. Default to 1 hour from now if not specified)"
        }

        Current Time: ${new Date().toISOString()}

        Rules:
        1. Return ONLY the JSON object. No markdown.
        2. Make the announcement text engaging for students.
        3. Infer the best audience and type based on the context.
        `;

        const fullPrompt = `${systemPrompt}\n\nUser Request: ${prompt}`;

        const result = await model.generateContent(fullPrompt);
        const responseText = result.response.text();

        let cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const suggestion = JSON.parse(cleanJson);

        res.json(suggestion);

    } catch (error) {
        console.error("AI Schedule Error:", error);
        res.status(500).json({ message: "AI failed to generate schedule. " + (error.message || "Unknown error") });
    }
});

module.exports = router;
