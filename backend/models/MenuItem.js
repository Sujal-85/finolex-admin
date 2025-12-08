const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    allergens: [String],
    isSpecial: { type: Boolean, default: false },
    price: { type: Number, required: true },
    category: { type: String, default: 'General' },
    day: { type: String, required: true }, // e.g., Monday
    mealType: { type: String, required: true, enum: ['breakfast', 'lunch', 'dinner'] },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('MenuItem', menuItemSchema);
