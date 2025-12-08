require('dotenv').config();
const mongoose = require('mongoose');
const Student = require('./models/Student');

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const studentsWithPic = await Student.find({ profilePicture: { $exists: true, $ne: "" } });

        console.log(`Found ${studentsWithPic.length} students with profile pictures.`);
        studentsWithPic.forEach(s => {
            console.log(`- ${s.name}: ${s.profilePicture}`);
        });

        if (studentsWithPic.length === 0) {
            console.log("No students have a profile picture set.");
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
