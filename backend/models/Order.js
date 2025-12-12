const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    eventType: {
        type: String,
        required: true,
        enum: ['Guest', 'Function', 'Exam']
    },
    eventName: { type: String }, // e.g., "Annual Gathering", "NAAC Visit"
    department: { type: String }, // Optional, e.g., "IT Dept"
    date: { type: Date, required: true },
    time: { type: String }, // e.g., "12:30 PM"
    venue: { type: String },
    serviceType: {
        type: String,
        enum: ['Lunch', 'Snacks', 'Both'],
        default: 'Lunch'
    },
    numberOfPersons: { type: Number, required: true },
    costPerHead: { type: Number },
    totalAmount: { type: Number, required: true },

    status: {
        type: String,
        enum: ['Pending', 'In Progress', 'Completed', 'Cancelled', 'Rejected'],
        default: 'Pending'
    },

    // Relations
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Mess Manager

    // Metadata
    rejectionReason: { type: String },
    notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
