const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    studentName: { type: String },
    title: { type: String },
    message: { type: String },
    description: { type: String }, // Field from screenshot
    rating: { type: Number, min: 1, max: 5 },
    category: { type: String },
    type: { type: String }, // Field from screenshot
    images: [String], // Field from screenshot
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Feedback', feedbackSchema);
