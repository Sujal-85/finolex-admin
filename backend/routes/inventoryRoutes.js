const express = require('express');
const InventoryItem = require('../models/InventoryItem');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/', auth, async (req, res) => {
    try {
        const items = await InventoryItem.find();
        res.send(items);
    } catch (error) {
        res.status(500).send(error);
    }
});

router.post('/', auth, async (req, res) => {
    try {
        const item = new InventoryItem(req.body);
        await item.save();
        res.status(201).send(item);
    } catch (error) {
        res.status(400).send(error);
    }
});

router.patch('/:id', auth, async (req, res) => {
    try {
        const item = await InventoryItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!item) return res.status(404).send();
        res.send(item);
    } catch (error) {
        res.status(400).send(error);
    }
});

router.delete('/:id', auth, async (req, res) => {
    try {
        const item = await InventoryItem.findByIdAndDelete(req.params.id);
        if (!item) return res.status(404).send();
        res.send(item);
    } catch (error) {
        res.status(500).send(error);
    }
});

module.exports = router;
