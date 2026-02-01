const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const auth = require('../middleware/auth');
const logActivity = require('../utils/activityLogger');

// Bulk Mark Attendance
router.post('/bulk', auth, async (req, res) => {
    try {
        const { date, attendanceData } = req.body;
        // attendanceData: [{ studentId: "...", breakfast: "present", lunch: "absent", ... }]

        if (!date || !attendanceData || !Array.isArray(attendanceData)) {
            return res.status(400).send({ error: 'Invalid request data' });
        }

        // Legacy support or strict validation?
        // Let's assume new payload format for "all meals" support.
        // We iterate and apply updates for ANY meal key present in the record object.

        // Parse the provided date (YYYY-MM-DD)
        const dateInput = new Date(date); // UTC Midnight inferred from string

        // Define IST Day Boundaries for the given date
        // Start: 00:00 IST = Previous Day 18:30 UTC
        const istStart = new Date(dateInput);
        istStart.setUTCHours(0, 0, 0, 0);
        istStart.setTime(istStart.getTime() - (5.5 * 60 * 60 * 1000));

        // End: 23:59:59 IST = Current Day 18:29:59 UTC
        // We use < start of next day (18:30 UTC)
        const istEnd = new Date(istStart.getTime() + (24 * 60 * 60 * 1000));

        // Standard Storage Date: UTC Midnight (00:00 Z) of the requested day
        // This is cleaner for DB reading. 00:00 Z is 05:30 IST (Morning of the day).
        const standardDate = new Date(dateInput);
        standardDate.setUTCHours(0, 0, 0, 0);

        // We process sequentially to handle the "Find existing in range OR Create new" logic
        // BulkWrite with 'upsert' works but relies on a strict filter.
        // We can't filter by range in proper 'upsert' unique index logic if the index is strict {student, date}.
        // BUT logic: If we use standardDate (00:00Z), and existing is 18:30Z. They differ. Upsert creates duplicate.
        // So we MUST Find first.

        // Since we want efficiency, let's fetch ALL existing records for these students on this day first.
        const studentIds = attendanceData.map(r => r.studentId);
        const existingRecords = await Attendance.find({
            student: { $in: studentIds },
            date: { $gte: istStart, $lt: istEnd }
        });

        const existingMap = {}; // studentId -> record
        existingRecords.forEach(r => {
            existingMap[r.student.toString()] = r;
        });

        const operations = attendanceData.map(record => {
            const updateField = {};
            // Iterate over potential meal keys
            ['breakfast', 'lunch', 'dinner'].forEach(m => {
                const val = record[m] || record[m.charAt(0).toUpperCase() + m.slice(1)];
                if (val) {
                    updateField[`meals.${m}.status`] = val;
                    updateField[`meals.${m}.markedAt`] = new Date();
                    updateField[`meals.${m}.verifiedAt`] = null;
                }
            });

            if (Object.keys(updateField).length === 0) return null;

            const existing = existingMap[record.studentId];

            if (existing) {
                return {
                    updateOne: {
                        filter: { _id: existing._id },
                        update: { $set: updateField }
                    }
                };
            } else {
                return {
                    updateOne: {
                        filter: { student: record.studentId, date: standardDate },
                        update: { $set: updateField },
                        upsert: true
                    }
                };
            }
        });

        if (operations.length > 0) {
            await Attendance.bulkWrite(operations);
        }

        await logActivity({
            user: req.user.name || 'Admin',
            action: 'Bulk Attendance Entry',
            module: 'attendance',
            details: `Marked attendance for ${attendanceData.length} students on ${standardDate.toLocaleDateString()}`,
            ipAddress: req.ip
        });

        res.status(200).send({ message: 'Attendance marked successfully' });
    } catch (error) {
        console.error("Error bulk marking attendance:", error);
        res.status(500).send(error);
    }
});

// Get Attendance Records with Filters
// This needs to return "records" that the frontend table can display.
// The frontend expects: { student, date, meal, status, state }
// We have to flatten the nested structure.
router.get('/', auth, async (req, res) => {
    try {
        const { date, meal, status, studentId, populate } = req.query;

        const query = {};
        if (date) {
            const dateInput = new Date(date);
            // IST Day Range
            const istStart = new Date(dateInput);
            istStart.setUTCHours(0, 0, 0, 0);
            istStart.setTime(istStart.getTime() - (5.5 * 60 * 60 * 1000));

            const istEnd = new Date(istStart.getTime() + (24 * 60 * 60 * 1000));

            query.date = { $gte: istStart, $lt: istEnd };
        }

        if (studentId) {
            query.student = studentId;
        }

        let queryBuilder = Attendance.find(query).sort({ createdAt: -1 });

        // Default to true unless explicitly 'false'
        if (populate !== 'false') {
            queryBuilder = queryBuilder.populate('student', 'name rollNo department year');
        }

        const docs = await queryBuilder.lean();

        const flattenedRecords = [];

        docs.forEach(doc => {
            const mealsToCheck = meal && meal !== 'all' ? [meal.toLowerCase()] : ['breakfast', 'lunch', 'dinner'];

            mealsToCheck.forEach(mKey => {
                const mData = doc.meals ? doc.meals[mKey] : null;
                // Only include if marked
                if (mData && mData.status !== 'not_marked') {
                    // Filter by status if requested
                    if (status && status !== 'all' && mData.status !== status) return;

                    // Determine "State" (Pending/Verified)
                    const state = mData.verifiedAt ? 'verified' : 'pending';

                    flattenedRecords.push({
                        _id: doc._id, // Document ID
                        student: doc.student,
                        date: doc.date,
                        meal: mKey.charAt(0).toUpperCase() + mKey.slice(1), // Capitalize for display 'Breakfast'
                        status: mData.status,
                        state: state,
                        markedAt: mData.markedAt,
                        verifiedAt: mData.verifiedAt
                    });
                }
            });
        });

        res.send(flattenedRecords);
    } catch (error) {
        console.error("Error fetching attendance:", error);
        res.status(500).send(error);
    }
});

// Update/Verify Attendance Record
// Frontend sends PATCH /:id with { state: 'verified' } usually.
// But now ID is whole day. We need to know WHICH MEAL to verify.
// Frontend should arguably send the flattened object back or we accept 'meal' in body.
router.patch('/:id', auth, async (req, res) => {
    try {
        const { meal, state, status } = req.body;
        // meal: 'Breakfast', 'Lunch', ...
        // state: 'verified'

        if (!meal) return res.status(400).send({ error: 'Meal type required' });

        const mealKey = meal.toLowerCase();
        const updateFields = {};

        if (status && ['present', 'absent'].includes(status)) {
            updateFields[`meals.${mealKey}.status`] = status;
            // If status changes, maybe reset verification? User didn't specify, but safe to assume if I change to Absent, it should probably be re-verified or remain verified if Admin is doing it. 
            // Let's assume Admin edits are implicitly trusted, but for now just update status.
        }

        if (state === 'verified') {
            updateFields[`meals.${mealKey}.verifiedAt`] = new Date();
        } else if (state === 'pending') {
            updateFields[`meals.${mealKey}.verifiedAt`] = null;
        }

        const record = await Attendance.findByIdAndUpdate(
            req.params.id,
            { $set: updateFields },
            { new: true }
        ).populate('student', 'name');

        if (!record) return res.status(404).send({ error: 'Record not found' });

        await logActivity({
            user: req.user.name || 'Admin',
            action: 'Verify Attendance',
            module: 'attendance',
            details: `Verified attendance for ${record.student.name} - ${meal}`,
            ipAddress: req.ip
        });

        res.send(record);
    } catch (error) {
        res.status(500).send(error);
    }
});

// Monthly Report Endpoint
router.get('/report/monthly', auth, async (req, res) => {
    try {
        const { month, year } = req.query;

        if (!month || !year) {
            return res.status(400).send({ error: 'Month and year are required' });
        }

        // Use UTC to ensure we capture the full global day range correctly
        // Calculate Month Range in IST
        // Start: 1st of Month 00:00 IST -> Previous Day 18:30 UTC
        const startRaw = new Date(Date.UTC(year, month - 1, 1));
        const startDate = new Date(startRaw.getTime() - (5.5 * 60 * 60 * 1000));

        // End: Last of Month 23:59:59 IST -> End Date 18:29:59 UTC
        // Actually, since we store only Midnight points for records, we just need to cover the range of 'dates'.
        // So EndDate can be 1st of Next Month IST Midnight (exclusive) or just cover the last day.
        // Let's go to 1st of Next Month IST Midnight to be safe and use $lt
        const endRaw = new Date(Date.UTC(year, month, 1));
        const endDate = new Date(endRaw.getTime() - (5.5 * 60 * 60 * 1000));

        // Fetch all attendance records for the month
        // date >= startDate AND date < endDate
        const attendanceRecords = await Attendance.find({
            date: { $gte: startDate, $lt: endDate }
        }).populate('student', 'name rollNo department year').lean();

        // Process data to aggregate counts per student
        const report = {};

        attendanceRecords.forEach(record => {
            const studentId = record.student._id.toString();

            if (!report[studentId]) {
                report[studentId] = {
                    student: record.student,
                    totalPresent: 0,
                    totalAbsent: 0,
                    daysPresent: new Set()
                };
            }

            // Check each meal
            ['breakfast', 'lunch', 'dinner'].forEach(meal => {
                const mealData = record.meals[meal];
                if (mealData && mealData.status === 'present') {
                    report[studentId].totalPresent++;
                    report[studentId].daysPresent.add(record.date.toISOString().split('T')[0]);
                } else if (mealData && mealData.status === 'absent') {
                    report[studentId].totalAbsent++;
                }
            });
        });

        // Convert report object to array
        const reportArray = Object.values(report).map(item => ({
            ...item,
            daysPresent: item.daysPresent.size // Convert Set to count of unique days present
        }));

        res.send(reportArray);

    } catch (error) {
        console.error("Error generating monthly report:", error);
        res.status(500).send(error);
    }
});

module.exports = router;
