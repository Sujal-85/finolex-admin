require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log('Connected to MongoDB');
        try {
            const users = await User.find({});
            console.log('All users:', users.map(u => u.email));

            const user = await User.findOne({ email: 'admin@gmail.com' });
            if (user) {
                user.password = 'admin123';
                await user.save();
                console.log('Password for admin@gmail.com reset to: admin123');
            } else {
                console.log('User admin@gmail.com not found. Trying case-insensitive search...');
                const user2 = await User.findOne({ email: { $regex: new RegExp('^admin@gmail.com$', 'i') } });
                if (user2) {
                    user2.password = 'admin123';
                    await user2.save();
                    console.log(`Password for ${user2.email} reset to: admin123`);
                } else {
                    console.log('Still not found.');
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            mongoose.connection.close();
        }
    })
    .catch(err => console.error(err));
