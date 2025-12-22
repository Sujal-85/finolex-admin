require('dotenv').config();
const mongoose = require('mongoose');
const Plan = require('./models/Plan');

async function debug() {
    await mongoose.connect(process.env.MONGODB_URI);
    const plan = await Plan.findOne({ rebatePdfUrl: { $exists: true, $ne: null } });
    if (plan) {
        console.log('--- URL DETAILS ---');
        console.log('RAW URL:', plan.rebatePdfUrl);
        console.log('LENGTH:', plan.rebatePdfUrl.length);
        console.log('CHAR CODES:', Array.from(plan.rebatePdfUrl).map(c => c.charCodeAt(0)).join(','));
        console.log('-------------------');
    } else {
        console.log('No plan found with a PDF URL');
    }
    await mongoose.disconnect();
}
debug();
