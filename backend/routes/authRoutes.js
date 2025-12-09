const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Student = require('../models/Student');
const logActivity = require('../utils/activityLogger');
const router = express.Router();

// Register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        const user = new User({ name, email, password, role });
        await user.save();
        res.status(201).send({ message: 'User registered successfully' });
    } catch (error) {
        res.status(400).send(error);
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).send({ error: 'Invalid login credentials' });
        }
        const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET);

        await logActivity({
            user: user.name,
            action: 'Login',
            module: 'auth',
            details: 'Admin logged in successfully',
            ipAddress: req.ip
        });

        res.send({ user, token });
    } catch (error) {
        res.status(400).send(error);
    }
});


// Student Login
router.post('/student/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const student = await Student.findOne({ email });
        if (!student || !(await student.comparePassword(password))) {
            return res.status(401).send({ error: 'Invalid login credentials' });
        }
        const token = jwt.sign({ userId: student._id, role: 'student' }, process.env.JWT_SECRET);

        await logActivity({
            user: student.name,
            action: 'Login',
            module: 'auth',
            details: 'Student logged in successfully',
            ipAddress: req.ip
        });

        res.send({ student, token });
    } catch (error) {
        res.status(400).send(error);
    }
});

module.exports = router;
