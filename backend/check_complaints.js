const mongoose = require('mongoose');
require('dotenv').config();
const Complaint = require('./models/Complaint');

const checkComplaints = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const complaints = await Complaint.find().limit(5);
        console.log('--- COMPLAINTS ---');
        console.log(JSON.stringify(complaints, null, 2));

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkComplaints();
