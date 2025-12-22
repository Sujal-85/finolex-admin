const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
    name: { type: String, required: true },
    type: { type: String, enum: ['basic', 'standard', 'premium'], required: true },
    price: { type: Number, required: true },
    features: [{ type: String }],
    active: { type: Boolean, default: true },
    subscriberCount: { type: Number, default: 0 },
    startDate: { type: Date },
    endDate: { type: Date },
    rebatePdfUrl: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Plan', planSchema);
