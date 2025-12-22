const express = require('express');
const Plan = require('../models/Plan');
const auth = require('../middleware/auth');
const router = express.Router();

// Get all plans
router.get('/', auth, async (req, res) => {
    try {
        const plans = await Plan.find();
        res.send(plans);
    } catch (error) {
        res.status(500).send(error);
    }
});

// Create plan
router.post('/', auth, async (req, res) => {
    try {
        if (req.body.rebatePdfUrl) req.body.rebatePdfUrl = req.body.rebatePdfUrl.trim();
        const plan = new Plan(req.body);
        await plan.save();
        res.status(201).send(plan);
    } catch (error) {
        res.status(400).send(error);
    }
});

// Update plan
router.patch('/:id', auth, async (req, res) => {
    try {
        if (req.body.rebatePdfUrl) req.body.rebatePdfUrl = req.body.rebatePdfUrl.trim();
        const plan = await Plan.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!plan) return res.status(404).send();
        res.send(plan);
    } catch (error) {
        res.status(400).send(error);
    }
});

// Delete plan
router.delete('/:id', auth, async (req, res) => {
    try {
        const plan = await Plan.findByIdAndDelete(req.params.id);
        if (!plan) return res.status(404).send();
        res.send(plan);
    } catch (error) {
        res.status(500).send(error);
    }
});

module.exports = router;
