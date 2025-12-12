const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true }, // e.g., "EXT-1234"
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    type: { type: String, enum: ['Guest', 'Function', 'Exam'], required: true },
    value: { type: Number, required: true }, // Amount this coupon is worth

    status: {
        type: String,
        enum: ['Issued', 'Used', 'Expired'],
        default: 'Issued'
    },

    validUntil: { type: Date },
    usedAt: { type: Date },

    // Relations
    info: { type: String } // any extra info
}, { timestamps: true });

module.exports = mongoose.model('Coupon', couponSchema);
