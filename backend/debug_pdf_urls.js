require('dotenv').config();
const mongoose = require('mongoose');
const Plan = require('./models/Plan');

async function debugUrls() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const plans = await Plan.find({ rebatePdfUrl: { $exists: true, $ne: null } });

        if (plans.length === 0) {
            console.log('No plans with Rebate PDF URLs found.');
        } else {
            console.log(`Found ${plans.length} plans with PDF URLs:`);
            plans.forEach(plan => {
                console.log(`- Plan: ${plan.name}`);
                console.log(`  URL: ${plan.rebatePdfUrl}`);
            });
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error('Debug failed:', error);
    }
}

debugUrls();
