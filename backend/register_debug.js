require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log('Connected to MongoDB');

        try {
            console.log('Attempting to create admin@gmail.com...');
            const user = new User({
                name: 'Admin User',
                email: 'admin@gmail.com',
                password: 'password123',
                role: 'admin'
            });
            await user.save();
            console.log('SUCCESS: User created!');
        } catch (err) {
            console.log('FAILURE: Could not create user.');
            if (err.code === 11000) {
                console.log('REASON: Duplicate Key Error (Email already exists).');
                console.log('Key Pattern:', err.keyPattern);
                console.log('Key Value:', err.keyValue);
            } else {
                console.error(err);
            }
        } finally {
            mongoose.connection.close();
        }
    })
    .catch(err => console.error(err));
