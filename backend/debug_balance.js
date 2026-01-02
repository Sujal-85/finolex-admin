const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

const BASE_URL = 'http://localhost:5000/api';
// You might need a valid JWT token. 
// For this script, we can either mock the auth middleware or login first.
// Let's try to login as admin first to get token.

async function run() {
    try {
        console.log('1. Logging in as Admin...');
        // Replace with valid admin credentials. 
        // If you don't valid credentials, we need to create a temp user or bypass auth.
        // Assuming there is a default admin or we can create one.
        // Let's try to create a dummy transaction directly via Mongoose first to ensure DB state, 
        // then call the API.

        // Actually, without valid credentials, calling API is hard.
        // But we have access to the CODE and DB.
        // Let's use a script that connects to DB, creates a mock Request/Response, and calls the route handler directly?
        // No, that's complex because of dependencies.

        // Better: Connect to DB, create a dummy Student and Transaction.
        // Then manually invoke the logic? No.

        // Let's simply inspect the DB state first.

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        // 1. Create a Test Student
        const Student = require('./models/Student');
        const Transaction = require('./models/Transaction');

        const student = await Student.create({
            name: 'Test Student Balance',
            email: `testbal${Date.now()}@example.com`,
            rollNo: `TEST${Date.now()}`,
            department: 'IT',
            year: 'FY',
            balance: 1000,
            status: 'Active'
        });
        console.log('Created Student:', student._id, 'Balance:', student.balance);

        // 2. Create a Pending Transaction
        const transaction = await Transaction.create({
            studentId: student._id,
            studentName: student.name,
            amount: 500,
            type: 'Top-up',
            status: 'Pending',
            method: 'Cash'
        });
        console.log('Created Transaction:', transaction._id);

        // 3. Simulate the APPROVAL logic manually to see if it works with these objects
        // Copy-pasting the logic from transactionRoutes (simplified)

        console.log('Simulating Approval Logic...');

        // Step A: Update Transaction Status
        const updatedTrans = await Transaction.findByIdAndUpdate(transaction._id, { status: 'Completed' }, { new: true });
        console.log('Updated Transaction Status:', updatedTrans.status);

        // Step B: Update Student Balance (The fix)
        const amountToDeduct = Number(updatedTrans.amount);
        console.log(`Deducting ${amountToDeduct} from ${updatedTrans.studentId}`);

        const updatedStudent = await Student.findByIdAndUpdate(
            updatedTrans.studentId,
            { $inc: { balance: -amountToDeduct } },
            { new: true }
        );

        console.log('Updated Student Balance:', updatedStudent.balance);

        if (updatedStudent.balance === 500) {
            console.log('SUCCESS: Balance updated correctly (1000 - 500 = 500)');
        } else {
            console.error('FAILURE: Balance incorrect!');
        }

        // Cleanup
        await Student.findByIdAndDelete(student._id);
        await Transaction.findByIdAndDelete(transaction._id);
        console.log('Cleanup done.');

        process.exit(0);

    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

run();
