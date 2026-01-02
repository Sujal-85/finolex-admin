const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const studentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    rollNo: { type: String, unique: true }, // Changed from rollNumber, removed required
    department: { type: String, required: true },
    year: { type: String, required: true },
    dob: { type: Date }, // Changed from birthday to dob to match DB
    hostelDetails: {
        hostelName: { type: String },
        roomNo: { type: String }
    },
    phone: { type: String },
    currentPlan: { type: String, default: 'Basic Mess Plan' },
    nextDueDate: { type: Date },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
    balance: { type: Number, default: 0 },
    activePlans: [{
        planId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan' },
        name: { type: String },
        price: { type: Number },
        startDate: { type: Date },
        endDate: { type: Date },
        status: { type: String, enum: ['paid', 'pending'], default: 'pending' },
        addedAt: { type: Date, default: Date.now },
        _id: false
    }],
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
