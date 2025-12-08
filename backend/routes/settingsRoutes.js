const express = require('express');
const Settings = require('../models/Settings');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/', async (req, res) => {
    try {
        let settings = await Settings.findOne();
        if (!settings) {
            settings = new Settings();
            await settings.save();
        }
        res.send(settings);
    } catch (error) {
        res.status(500).send(error);
    }
});

router.patch('/', auth, async (req, res) => {
    try {
        let settings = await Settings.findOne();
        if (!settings) {
            settings = new Settings(req.body);
        } else {
            Object.assign(settings, req.body);
        }
        await settings.save();
        res.send(settings);
    } catch (error) {
        res.status(400).send(error);
    }
});

module.exports = router;
