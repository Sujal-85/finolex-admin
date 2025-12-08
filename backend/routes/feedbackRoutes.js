const express = require('express');
const Feedback = require('../models/Feedback');
const auth = require('../middleware/auth');
const router = express.Router();

// Get all feedback
router.get('/', auth, async (req, res) => {
    try {
        const feedback = await Feedback.find()
            .sort({ createdAt: -1 })
            .populate('studentId', 'name profileImage');
        res.send(feedback);
    } catch (error) {
        res.status(500).send(error);
    }
});

// Create feedback
router.post('/', auth, async (req, res) => {
    try {
        const feedback = new Feedback(req.body);
        await feedback.save();
        res.status(201).send(feedback);
    } catch (error) {
        res.status(400).send(error);
    }
});

// Delete feedback
router.delete('/:id', auth, async (req, res) => {
    try {
        const feedback = await Feedback.findByIdAndDelete(req.params.id);
        if (!feedback) return res.status(404).send();
        res.send(feedback);
    } catch (error) {
        res.status(500).send(error);
    }
});

module.exports = router;
