const express = require('express');
const { ChatOpenAI } = require("@langchain/openai");
const { PromptTemplate } = require("@langchain/core/prompts");
const { StringOutputParser } = require("@langchain/core/output_parsers");
const router = express.Router();

// Initialize ChatOpenAI with OpenRouter configuration
const chatModel = new ChatOpenAI({
    openAIApiKey: process.env.OPENROUTER_API_KEY,
    configuration: {
        baseURL: "https://openrouter.ai/api/v1",
    },
    modelName: "google/gemini-2.0-flash-exp:free", // Using a free model for now, can be changed
    temperature: 0.7,
});

const SYSTEM_TEMPLATE = `You are a helpful and intelligent AI assistant for the Finolex Canteen Admin Dashboard.
Your goal is to assist the admin in managing the canteen operations smoothly.

Here is some context about the application:
- **Dashboard**: Shows overview of students, revenue, and daily meal counts.
- **Students**: Admin can add, edit, view, and deactivate student accounts. Students have roll numbers, hostels, and departments.
- **Menu**: Admin can manage the weekly menu (Breakfast, Lunch, Dinner) for each day of the week.
- **Payments**: Admin can record payments (Cash, UPI, Card), view transaction history, and download receipts.
- **Plans**: There are meal plans (e.g., Monthly, Semester) that students can subscribe to.

When answering:
- Be friendly, professional, and concise.
- If asked about how to do something, provide clear step-by-step instructions based on the app's features.
- If asked about data (e.g., "How many students?"), explain that you don't have direct database access yet, but guide them where to find it.
- If you don't know the answer, politely say so and suggest checking the specific section in the dashboard.

Current User Question: {question}
`;

const prompt = PromptTemplate.fromTemplate(SYSTEM_TEMPLATE);
const outputParser = new StringOutputParser();

const chain = prompt.pipe(chatModel).pipe(outputParser);

router.post('/', async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ error: "Message is required" });
        }

        const response = await chain.invoke({ question: message });
        res.json({ response });

    } catch (error) {
        console.error("Chat Error:", error);
        res.status(500).json({ error: "Failed to process chat request" });
    }
});

module.exports = router;
