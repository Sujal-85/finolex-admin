const mongoose = require('mongoose');

const inventoryItemSchema = new mongoose.Schema({
    name: { type: String, required: true },
    category: { type: String, required: true },
    quantity: { type: Number, required: true, default: 0 },
    unit: { type: String, required: true }, // e.g., kg, liters, pcs
    minThreshold: { type: Number, default: 10 },
    supplier: { type: String },
    lastRestocked: { type: Date },
    status: { type: String, enum: ['In Stock', 'Low Stock', 'Out of Stock'], default: 'In Stock' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('InventoryItem', inventoryItemSchema);
