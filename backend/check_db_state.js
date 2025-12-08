const mongoose = require('mongoose');
require('dotenv').config();
const Student = require('./models/Student');
const Plan = require('./models/Plan');

const checkState = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const plans = await Plan.find();
        console.log('--- PLANS ---');
        console.log(JSON.stringify(plans, null, 2));

        const student = await Student.findOne();
        console.log('--- SAMPLE STUDENT ---');
        console.log(JSON.stringify(student, null, 2));

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkState();
