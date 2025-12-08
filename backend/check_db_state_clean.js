const mongoose = require('mongoose');
require('dotenv').config();
const Student = require('./models/Student');
const Plan = require('./models/Plan');

const checkState = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        const plans = await Plan.find();
        console.log('--- PLANS ---');
        plans.forEach(p => console.log(`Name: "${p.name}", Price: ${p.price}`));

        const students = await Student.find().limit(3);
        console.log('--- STUDENTS ---');
        students.forEach(s => console.log(`Name: ${s.name}, CurrentPlan: "${s.currentPlan}"`));

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkState();
