require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log('Connected to MongoDB');
        try {
            const targetEmail = 'manager@gmail.com';
            console.log(`\nChecking for ${targetEmail}...`);

            const user = await User.findOne({ email: targetEmail });
            if (user) console.log(`[USER FOUND] ${user.name} (${user.email}) role: ${user.role}`);
            else console.log('[USER NOT FOUND]');

            const student = await require('./models/Student').findOne({ email: targetEmail });
            if (student) console.log(`[STUDENT FOUND] ${student.name} (${student.email})`);
            else console.log('[STUDENT NOT FOUND]');

        } catch (err) {
            console.error(err);
        } finally {
            mongoose.connection.close();
        }
    })
    .catch(err => {
        console.error('Connection Error:', err);
    });
