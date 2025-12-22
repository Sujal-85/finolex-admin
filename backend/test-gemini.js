require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function listModels() {
    console.log("🔍 Checking User-Suggested Models...");
    const key = process.env.GEMINI_API_KEY;
    if (!key) { console.error("❌ No API Key"); return; }

    const variants = [
        "gemini-3-pro-preview", // User suggestion
        "gemini-2.0-flash-exp",
        "gemini-1.5-flash",
        "gemini-pro"
    ];

    const genAI = new GoogleGenerativeAI(key);

    for (const modelName of variants) {
        process.stdout.write(`Testing ${modelName}... `);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent({
                contents: [{ role: "user", parts: [{ text: "Hi" }] }],
                generationConfig: { maxOutputTokens: 1 }
            });
            console.log(`✅ SUCCESS!`);
        } catch (e) {
            if (e.message.includes("404")) {
                console.log(`❌ 404 (Not Found)`);
            } else {
                console.log(`❌ Error: ${e.message.split('\n')[0]}`);
            }
        }
    }
}

listModels();
