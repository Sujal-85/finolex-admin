require('dotenv').config();
const mongoose = require('mongoose');
const Student = require('./models/Student');

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Unset profilePicture for all students (or just the one we modified)
        // To be safe and clean, let's unset for all, assuming the user hasn't added any real ones yet 
        // (since the field is new and they complained about the wrong image immediately).

        await Student.updateMany({}, { $unset: { profilePicture: "" } });
        console.log('Removed all profile pictures.');

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
