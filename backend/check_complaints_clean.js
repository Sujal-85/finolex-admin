const mongoose = require('mongoose');
require('dotenv').config();
const Complaint = require('./models/Complaint');

const checkComplaints = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        const complaints = await Complaint.find().limit(3);
        console.log('--- COMPLAINTS STRUCTURE ---');
        complaints.forEach(c => {
            const obj = c.toObject();
            console.log({
                _id: obj._id,
                studentId: obj.studentId,
                studentName: obj.studentName,
                image: obj.image,
                images: obj.images, // Check if this exists
                subject: obj.subject
            });
        });

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkComplaints();
