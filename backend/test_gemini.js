require('dotenv').config();
const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");

async function main() {
    const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    console.log("API Key loaded:", key ? "Yes (" + key.substring(0, 4) + "...)" : "No");

    if (!key) {
        console.error("Error: No API Key found in .env");
        return;
    }

    const modelsToTry = ["gemini-1.5-flash", "gemini-pro", "gemini-1.0-pro"];

    for (const modelName of modelsToTry) {
        console.log(`\nTesting model: ${modelName}...`);
        try {
            const chat = new ChatGoogleGenerativeAI({
                apiKey: key,
                model: modelName,
            });
            const response = await chat.invoke("Hello, are you working?");
            console.log(`SUCCESS with ${modelName}! Response:`, response.content);
            return; // Exit on first success
        } catch (error) {
            console.error(`FAILED with ${modelName}:`, error.message);
        }
    }
    console.log("\nAll models failed. Please check your API Key permissions or Region availability.");
}

main();
