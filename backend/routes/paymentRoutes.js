const express = require('express');
const Payment = require('../models/Payment');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/', auth, async (req, res) => {
    try {
        const payments = await Payment.find().sort({ date: -1 }).populate('studentId', 'rollNumber hostel department');
        res.send(payments);
    } catch (error) {
        res.status(500).send(error);
    }
});

router.post('/', auth, async (req, res) => {
    try {
        const payment = new Payment(req.body);
        await payment.save();
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
