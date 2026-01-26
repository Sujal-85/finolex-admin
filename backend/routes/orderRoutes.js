const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Coupon = require('../models/Coupon'); // Needed for generating coupons
const { protect, isAdmin, isManager } = require('../middleware/authMiddleware');

const { sendNotification } = require('../utils/n8nService');

// @desc    Create new order
// @route   POST /api/orders
// @access  Admin
router.post('/', protect, isAdmin, async (req, res) => {
    try {
        const {
            eventType,
            eventName,
            department,
            date,
            time,
            venue,
            serviceType,
            numberOfPersons,
            costPerHead,
            totalAmount,
            notes,
            assignedTo
        } = req.body;

        const order = new Order({
            eventType,
            eventName,
            department,
            date,
            time,
            venue,
            serviceType,
            numberOfPersons,
            costPerHead,
            totalAmount,
            notes,
            createdBy: req.user._id,
            assignedTo // Optional: assign manager immediately if known
        });

        const createdOrder = await order.save();

        // Send Email Notification via n8n (Non-blocking)
        try {
            await sendNotification({
                type: 'new_order',
                subject: `New Order: ${eventName}`,
                message: `A new order has been created for ${numberOfPersons} people on ${date}.`,
                details: {
                    orderId: createdOrder._id,
                    eventName,
                    department,
                    venue,
                    totalAmount
                }
            });
        } catch (notifyError) {
            console.error("Notification Error (Order Created Successfully):", notifyError);
            // Do not fail the request
        }

        res.status(201).json(createdOrder);
    } catch (error) {
        console.error("Create Order Error:", error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// @desc    Get all orders (Admin sees all, Manager sees assigned)
// @route   GET /api/orders
// @access  Private (Admin/Manager)
router.get('/', protect, async (req, res) => {
    try {
        let query = {};

        // If manager, only show assigned orders - REMOVED per user request (Manager = Owner)
        // if (req.user.role === 'manager') {
        //     query.assignedTo = req.user._id;
        // }

        const orders = await Order.find(query)
            .populate('createdBy', 'name email')
            .populate('assignedTo', 'name email')
            .sort({ createdAt: -1 });

        res.json(orders);
    } catch (error) {
        console.error("Get Orders Error:", error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// @desc    Get single order by ID
// @route   GET /api/orders/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('createdBy', 'name email')
            .populate('assignedTo', 'name email');

        if (order) {
            // Check access rights - REMOVED (Manager = Canteen Owner has full access)
            // if (req.user.role === 'manager' && order.assignedTo?.toString() !== req.user._id.toString()) {
            //     return res.status(403).json({ message: 'Not authorized to view this order' });
            // }
            res.json(order);
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// @desc    Update order Details
// @route   PUT /api/orders/:id
// @access  Admin
router.put('/:id', protect, isAdmin, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (order) {
            order.eventType = req.body.eventType || order.eventType;
            order.eventName = req.body.eventName || order.eventName;
            order.department = req.body.department || order.department;
            order.date = req.body.date || order.date;
            order.time = req.body.time || order.time;
            order.venue = req.body.venue || order.venue;
            order.serviceType = req.body.serviceType || order.serviceType;
            order.numberOfPersons = req.body.numberOfPersons || order.numberOfPersons;
            order.costPerHead = req.body.costPerHead || order.costPerHead;
            order.totalAmount = req.body.totalAmount || order.totalAmount;
            order.notes = req.body.notes || order.notes;
            order.assignedTo = req.body.assignedTo || order.assignedTo;

            const updatedOrder = await order.save();
            res.json(updatedOrder);
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// @desc    Update order status
// @route   PATCH /api/orders/:id/status
// @access  Manager/Admin
router.patch('/:id/status', protect, isManager, async (req, res) => {
    try {
        const { status, rejectionReason } = req.body;
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // If manager, ensure it's their order - REMOVED (Manager = Owner)
        // if (req.user.role === 'manager' && order.assignedTo?.toString() !== req.user._id.toString()) {
        //     return res.status(403).json({ message: 'Not authorized to update this order' });
        // }

        order.status = status;
        if (rejectionReason) {
            order.rejectionReason = rejectionReason;
        }

        const updatedOrder = await order.save();
        res.json(updatedOrder);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// @desc    Generate coupons for an order
// @route   POST /api/orders/:id/coupons
// @access  Admin
router.post('/:id/coupons', protect, isAdmin, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const { numberOfCoupons, valuePerCoupon, validUntil } = req.body;

        // Defaults if not provided (e.g. 1 coupon for the whole group, or per person)
        const count = numberOfCoupons || 1;
        const val = valuePerCoupon || (order.costPerHead || 0);

        const coupons = [];

        for (let i = 0; i < count; i++) {
            // Simple random code generation
            const code = `CPN-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

            coupons.push({
                code,
                orderId: order._id,
                type: order.eventType,
                value: val,
                validUntil,
                status: 'Issued'
            });
        }

        const createdCoupons = await Coupon.insertMany(coupons);
        res.status(201).json(createdCoupons);

    } catch (error) {
        console.error("Generate Coupon Error:", error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

module.exports = router;
