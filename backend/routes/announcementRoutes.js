const express = require('express');
const Announcement = require('../models/Announcement');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const announcements = await Announcement.find({ active: true }).sort({ createdAt: -1 });
        res.send(announcements);
    } catch (error) {
        res.status(500).send(error);
    }
});

router.post('/', auth, async (req, res) => {
    try {
        const announcement = new Announcement(req.body);
        await announcement.save();

        // Create notification
        await Notification.create({
            title: 'New Announcement',
            message: announcement.title,
            type: 'announcement'
        });

        res.status(201).send(announcement);
    } catch (error) {
        res.status(400).send(error);
    }
});

router.delete('/:id', auth, async (req, res) => {
    try {
        const announcement = await Announcement.findByIdAndDelete(req.params.id);
        if (!announcement) return res.status(404).send();
        res.send(announcement);
    } catch (error) {
        res.status(500).send(error);
    }
});

module.exports = router;
