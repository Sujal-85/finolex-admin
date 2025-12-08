const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    type: { type: String, enum: ['Info', 'Warning', 'Success', 'Alert'], default: 'Info' },
    targetAudience: { type: String, default: 'All' }, // Flexible to allow hostel-a, etc.
    status: { type: String, enum: ['draft', 'scheduled', 'published'], default: 'draft' },
    scheduledDate: { type: Date },
    pushNotification: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date }
});

module.exports = mongoose.model('Announcement', announcementSchema);
