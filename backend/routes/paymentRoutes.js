const express = require('express');
const Payment = require('../models/Payment');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');
const logActivity = require('../utils/activityLogger');
const router = express.Router();

const mongoose = require('mongoose');

router.get('/', auth, async (req, res) => {
    try {
        const { studentId } = req.query;
        // console.log("GET /payments query:", req.query);
        const query = {};
        if (studentId) {
            query.studentId = new mongoose.Types.ObjectId(studentId);
        }

        const payments = await Payment.find(query).sort({ date: -1 }).populate('studentId', 'rollNumber hostel department');
        res.send(payments);
    } catch (error) {
        // console.error(error);
        res.status(500).send(error);
    }
});

router.post('/', auth, async (req, res) => {
    try {
        const payment = new Payment(req.body);
        await payment.save();

        // Create notification
        await Notification.create({
            title: 'New Payment Received',
            message: `Received ₹${payment.amount} from ${payment.studentName}`,
            type: 'payment'
        });

        await logActivity({
            user: req.user.name || 'Admin',
            action: 'Processed Payment',
            module: 'payments',
            details: `Processed payment of ₹${payment.amount} for ${payment.studentName}`,
            ipAddress: req.ip
        });

        // Create transaction record
        const Transaction = require('../models/Transaction');
        await Transaction.create({
            paymentId: payment._id,
            studentId: payment.studentId,
            studentName: payment.studentName,
            amount: payment.amount,
            type: payment.type,
            status: payment.status,
            method: payment.method,
            transactionId: payment.transactionId,
            remarks: payment.remarks
        });

        // Update Student Balance and Next Due Date if applicable
        const updateData = { $inc: { balance: -payment.amount } };

        if (payment.type === 'Meal Plan') {
            const currentDueDate = await mongoose.model('Student').findById(payment.studentId).select('nextDueDate');
            let newDate = currentDueDate?.nextDueDate ? new Date(currentDueDate.nextDueDate) : new Date();
            newDate.setDate(newDate.getDate() + 30);
            updateData.nextDueDate = newDate;
        }

        await mongoose.model('Student').findByIdAndUpdate(payment.studentId, updateData);


        // Emit real-time event
        req.io.emit('payment_updated', payment);

        res.status(201).send(payment);
    } catch (error) {
        res.status(400).send(error);
    }
});

router.patch('/:id', auth, async (req, res) => {
    try {
        const payment = await Payment.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!payment) {
            return res.status(404).send();
        }
        res.send(payment);
    } catch (error) {
        res.status(400).send(error);
    }
});

module.exports = router;
