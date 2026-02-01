const express = require('express');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');
const router = express.Router();

// Get all notifications
router.get('/', auth, async (req, res) => {
    try {
        console.log('Fetching notifications...');
        // Filter: Global notifications (recipient: null) OR Targeted to current user
        const notifications = await Notification.find({
            $or: [
                { recipient: null },
                { recipient: req.user._id }
            ]
        }).sort({ createdAt: -1 }).limit(50);
        console.log(`Found ${notifications.length} notifications`);
        res.send(notifications);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).send({ error: error.message });
    }
});

// Mark as read
router.patch('/:id/read', auth, async (req, res) => {
    try {
        const notification = await Notification.findByIdAndUpdate(
            req.params.id,
            { isRead: true },
            { new: true }
        );
        res.send(notification);
    } catch (error) {
        res.status(400).send(error);
    }
});

// Mark all as read
router.patch('/read-all', auth, async (req, res) => {
    try {
        await Notification.updateMany({ isRead: false }, { isRead: true });
        res.send({ message: 'All notifications marked as read' });
    } catch (error) {
        res.status(500).send(error);
    }
});

module.exports = router;
