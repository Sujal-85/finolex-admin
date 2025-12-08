const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    studentName: { type: String, required: true },
    amount: { type: Number, required: true },
    type: { type: String, enum: ['Meal Plan', 'Top-up', 'Fine', 'Purchase'], required: true },
    status: { type: String, enum: ['Completed', 'Pending', 'Failed'], default: 'Completed' },
    method: { type: String, enum: ['UPI', 'Card', 'Cash', 'QR Code'], default: 'UPI' },
    transactionId: { type: String },
    remarks: { type: String },
    date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Payment', paymentSchema);
