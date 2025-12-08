require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Get the raw collection to bypass mongoose schema strictness
        const collection = mongoose.connection.collection('students');
        const student = await collection.findOne({});

        if (student) {
            console.log('Raw Student Record:');
            console.log(JSON.stringify(student, null, 2));
        } else {
            console.log('No students found in the database.');
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
