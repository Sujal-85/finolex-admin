const express = require('express');
const Student = require('../models/Student');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');
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

        // Calculate balance for each student
        const studentsWithBalance = students.map(student => {
            let planPrice = planPriceMap[student.currentPlan];

            // Fallback: If student has no plan or mismatch, use the single active plan
            if (planPrice === undefined && singleActivePlan) {
                planPrice = singleActivePlan.price;
            } else if (planPrice === undefined) {
                planPrice = 0;
            }

            // Sum up payments for this student
            const totalPaid = payments
                .filter(p => p.studentId.toString() === student._id.toString())
                .reduce((sum, p) => sum + p.amount, 0);

            // Let's allow negative balance to indicate credit
            const calculatedBalance = planPrice - totalPaid;

            return {
                ...student,
                currentPlan: student.currentPlan || (singleActivePlan?.name),
                balance: calculatedBalance
            };
        });

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

        // Calculate balance
        let plan = await Plan.findOne({ name: student.currentPlan }).lean();

        // Fallback: If not found, use the single active plan
        if (!plan) {
            const activePlans = await Plan.find({ active: true }).lean();
            if (activePlans.length === 1) {
                plan = activePlans[0];
            }
        }

        const payments = await Payment.find({ studentId: student._id, status: 'Completed' }).lean();

        const planPrice = plan ? plan.price : 0;
        const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

        // Calculate dynamic balance
        student.balance = planPrice - totalPaid;

        if (plan) {
            student.currentPlan = plan.name;
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
