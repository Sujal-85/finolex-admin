const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
    name: { type: String, required: true },
    type: { type: String, enum: ['basic', 'standard', 'premium'], required: true },
    price: { type: Number, required: true },
    features: [{ type: String }],
    active: { type: Boolean, default: true },
    subscriberCount: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Plan', planSchema);
