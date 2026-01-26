require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log('Connected to MongoDB');
        try {
            const email = 'admin@gmail.com';
            const existing = await User.findOne({ email });

            if (existing) {
                console.log('User already exists. Updating password...');
                existing.password = 'admin123';
                await existing.save();
                console.log('Password updated.');
            } else {
                console.log('Creating new admin user...');
                const newUser = new User({
                    name: 'Admin',
                    email: email,
                    password: 'admin123',
                    role: 'admin'
                });
                await newUser.save();
                console.log(`User ${email} created with password: admin123`);
            }
        } catch (err) {
            console.error(err);
        } finally {
            mongoose.connection.close();
        }
    })
    .catch(err => console.error(err));
