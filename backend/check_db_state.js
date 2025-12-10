const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });
const Student = require('./models/Student');
const Plan = require('./models/Plan');

const checkState = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const students = await Student.find({}, 'name birthday email').limit(5);
        console.log('--- STUDENTS (Name, Birthday, Email) ---');
        console.log(JSON.stringify(students, null, 2));

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkState();
