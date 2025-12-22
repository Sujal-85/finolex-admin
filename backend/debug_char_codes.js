require('dotenv').config();
const mongoose = require('mongoose');
const Plan = require('./models/Plan');
const fs = require('fs');

async function debug() {
    await mongoose.connect(process.env.MONGODB_URI);
    const plan = await Plan.findOne({ rebatePdfUrl: { $exists: true, $ne: null } });
    if (plan) {
        const url = plan.rebatePdfUrl;
        const codes = Array.from(url).map(c => c.charCodeAt(0));
        fs.writeFileSync('url_char_codes.txt', `URL: ${url}\nCODES: ${codes.join(',')}`);
        console.log('Result written to url_char_codes.txt');
    } else {
        console.log('No plan found');
    }
    await mongoose.disconnect();
}
debug();
