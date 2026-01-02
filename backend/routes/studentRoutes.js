const express = require('express');
const Student = require('../models/Student');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');
const logActivity = require('../utils/activityLogger');
const router = express.Router();

const Plan = require('../models/Plan');
const Payment = require('../models/Payment');

// Get all students
router.get('/', auth, async (req, res) => {
    try {
        const students = await Student.find().lean();
        const plans = await Plan.find().lean();
        const payments = await Payment.find({ status: 'Completed' }).lean();

        // Create a map of plan prices
        const planPriceMap = {};
        plans.forEach(plan => {
            planPriceMap[plan.name] = plan.price;
        });

        // Check for a single active plan as fallback
        const activePlans = plans.filter(p => p.active);
        const singleActivePlan = activePlans.length === 1 ? activePlans[0] : null;

        // Return students with their stored balance
        const studentsWithBalance = students.map(student => ({
            ...student,
            currentPlan: student.currentPlan || (singleActivePlan?.name)
        }));

        res.send(studentsWithBalance);
    } catch (error) {
        console.error("Error fetching students:", error);
        res.status(500).send(error);
    }
});

const crypto = require('crypto');

// Create student
router.post('/', auth, async (req, res) => {
    try {
        const studentData = req.body;
        let generatedPassword = null;

        if (!studentData.password) {
            generatedPassword = crypto.randomBytes(4).toString('hex');
            studentData.password = generatedPassword;
        }

        const student = new Student(studentData);
        await student.save();

        // Create notification
        await Notification.create({
            title: 'New Student Added',
            message: `${student.name} has been added to the system`,
            type: 'student'
        });

        await logActivity({
            user: req.user.name || 'Admin',
            action: 'Created Student',
            module: 'students',
            details: `Created new student: ${student.name}`,
            ipAddress: req.ip
        });

        const responseData = student.toObject();
        if (generatedPassword) {
            responseData.generatedPassword = generatedPassword;
        }

        res.status(201).send(responseData);
    } catch (error) {
        res.status(400).send(error);
    }
});

// Get student by ID
router.get('/:id', auth, async (req, res) => {
    try {
        const student = await Student.findById(req.params.id).lean();
        if (!student) return res.status(404).send();

        // Legacy Balance Calculation REMOVED. 
        // We now rely on stored 'balance' and 'activePlans' updated by Transaction Routes.

        // Optional: Populate currentPlan name just for display if needed, but do not touch balance.
        if (student.currentPlan && !student.activePlans) {
            // Keep existing behavior for old students? 
            // No, better to trust the DB. 
        }

        res.send(student);
    } catch (error) {
        res.status(500).send(error);
    }
});

// Update student
router.patch('/:id', auth, async (req, res) => {
    try {
        const student = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!student) return res.status(404).send();

        // Create notification for update
        await Notification.create({
            title: 'Student Profile Updated',
            message: `${student.name} updated their profile`,
            type: 'student'
        });

        await logActivity({
            user: req.user.name || 'Admin',
            action: 'Updated Student Record',
            module: 'students',
            details: `Updated details for student: ${student.name}`,
            ipAddress: req.ip
        });

        res.send(student);
    } catch (error) {
        res.status(400).send(error);
    }
});

// Delete student
router.delete('/:id', auth, async (req, res) => {
    try {
        const student = await Student.findByIdAndDelete(req.params.id);
        if (!student) return res.status(404).send();
        res.send(student);
    } catch (error) {
        res.status(500).send(error);
    }
});

module.exports = router;
