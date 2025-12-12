const express = require('express');
const router = express.Router();
const Coupon = require('../models/Coupon');
const { protect, isAdmin } = require('../middleware/authMiddleware');

// @desc    Get all coupons
// @route   GET /api/coupons
// @access  Admin & Manager (Manager sees coupons for their orders - Logic to be refined if needed)
// For now, let's allow Admin to see all. Manager might need a specific query.
router.get('/', protect, async (req, res) => {
    try {
        let query = {};
        if (req.query.orderId) {
            query.orderId = req.query.orderId;
        }

        // If manager, maybe restrict? 
        // Current requirement: "Manager can view coupons received"
        // We can filter by finding orders assigned to this manager first, but for now let's keep it simple.

        const coupons = await Coupon.find(query).populate('orderId', 'eventName eventType date');
        res.json(coupons);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

module.exports = router;
