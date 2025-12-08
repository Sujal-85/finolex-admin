require('dotenv').config();
const mongoose = require('mongoose');
const Student = require('./models/Student');

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Find the student we used for patching
        const student = await Student.findOne();
        if (student) {
            // Set a dummy profile picture (using a placeholder service or a known URL)
            // Using a generic avatar for now
            const profilePic = "https://api.dicebear.com/7.x/avataaars/svg?seed=" + student.name.replace(/ /g, '');
            await Student.updateOne({ _id: student._id }, { $set: { profilePicture: profilePic } });
            console.log(`Updated profile picture for ${student.name}`);
        } else {
            console.log("No student found to update.");
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
