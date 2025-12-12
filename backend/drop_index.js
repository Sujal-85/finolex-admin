require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log('Connected to MongoDB');
        try {
            const collection = mongoose.connection.collection('users');
            const indexes = await collection.indexes();
            console.log('Current Indexes:', JSON.stringify(indexes, null, 2));

            // Check for any unique index besides _id and email
            indexes.forEach(idx => {
                if (idx.unique && idx.key.email !== 1 && idx.key._id !== 1) {
                    console.log('Suspect Unique Index:', idx);
                }
            });
            const usernameIndex = indexes.find(idx => idx.key.username === 1);
            if (usernameIndex) {
                console.log('Found obsolete index on username. Dropping it...');
                await collection.dropIndex(usernameIndex.name);
                console.log('SUCCESS: Dropped username index.');
            } else {
                console.log('No username index found.');
            }

        } catch (err) {
            console.error('Error:', err);
        } finally {
            mongoose.connection.close();
        }
    })
    .catch(err => console.error(err));
