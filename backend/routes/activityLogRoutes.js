const express = require('express');
const router = express.Router();
const ActivityLog = require('../models/ActivityLog');

// GET /api/activity-logs
router.get('/', async (req, res) => {
    try {
        const { module, action, search } = req.query;

        let query = {};

        if (module && module !== 'all') {
            query.module = module;
        }

        if (action && action !== 'all') {
            query.action = { $regex: action, $options: 'i' };
        }

        if (search) {
            query.$or = [
                { user: { $regex: search, $options: 'i' } },
                { action: { $regex: search, $options: 'i' } },
                { details: { $regex: search, $options: 'i' } }
            ];
        }

        const logs = await ActivityLog.find(query).sort({ timestamp: -1 }).limit(100);
        res.json(logs);
    } catch (error) {
        console.error('Error fetching activity logs:', error);
        res.status(500).json({ message: 'Error fetching activity logs' });
    }
});

module.exports = router;
