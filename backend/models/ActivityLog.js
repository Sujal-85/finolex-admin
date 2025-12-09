const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
    timestamp: {
        type: Date,
        default: Date.now,
        required: true
    },
    user: {
        type: String,
        required: true,
        default: 'System'
    },
    action: {
        type: String,
        required: true
    },
    module: {
        type: String,
        required: true,
        enum: ['students', 'payments', 'plans', 'menu', 'announcements', 'complaints', 'settings', 'auth', 'inventory', 'feedback', 'transactions']
    },
    details: {
        type: String,
        default: ''
    },
    ipAddress: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['success', 'failed'],
        default: 'success'
    }
});

module.exports = mongoose.model('ActivityLog', activityLogSchema);
