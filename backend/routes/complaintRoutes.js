const express = require('express');
const Complaint = require('../models/Complaint');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/', auth, async (req, res) => {
    try {
        const complaints = await Complaint.find().sort({ createdAt: -1 });
        res.send(complaints);
    } catch (error) {
        res.status(500).send(error);
    }
});

router.post('/', auth, async (req, res) => {
    try {
        const complaint = new Complaint(req.body);
        await complaint.save();
        res.status(201).send(complaint);
    } catch (error) {
        res.status(400).send(error);
    }
});

router.patch('/:id', auth, async (req, res) => {
    try {
        const complaint = await Complaint.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!complaint) return res.status(404).send();
        res.send(complaint);
    } catch (error) {
        res.status(400).send(error);
    }
});

module.exports = router;
