const express = require('express');
const Student = require('../models/Student');
const Payment = require('../models/Payment');
const Complaint = require('../models/Complaint');
const InventoryItem = require('../models/InventoryItem');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/', auth, async (req, res) => {
    try {
        const totalStudents = await Student.countDocuments();
        const activeStudents = await Student.countDocuments({ status: 'Active' });

        // Calculate total revenue (sum of all completed payments)
        const payments = await Payment.find({ status: 'Completed' });
        const totalRevenue = payments.reduce((acc, curr) => acc + curr.amount, 0);

        const pendingComplaints = await Complaint.countDocuments({ status: 'Pending' });
        const lowStockItems = await InventoryItem.countDocuments({ status: 'Low Stock' });

        res.send({
            totalStudents,
            activeStudents,
            totalRevenue,
            pendingComplaints,
            lowStockItems
        });
    } catch (error) {
        res.status(500).send(error);
    }
});

router.get('/analytics', auth, async (req, res) => {
    try {
        // 1. Revenue Trend (Last 6 Months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const revenueData = await Payment.aggregate([
            {
                $match: {
                    status: 'Completed',
                    date: { $gte: sixMonthsAgo }
                }
            },
            {
                $group: {
                    _id: {
                        month: { $month: "$date" },
                        year: { $year: "$date" }
                    },
                    revenue: { $sum: "$amount" }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);

        // Format revenue data for frontend
        const formattedRevenue = revenueData.map(item => {
            const date = new Date(item._id.year, item._id.month - 1);
            return {
                month: date.toLocaleString('default', { month: 'short' }),
                revenue: item.revenue
            };
        });

        // 2. Plan Distribution
        const planDistribution = await Student.aggregate([
            {
                $group: {
                    _id: "$currentPlan",
                    value: { $sum: 1 }
                }
            }
        ]);

        const formattedPlanDist = planDistribution.map((item, index) => ({
            name: item._id || "No Plan",
            value: item.value,
            color: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"][index % 4] // Assign colors cyclically
        }));

        // 3. Complaint Categories
        const complaintCategories = await Complaint.aggregate([
            {
                $group: {
                    _id: "$category",
                    count: { $sum: 1 }
                }
            }
        ]);

        const formattedComplaints = complaintCategories.map(item => ({
            category: item._id ? item._id.charAt(0).toUpperCase() + item._id.slice(1) : "Uncategorized",
            count: item.count
        }));

        // 4. Monthly Enrollment (Last 6 Months)
        const enrollmentData = await Student.aggregate([
            {
                $match: {
                    createdAt: { $gte: sixMonthsAgo }
                }
            },
            {
                $group: {
                    _id: {
                        month: { $month: "$createdAt" },
                        year: { $year: "$createdAt" }
                    },
                    students: { $sum: 1 }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);

        const formattedEnrollment = enrollmentData.map(item => {
            const date = new Date(item._id.year, item._id.month - 1);
            return {
                month: date.toLocaleString('default', { month: 'short' }),
                students: item.students
            };
        });

        res.json({
            revenueData: formattedRevenue,
            planDistribution: formattedPlanDist,
            complaintCategories: formattedComplaints,
            monthlyEnrollment: formattedEnrollment
        });

    } catch (error) {
        console.error("Analytics Error:", error);
        res.status(500).json({ error: "Failed to fetch analytics data" });
    }
});

module.exports = router;
