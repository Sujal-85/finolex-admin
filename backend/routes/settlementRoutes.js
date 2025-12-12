const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Coupon = require('../models/Coupon');
const { protect } = require('../middleware/authMiddleware');

// @desc    Get settlement summary
// @route   GET /api/settlements/summary
// @access  Private
router.get('/summary', protect, async (req, res) => {
    try {
        // Calculate Total Services Provided (Completed Orders)
        // If manager, filter by assignedTo

        // Calculate Total Services Provided (Completed Orders)
        let orderQuery = { status: 'Completed' };

        // Removed manager filter to allow them to see all order settlements
        // if (req.user.role === 'manager') {
        //     orderQuery.assignedTo = req.user._id;
        // }

        const completedOrders = await Order.find(orderQuery);
        const totalServicesAmount = completedOrders.reduce((acc, order) => acc + (order.totalAmount || 0), 0);

        // Calculate Total Coupon Value
        // We need coupons linked to these orders
        // OR just all coupons? Usually coupons are deducted from the payment.
        // Let's approximate: Coupons linked to these *completed* orders ? 
        // Or all Issued/Used coupons?
        // Requirement: "Total coupon value"

        // Let's find coupons linked to the orders visible to this user
        // Ideally we filter Coupons where orderId is in [completedOrders IDs]

        const orderIds = completedOrders.map(o => o._id);
        const coupons = await Coupon.find({ orderId: { $in: orderIds } });

        const totalCouponsAmount = coupons.reduce((acc, coupon) => acc + (coupon.value || 0), 0);

        const netPayable = totalServicesAmount - totalCouponsAmount;

        res.json({
            totalServicesAmount,
            totalCouponsAmount,
            netPayable,
            orderCount: completedOrders.length,
            couponCount: coupons.length
        });

    } catch (error) {
        console.error("Settlement Error:", error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

module.exports = router;
