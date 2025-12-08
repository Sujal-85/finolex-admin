const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    collegeName: { type: String, default: "XYZ College of Engineering" },
    canteenName: { type: String, default: "Central Mess" },
    address: { type: String, default: "123 College Road" },
    contactEmail: { type: String, default: "mess@xyzcollege.edu" },
    contactPhone: { type: String, default: "+91-1234567890" },
    currency: { type: String, default: "INR" },
    timezone: { type: String, default: "Asia/Kolkata" },
    dateFormat: { type: String, default: "dd/MM/yyyy" },
    language: { type: String, default: "en" },
    logoUrl: { type: String },
    notificationSettings: {
        emailNotifications: { type: Boolean, default: true },
        smsNotifications: { type: Boolean, default: false },
        pushNotifications: { type: Boolean, default: true },
        paymentReminders: { type: Boolean, default: true },
        complaintAlerts: { type: Boolean, default: true }
    },
    dataRetention: { type: Number, default: 365 },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Settings', settingsSchema);
