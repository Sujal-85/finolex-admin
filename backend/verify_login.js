require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log('Connected to MongoDB');
        try {
            const email = 'admin@gmail.com';
            const password = 'admin123';

            console.log(`Attempting login for ${email} with password ${password}`);

            const user = await User.findOne({ email });

            if (!user) {
                console.log('❌ User not found');
            } else {
                console.log('✅ User found:', user.role);
                console.log('Hashed Password in DB:', user.password);

                const isMatch = await user.comparePassword(password);
                if (isMatch) {
                    console.log('✅ Password Match! Login logic is correct.');
                } else {
                    console.log('❌ Password Mismatch!');
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            mongoose.connection.close();
        }
    })
    .catch(err => console.error(err));
