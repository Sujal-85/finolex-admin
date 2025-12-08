const express = require('express');
const Transaction = require('../models/Transaction');
const Payment = require('../models/Payment');
const auth = require('../middleware/auth');
const router = express.Router();

// Get all transactions
router.get('/', auth, async (req, res) => {
    try {
        const transactions = await Transaction.find()
            .sort({ date: -1 })
            .populate('studentId', 'name rollNumber hostel department');

        // Ensure studentName is populated from studentId if missing
        const enrichedTransactions = transactions.map(t => {
            const obj = t.toObject();
            if (!obj.studentName && obj.studentId?.name) {
                obj.studentName = obj.studentId.name;
            }
            return obj;
        });

        res.send(enrichedTransactions);
    } catch (error) {
        res.status(500).send(error);
    }
});

// Create a transaction
router.post('/', auth, async (req, res) => {
    try {
        const transactionData = req.body;

        // Fetch student name if not provided
        if (!transactionData.studentName && transactionData.studentId) {
            const Student = require('../models/Student');
            const student = await Student.findById(transactionData.studentId);
            if (student) {
                transactionData.studentName = student.name;
            }
        }

        const transaction = new Transaction(transactionData);
        await transaction.save();
        res.status(201).send(transaction);
    } catch (error) {
        res.status(400).send(error);
    }
});

// Update transaction status
router.patch('/:id', auth, async (req, res) => {
    try {
        const transaction = await Transaction.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!transaction) {
            return res.status(404).send();
        }

        // If status is Completed, sync with Payment collection
        if (req.body.status === 'Completed') {
            if (transaction.paymentId) {
                // If linked payment exists, mark it as completed
                await Payment.findByIdAndUpdate(transaction.paymentId, { status: 'Completed' });
            } else {
                // If no linked payment, create a new Payment record

                // Ensure studentName is present
                let studentName = transaction.studentName;
                if (!studentName) {
                    const Student = require('../models/Student');
                    const student = await Student.findById(transaction.studentId);
                    if (student) {
                        studentName = student.name;
                        // Determine type if generic
                        // If transaction type is 'Purchase', we might want to default to 'Meal Plan' or keep as 'Purchase'
                        // keeping as is since we updated Payment model
                    }
                }

                if (!studentName) {
                    throw new Error("Student name not found for transaction");
                }

                const newPayment = new Payment({
                    studentId: transaction.studentId,
                    studentName: studentName,
                    amount: transaction.amount,
                    type: transaction.type || 'Purchase', // Default to Purchase if missing
                    status: 'Completed',
                    method: transaction.method,
                    transactionId: transaction.transactionId,
                    remarks: transaction.remarks,
                    date: transaction.date
                });
                const savedPayment = await newPayment.save();

                // Link the new payment to the transaction
                transaction.paymentId = savedPayment._id;
                // Update student name and type in transaction as well if it was missing
                if (!transaction.studentName) transaction.studentName = studentName;
                if (!transaction.type) transaction.type = 'Purchase';
                await transaction.save();
            }
        }

        res.send(transaction);
    } catch (error) {
        console.error("Transaction Approval Error:", error);
        res.status(400).send(error);
    }
});

module.exports = router;
