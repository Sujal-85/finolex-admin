const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    rollNumber: { type: String, required: true, unique: true },
    department: { type: String, required: true },
    year: { type: String, required: true },
    hostel: { type: String, required: true },
    room: { type: String },
    phone: { type: String },
    currentPlan: { type: String, default: 'Basic Plan' },
    nextDueDate: { type: Date },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
    balance: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);
