const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
        type: String,
        enum: ['payment', 'student', 'announcement', 'menu', 'complaint', 'feedback'],
        required: true
    },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // targeted notification
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', notificationSchema);
