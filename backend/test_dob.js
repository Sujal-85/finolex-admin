const mongoose = require('mongoose');
require('dotenv').config();
const Student = require('./models/Student');

const testDOB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const testEmail = `test_dob_${Date.now()}@example.com`;
        const testDate = '2005-01-21';

        console.log('Creating student with dob:', testDate);
        const newStudent = new Student({
            name: 'Test DOB Student',
            email: testEmail,
            department: 'Test',
            year: 'First',
            dob: testDate,
            password: 'password123',
            status: 'Active'
        });

        await newStudent.save();
        console.log('Student saved.');

        const fetchedStudent = await Student.findById(newStudent._id);
        console.log('Fetched Student DOB:', fetchedStudent.dob);

        if (fetchedStudent.dob) {
            console.log('Verification: SUCCESS');
        } else {
            console.log('Verification: FAILED - DOB missing');
        }

        // Cleanup
        await Student.findByIdAndDelete(newStudent._id);
        console.log('Cleanup done.');

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

testDOB();
