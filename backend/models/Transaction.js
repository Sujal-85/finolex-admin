const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    studentName: { type: String },
    amount: { type: Number, required: true },
    type: { type: String, enum: ['Meal Plan', 'Top-up', 'Fine', 'Purchase'], default: 'Top-up' },
    status: { type: String, enum: ['Completed', 'Pending', 'Failed'], default: 'Completed' },
    method: { type: String, enum: ['UPI', 'Card', 'Cash', 'QR Code'], default: 'UPI' },
    transactionId: { type: String }, // External ID
    receiptUrl: { type: String }, // Cloudinary URL for payment screenshot
    remarks: { type: String },
    date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Transaction', transactionSchema);
