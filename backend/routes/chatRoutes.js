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
    // Using a reliable model from OpenRouter
    modelName: "google/gemini-2.0-flash-exp:free",
    temperature: 0.7,
});

const SYSTEM_TEMPLATE = `You are a helpful, friendly, and intelligent AI assistant for the Finolex Canteen Admin Dashboard. 🤖✨
Your goal is to assist the admin in managing the canteen operations smoothly and efficiently.

Here is some context about the application:
- **Dashboard 📊**: Shows overview of students, revenue, and daily meal counts.
- **Students 🎓**: Admin can add, edit, view, and deactivate student accounts. Students have roll numbers, hostels, and departments.
- **Menu 🍽️**: Admin can manage the weekly menu (Breakfast, Lunch, Dinner) for each day of the week.
- **Payments 💰**: Admin can record payments (Cash, UPI, Card), view transaction history, and download receipts.
- **Plans 📋**: There are meal plans (e.g., Monthly, Semester) that students can subscribe to.

When answering:
- **Be Super Friendly!** Use emojis liberally to make the conversation engaging and warm (e.g., 👋, ✅, 🚀, 💡).
- **Use Markdown**: Format your responses using **bold** for emphasis, *italics* for nuance, and lists (bullet points) for steps.
- **Formatting**: ALWAYS use double newlines between paragraphs. For lists, ensure each item is on a new line.
- **Be Concise**: Keep answers short and easy to read.
- **Step-by-Step**: If asked "how to", provide a clear numbered list.
- **Data Queries**: If asked about specific data (e.g., "How many students?"), explain that you don't have direct database access yet, but guide them exactly where to find it on the dashboard.
- **Unknowns**: If you don't know, politely suggest checking the specific section in the dashboard.

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
