require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const collection = mongoose.connection.collection('students');
        const student = await collection.findOne({ profileImage: { $exists: true } });

        if (student) {
            console.log('Found student with profileImage:');
            console.log('Name:', student.name);
            console.log('profileImage:', student.profileImage);
        } else {
            console.log('No students found with profileImage.');
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
