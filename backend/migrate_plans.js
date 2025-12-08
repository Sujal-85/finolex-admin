const mongoose = require('mongoose');
require('dotenv').config();
const Student = require('./models/Student');

const migrateStudents = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const result = await Student.updateMany(
            {},
            { $set: { currentPlan: 'Basic Mess Plan' } }
        );

        console.log(`Updated ${result.modifiedCount} students to Basic Mess Plan`);
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

migrateStudents();
