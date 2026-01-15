const express = require('express');
const router = express.Router();

// --- LOCAL PARSERS ---

// Helper to parse date
function parseDate(text) {
    const today = new Date();
    const lower = text.toLowerCase();
    if (lower.includes('tomorrow')) {
        const d = new Date(today);
        d.setDate(d.getDate() + 1);
        return d.toISOString().split('T')[0];
    }
    // Simple YYYY-MM-DD match
    const dateMatch = text.match(/\d{4}-\d{2}-\d{2}/);
    if (dateMatch) return dateMatch[0];

    return today.toISOString().split('T')[0]; // Default to today
}

// Helper to parse time
function parseTime(text) {
    const timeMatch = text.match(/([01]?[0-9]|2[0-3]):[0-5][0-9]/);
    if (timeMatch) return timeMatch[0];
    return "13:00"; // Default lunch time
}

// Helper to parse order
function parseOrderLocally(prompt) {
    const lower = prompt.toLowerCase();

    // Detect event type
    let eventType = 'Guest';
    if (lower.includes('exam')) eventType = 'Exam';
    else if (lower.includes('function') || lower.includes('party')) eventType = 'Function';

    // Detect Dept
    let department = 'General';
    if (lower.includes('it') || lower.includes('computer')) department = 'Information Technology';
    else if (lower.includes('mech')) department = 'Mechanical';
    else if (lower.includes('civil')) department = 'Civil';
    else if (lower.includes('entc')) department = 'E&TC';

    // Detect Service
    let serviceType = 'Lunch';
    if (lower.includes('snack') || lower.includes('breakfast') || lower.includes('tea')) serviceType = 'Snacks';
    if (lower.includes('dinner')) serviceType = 'Dinner';

    // Detect Persons
    let numberOfPersons = 1;
    const numMatch = lower.match(/(\d+)\s*(people|persons|pax|guests)/);
    if (numMatch) {
        numberOfPersons = parseInt(numMatch[1]);
    }

    return {
        eventName: 'Canteen Order',
        eventType,
        department,
        date: parseDate(prompt),
        time: parseTime(prompt),
        venue: 'Canteen',
        serviceType,
        numberOfPersons,
        notes: prompt
    };
}


router.post('/parse-order', async (req, res) => {
    try {
        const { prompt } = req.body;
        console.log("Received Local Parse Request:", prompt);

        if (!prompt) {
            return res.status(400).json({ message: "Prompt is required" });
        }

        const parsedOrder = parseOrderLocally(prompt);
        console.log("Parsed JSON Locally:", parsedOrder);

        // Enhance with simulated "AI" delay if needed, but instant is better
        res.json(parsedOrder);

    } catch (error) {
        console.error("Local JS Parse Error:", error);
        res.status(500).json({ message: "Failed to parse order locally." });
    }
});

router.post('/schedule-announcement', async (req, res) => {
    try {
        const { prompt } = req.body;
        if (!prompt) {
            return res.status(400).json({ message: "Prompt is required" });
        }

        // Simple echo/wrap for announcements
        // In a real "AI" replacement, we might have templates.

        const suggestion = {
            title: "Announcement",
            content: prompt, // Just use the prompt as content for now
            type: "Info",
            targetAudience: "All",
            scheduledDate: new Date(Date.now() + 60 * 60 * 1000).toISOString() // Default 1 hour from now
        };

        // Try to refine if prompt is short
        if (prompt.toLowerCase().includes('holiday')) {
            suggestion.title = "Holiday Notice";
            suggestion.type = "Info";
        } else if (prompt.toLowerCase().includes('urgent')) {
            suggestion.title = "Urgent Attention";
            suggestion.type = "Alert";
        }

        res.json(suggestion);

    } catch (error) {
        console.error("Local Schedule Error:", error);
        res.status(500).json({ message: "Failed to generate schedule locally." });
    }
});

module.exports = router;
