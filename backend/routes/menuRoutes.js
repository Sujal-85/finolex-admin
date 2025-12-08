const express = require('express');
const MenuItem = require('../models/MenuItem');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');
const router = express.Router();

// Get all menu items
router.get('/', async (req, res) => {
    try {
        const menuItems = await MenuItem.find();
        res.send(menuItems);
    } catch (error) {
        res.status(500).send(error);
    }
});

// Create menu item
router.post('/', auth, async (req, res) => {
    try {
        const menuItem = new MenuItem(req.body);
        await menuItem.save();

        // Create notification
        await Notification.create({
            title: 'Menu Item Added',
            message: `${menuItem.name} added to ${menuItem.category} menu`,
            type: 'menu'
        });

        res.status(201).send(menuItem);
    } catch (error) {
        res.status(400).send(error);
    }
});

// Update menu item
router.patch('/:id', auth, async (req, res) => {
    try {
        const menuItem = await MenuItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!menuItem) return res.status(404).send();
        res.send(menuItem);
    } catch (error) {
        res.status(400).send(error);
    }
});

// Delete menu item
router.delete('/:id', auth, async (req, res) => {
    try {
        const menuItem = await MenuItem.findByIdAndDelete(req.params.id);
        if (!menuItem) return res.status(404).send();
        res.send(menuItem);
    } catch (error) {
        res.status(500).send(error);
    }
});

module.exports = router;
