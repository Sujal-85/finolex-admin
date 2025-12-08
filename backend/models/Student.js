const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const studentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    rollNo: { type: String, unique: true }, // Changed from rollNumber, removed required
    department: { type: String, required: true },
    year: { type: String, required: true },
    birthday: { type: Date }, // Added birthday field
    hostelDetails: {
        hostelName: { type: String },
        roomNo: { type: String }
    },
    phone: { type: String },
    currentPlan: { type: String, default: 'Basic Mess Plan' },
    nextDueDate: { type: Date },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
    balance: { type: Number, default: 0 },
    profileImage: { type: String }, // Changed from profilePicture
    password: { type: String } // Added password field as seen in dump
}, { timestamps: true });

studentSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

studentSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Student', studentSchema);
