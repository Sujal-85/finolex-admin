require('dotenv').config();
const mongoose = require('mongoose');
const Announcement = require('./models/Announcement');
const Notification = require('./models/Notification');
const Student = require('./models/Student');
const Plan = require('./models/Plan');

// Mock Socket.io (Real-time events won't work from standalone script, but DB records will be created)
const mockIo = {
    emit: (event, data) => {
        console.log(`[Socket Mock] Emitted '${event}':`, JSON.stringify(data, null, 2));
    }
};

const runTests = async () => {
    console.log('--- Finolex Admin Scheduler Manual Test (LIVE MODE) ---');
    console.log('WARNING: This WILL modify database records (Notifications, Balances, etc.)');

    // Connect to DB
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');
    } catch (err) {
        console.error('❌ MongoDB Connection Failed:', err);
        process.exit(1);
    }

    // --- TEST FUNCTIONS (Mirrors scheduler.js logic) ---

    // 1. Announcements
    const testAnnouncements = async () => {
        console.log('\n--- Testing Announcements ---');
        try {
            const now = new Date();
            const scheduledAnnouncements = await Announcement.find({
                status: 'scheduled',
                scheduledDate: { $lte: now },
                active: true
            });

            if (scheduledAnnouncements.length > 0) {
                console.log(`Processing ${scheduledAnnouncements.length} scheduled announcements...`);

                for (const announcement of scheduledAnnouncements) {
                    // ACTUALLY UPDATE AND NOTIFY
                    announcement.status = 'published';
                    await announcement.save();

                    const notification = await Notification.create({
                        title: 'New Announcement',
                        message: announcement.title,
                        type: 'announcement'
                    });

                    console.log(`[Published] Announcement: ${announcement.title}`);
                }
            } else {
                console.log('No pending announcements found (Expected if none are scheduled for now).');
            }
        } catch (error) {
            console.error('Error testing announcements:', error);
        }
    };

    // 2. Global Plan Assignment
    const testPlanAssignment = async () => {
        console.log('\n--- Testing Global Plan Assignment ---');
        try {
            const activePlan = await Plan.findOne({ active: true });
            if (!activePlan) {
                console.log('No active plan found.');
                return;
            }
            console.log(`Active Plan: ${activePlan.name}`);

            const students = await Student.find({});
            let updatedCount = 0;

            for (const student of students) {
                const alreadyHas = (student.activePlans || []).some(
                    p => (p.planId && p.planId.toString() === activePlan._id.toString()) ||
                        (p.name === activePlan.name)
                );

                if (!alreadyHas) {
                    console.log(`[Assigning] ${activePlan.name} to ${student.name}`);

                    student.activePlans.push({
                        planId: activePlan._id,
                        name: activePlan.name,
                        price: activePlan.price || 3500,
                        startDate: activePlan.startDate,
                        endDate: activePlan.endDate,
                        status: 'pending',
                        addedAt: new Date()
                    });

                    student.balance = (student.balance || 0) + (activePlan.price || 3500);
                    student.paymentStatus = student.balance > 0 ? 'pending' : 'paid';

                    await Student.updateOne({ _id: student._id }, {
                        $set: {
                            activePlans: student.activePlans,
                            balance: student.balance,
                            paymentStatus: student.paymentStatus
                        }
                    });
                    updatedCount++;
                }
            }

            if (updatedCount > 0) {
                console.log(`[Result] updated ${updatedCount} students.`);
            } else {
                console.log('[Result] All students already have the active plan.');
            }
        } catch (error) {
            console.error('Error testing plan assignment:', error);
        }
    };

    // 3. Daily Late Fee
    const testLateFees = async () => {
        console.log('\n--- Testing Daily Late Fee ---');
        try {
            const students = await Student.find({ balance: { $gt: 0 } });
            let finedCount = 0;
            const now = new Date();

            for (const student of students) {
                const activePlan = student.activePlans?.find(p => p.status === 'active' || p.status === 'pending');
                if (activePlan && activePlan.startDate) {
                    const startDate = new Date(activePlan.startDate);
                    const daysSinceStart = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));

                    if (daysSinceStart > 7) {
                        // APPLY FINE
                        student.balance = (student.balance || 0) + 5;
                        await Student.updateOne({ _id: student._id }, { $set: { balance: student.balance } });
                        finedCount++;

                        await Notification.create({
                            title: 'Late Fee Applied',
                            message: 'A late fee of ₹5 has been added to your outstanding balance.',
                            type: 'payment',
                            recipient: student._id
                        });
                        console.log(`[Fined] ${student.name}`);
                    }
                }
            }
            console.log(`[Result] Applied fines to ${finedCount} students.`);
        } catch (error) {
            console.error('Error testing late fees:', error);
        }
    };

    // 4. Daily Reminders
    const testReminders = async (batchName) => {
        console.log(`\n--- Testing Reminders (${batchName}) ---`);
        try {
            const studentsWithDues = await Student.find({ balance: { $gt: 0 } });
            const now = new Date();
            let reminderCount = 0;

            for (const student of studentsWithDues) {
                // Simplified Logic: Just check balance > 0
                await Notification.create({
                    title: 'Overdue Payment Reminder',
                    message: `Urgent: You have an outstanding balance of ₹${student.balance} causing daily fines. Please pay immediately.`,
                    type: 'payment',
                    recipient: student._id
                });
                reminderCount++;
            }
            console.log(`[Result] Sent reminders to ${reminderCount} students.`);
            mockIo.emit('newNotification', { title: `${batchName} Reminders`, message: '...' });
        } catch (err) {
            console.error('Error testing reminders:', err);
        }
    };

    // 6. Meal Reminders
    const testMealReminders = async (meal) => {
        console.log(`\n--- Testing Meal Reminder (${meal}) ---`);
        await Notification.create({
            title: `${meal} Served!`,
            message: `${meal} is ready in the canteen.`,
            type: 'menu'
        });
        console.log(`[Created] Notification: ${meal} Served!`);
        mockIo.emit('newNotification', { title: `${meal} Served!`, message: '...' });
    };

    // --- EXECUTION ---
    await testAnnouncements();
    await testPlanAssignment();
    await testLateFees();
    await testReminders('Manual Test Run');
    await testMealReminders('Lunch');

    console.log('\n✅ Manual Test Completed.');
    // console.log('Note: This script simulated the logic without saving changes (stateless check) to preserve data integrity.');
    process.exit(0);
};

runTests();
