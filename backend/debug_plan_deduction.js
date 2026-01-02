const mongoose = require('mongoose');
const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/finolex_canteen'; // Adjust if needed
const BASE_URL = 'http://localhost:5000/api';
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// Models (Simplified for setup)
const StudentSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    rollNo: { type: String, unique: true },
    department: String,
    year: String,
    balance: { type: Number, default: 0 },
    activePlans: [{
        name: String,
        price: Number,
        date: { type: Date, default: Date.now },
        _id: false
    }]
});
const Student = mongoose.models.Student || mongoose.model('Student', StudentSchema);

const TransactionSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    amount: Number,
    type: String, // 'Meal Plan'
    status: { type: String, default: 'Pending' },
    balanceDeducted: { type: Boolean, default: false }
});
const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);

async function runTest() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected.');

        // 1. Create Test Student with 2 Plans (2000 each) -> Total Debt 4000
        const testRollNo = `TEST-${Date.now()}`;
        const student = await Student.create({
            name: 'Plan Test User',
            email: `${testRollNo}@test.com`,
            rollNo: testRollNo,
            department: 'Test',
            year: '1',
            balance: 4000,
            activePlans: [
                { name: 'Plan 1', price: 2000, date: new Date(Date.now() - 10000) }, // Older
                { name: 'Plan 2', price: 2000, date: new Date() } // Newer
            ]
        });
        console.log(`Created Student: ${student._id} | Balance: ${student.balance} | Plans: ${student.activePlans.length}`);

        // 2. Create Transaction for 3000 (Should clear Plan 1, leave 1000 remaining on balance, Plan 2 stays)
        const transaction = await Transaction.create({
            studentId: student._id,
            amount: 3000,
            type: 'Meal Plan',
            status: 'Pending'
        });
        console.log(`Created Pending Transaction: ${transaction._id} for 3000`);

        // 3. Generate Auth Token
        const token = jwt.sign({ id: 'admin_id', role: 'admin' }, JWT_SECRET, { expiresIn: '1h' });

        // 4. Call API to Approve
        console.log('Approving Transaction via API...');
        try {
            await axios.patch(
                `${BASE_URL}/transactions/${transaction._id}`,
                { status: 'Completed' },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log('API Call Successful.');
        } catch (apiErr) {
            console.error('API Call Failed:', apiErr.response ? apiErr.response.data : apiErr.message);
            // Verify failing in script shouldn't stop us if we want to debug DB state, 
            // but usually it means logic failed.
        }

        // 5. Verify Results
        const updatedStudent = await Student.findById(student._id);
        console.log('--------------------------------------------------');
        console.log('VERIFICATION RESULTS:');
        console.log(`Initial Balance: 4000 -> New Balance: ${updatedStudent.balance}`);
        console.log(`Initial Plans: 2 -> New Plans: ${updatedStudent.activePlans.length}`);

        updatedStudent.activePlans.forEach((p, i) => {
            console.log(`Plan ${i + 1}: ${p.name} - ${p.price}`);
        });

        // Assertions
        const balanceCorrect = updatedStudent.balance === 1000; // 4000 - 3000
        const planCorrect = updatedStudent.activePlans.length === 1 && updatedStudent.activePlans[0].name === 'Plan 2';

        if (balanceCorrect && planCorrect) {
            console.log('✅ TEST PASSED: Balance deducted and correct plan removed.');
        } else {
            console.error('❌ TEST FAILED:');
            if (!balanceCorrect) console.error(`   - Balance mismatch (Expected 1000, Got ${updatedStudent.balance})`);
            if (!planCorrect) console.error(`   - Plan logic failed (Expected 1 plan 'Plan 2', Got ${updatedStudent.activePlans.length} plans)`);
        }
        console.log('--------------------------------------------------');

        // Cleanup
        await Student.findByIdAndDelete(student._id);
        await Transaction.findByIdAndDelete(transaction._id);
        console.log('Cleanup complete.');

    } catch (err) {
        console.error('Test script error:', err);
    } finally {
        await mongoose.disconnect();
    }
}

runTest();
