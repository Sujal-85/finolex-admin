const axios = require('axios');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const BASE_URL = `http://localhost:${process.env.PORT || 5000}/api`;

async function run() {
    try {
        console.log('1. Connecting to DB...');
        await mongoose.connect(process.env.MONGODB_URI);

        // 2. Create Test Data
        const Student = require('./models/Student');
        const Transaction = require('./models/Transaction');

        const student = await Student.create({
            name: 'API TestUser',
            email: `apitest${Date.now()}@test.com`,
            rollNo: `API${Date.now()}`,
            department: 'CS',
            year: 'FY',
            balance: 1000,
            status: 'Active'
        });

        const transaction = await Transaction.create({
            studentId: student._id,
            studentName: student.name,
            amount: 200,
            type: 'Top-up',
            status: 'Pending',
            method: 'Cash'
        });

        console.log(`Created Student: ${student._id} (Bal: ${student.balance})`);
        console.log(`Created Transaction: ${transaction._id}`);

        // 3. Generate Token
        // Assuming we need a user token. The middleware checks 'req.user'. 
        // Let's look at 'middleware/auth.js'. Usually expects 'Authorization: Bearer <token>'
        // We'll sign a dummy admin user.
        const token = jwt.sign(
            { userId: new mongoose.Types.ObjectId(), role: 'admin', name: 'AdminScript' },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // 4. Call the API
        console.log('Calling PATCH API...');
        try {
            const res = await axios.patch(
                `${BASE_URL}/transactions/${transaction._id}`,
                { status: 'Completed' },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log('API Response Status:', res.status);
            console.log('API Response Body:', res.data.status);
        } catch (apiErr) {
            console.error('API Call Failed:', apiErr.response ? apiErr.response.data : apiErr.message);
        }

        // 5. Verify Database State
        const updatedStudent = await Student.findById(student._id);
        console.log(`Student Balance After: ${updatedStudent.balance}`);

        if (updatedStudent.balance === 800) {
            console.log('✅ SUCCESS: Balance deducted correctly.');
        } else {
            console.log('❌ FAILURE: Balance deduction failed.');
        }

        // Cleanup
        await Student.findByIdAndDelete(student._id);
        await Transaction.findByIdAndDelete(transaction._id);

        process.exit(0);

    } catch (err) {
        console.error('Script Error:', err);
        process.exit(1);
    }
}

run();
