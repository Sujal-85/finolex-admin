require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const collection = mongoose.connection.collection('students');
        const student = await collection.findOne({});

        if (student) {
            console.log('Keys found:', Object.keys(student));
            // Print specific potential fields if they exist
            if (student.profileImage) console.log('profileImage:', student.profileImage);
            if (student.profilePicture) console.log('profilePicture:', student.profilePicture);
            if (student.avatar) console.log('avatar:', student.avatar);
            if (student.image) console.log('image:', student.image);
            
            // Print full object again but careful with large strings
            console.log(JSON.stringify(student, null, 2));
        } else {
            console.log('No students found.');
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
