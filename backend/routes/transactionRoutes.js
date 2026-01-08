const express = require('express');
const router = express.Router();

const Transaction = require('../models/Transaction');
const Payment = require('../models/Payment');
const Student = require('../models/Student');
const auth = require('../middleware/auth');

/* =========================================================
   GET ALL TRANSACTIONS
========================================================= */
router.get('/', auth, async (req, res) => {
    try {
        const transactions = await Transaction.find()
            .sort({ date: -1 })
            .populate('studentId', 'name rollNumber hostel department');

        const enriched = transactions.map(t => {
            const obj = t.toObject();
            if (!obj.studentName && obj.studentId?.name) {
                obj.studentName = obj.studentId.name;
            }
            return obj;
        });

        res.json(enriched);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* =========================================================
   CREATE TRANSACTION
========================================================= */
router.post('/', auth, async (req, res) => {
    try {
        const data = req.body;

        if (!data.studentName && data.studentId) {
            const student = await Student.findById(data.studentId);
            if (student) data.studentName = student.name;
        }

        const transaction = new Transaction({
            ...data,
            status: data.status || 'Pending',
            balanceDeducted: false
        });

        await transaction.save();
        res.status(201).json(transaction);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

/* =========================================================
   UPDATE TRANSACTION (ADMIN APPROVAL)
========================================================= */
router.patch('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const transaction = await Transaction.findById(id);
        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        const previousStatus = transaction.status;
        const newStatus = (updates.status || previousStatus).trim();

        /* =====================================================
           RUN BUSINESS LOGIC FIRST
        ===================================================== */
        if (
            previousStatus !== 'Completed' &&
            newStatus === 'Completed' &&
            !transaction.balanceDeducted
        ) {
            const amount = Number(transaction.amount);
            if (isNaN(amount) || amount <= 0) {
                return res.status(400).json({ error: 'Invalid amount' });
            }

            const studentId =
                transaction.studentId?._id || transaction.studentId;

            /* ---------- FETCH STUDENT ---------- */
            const student = await Student.findById(studentId);
            if (!student) {
                return res.status(404).json({ error: 'Student not found' });
            }

            /* ---------- FIFO PLAN DEDUCTION ---------- */
            let remainingAmount = amount;

            const sortedPlans = [...(student.activePlans || [])].sort(
                (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
            );

            // CHANGED: We map existing plans to Update status instead of removing them.
            // This prevents the "Lazy Sync" from re-adding them and re-incrementing balance.
            const updatedActivePlans = sortedPlans.map(plan => {
                if (plan.status !== 'paid' && remainingAmount >= plan.price) {
                    remainingAmount -= plan.price;
                    console.log(`[PLAN CLEARED] ${plan.name}`);
                    // Return new object with paid status
                    return {
                        ...plan.toObject ? plan.toObject() : plan, // Ensure plain object
                        status: 'paid',
                        paidAt: new Date()
                    };
                }
                return plan;
            });

            /* ---------- UPDATE STUDENT (ATOMIC) ---------- */
            const updatedStudent = await Student.findByIdAndUpdate(
                studentId,
                {
                    $inc: { balance: -amount },
                    $set: { activePlans: updatedActivePlans }
                },
                { new: true, runValidators: false } // Explicitly disable validation
            );

            if (!updatedStudent) {
                return res.status(500).json({
                    error: 'Balance update failed'
                });
            }

            console.log(
                `[BALANCE UPDATED] Student ${updatedStudent._id} → ${updatedStudent.balance}`
            );

            /* ---------- MARK TRANSACTION ---------- */
            transaction.balanceDeducted = true;

            /* ---------- SOCKET ---------- */
            if (req.io) {
                req.io.emit('balance_update', {
                    studentId: updatedStudent._id,
                    balance: updatedStudent.balance
                });
            }

            /* ---------- PAYMENT ---------- */
            if (!transaction.paymentId) {
                const payment = await Payment.create({
                    studentId,
                    studentName: transaction.studentName || updatedStudent.name,
                    amount,
                    type: transaction.type || 'Purchase',
                    status: 'Completed',
                    method: transaction.method,
                    transactionId: transaction.transactionId,
                    remarks: transaction.remarks,
                    date: transaction.date
                });
                transaction.paymentId = payment._id;
            } else {
                await Payment.findByIdAndUpdate(
                    transaction.paymentId,
                    { status: 'Completed' }
                );
            }
        }

        /* =====================================================
           UPDATE TRANSACTION LAST
        ===================================================== */
        Object.assign(transaction, updates);
        transaction.status = newStatus;
        await transaction.save();

        res.json(transaction);
    } catch (err) {
        console.error('Transaction Update Error:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
