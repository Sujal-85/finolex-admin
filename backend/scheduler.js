const cron = require('node-cron');
const Announcement = require('./models/Announcement');
const Notification = require('./models/Notification');
const Student = require('./models/Student');
const Plan = require('./models/Plan');

const initScheduler = (io) => {
    console.log('Scheduler Initialized');
    console.log(`[Scheduler] Server Date/Time: ${new Date().toString()}`);
    console.log(`[Scheduler] Timezone Check: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`);


    // Run every minute (Announcements)
    cron.schedule('* * * * *', async () => {
        const fs = require('fs');
        const path = require('path');
        const logPath = path.join(__dirname, 'scheduler_heartbeat.log');
        const timestamp = new Date().toISOString();
        const logMsg = `[${timestamp}] Scheduler Heartbeat - Active\n`;

        try {
            fs.appendFileSync(logPath, logMsg);
        } catch (e) {
            console.error("Logging failed", e);
        }
        console.log('[Scheduler Heartbeat] Checking for tasks...');
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
                    announcement.status = 'published';
                    await announcement.save();

                    // Create notification
                    const notification = await Notification.create({
                        title: 'New Announcement',
                        message: announcement.title,
                        type: 'announcement'
                    });

                    // Emit socket event if io is available
                    if (io) {
                        io.emit('newNotification', notification);
                        io.emit('announcementPublished', announcement);
                    }

                    console.log(`Published announcement: ${announcement.title}`);
                }
            }
        } catch (error) {
            console.error('Scheduler Error:', error);
        }
    }, {
        scheduled: true,
        timezone: "Asia/Kolkata"
    });

    // 2. Global Plan Assignment (Admin Side Tracking)
    // Checks every minute (for testing/real-time sync) to assign newly active plans.
    cron.schedule('* * * * *', async () => { // Every Minute
        console.log('[Admin Scheduler] Running Global Plan Assignment Check...');
        try {
            const activePlan = await Plan.findOne({ active: true });
            if (!activePlan) return;

            const students = await Student.find({});
            let updatedCount = 0;

            for (const student of students) {
                const alreadyHas = (student.activePlans || []).some(
                    p => (p.planId && p.planId.toString() === activePlan._id.toString()) ||
                        (p.name === activePlan.name)
                );

                if (!alreadyHas) {
                    console.log(`[Admin Scheduler] Assigning ${activePlan.name} to ${student.name}`);

                    student.activePlans.push({
                        planId: activePlan._id,
                        name: activePlan.name,
                        price: activePlan.price || 3500,
                        startDate: activePlan.startDate,
                        endDate: activePlan.endDate,
                        status: 'pending',
                        addedAt: new Date()
                    });

                    // UPDATE BALANCE (Accumulate)
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
                console.log(`[Admin Scheduler] Updated ${updatedCount} students with new plan.`);
            }
        } catch (error) {
            console.error('[Admin Scheduler] Plan Assignment Error:', error);
        }
    }, {
        scheduled: true,
        timezone: "Asia/Kolkata"
    });

    // You can add more cleanup tasks or periodic jobs here
    // 3. Daily Late Fee (Fine) - Runs at Midnight IST
    cron.schedule('0 0 * * *', async () => {
        console.log('[Scheduler] Running Daily Late Fee Check...');
        try {
            const students = await Student.find({ balance: { $gt: 0 } });
            let finedCount = 0;
            const now = new Date();

            for (const student of students) {
                // Check if they have an active plan older than 7 days
                const activePlan = student.activePlans?.find(p => p.status === 'active' || p.status === 'pending');

                if (activePlan && activePlan.startDate) {
                    const startDate = new Date(activePlan.startDate);
                    const daysSinceStart = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));

                    if (daysSinceStart > 7) {
                        // Apply ₹5 fine
                        student.balance = (student.balance || 0) + 5;
                        await Student.updateOne({ _id: student._id }, { $set: { balance: student.balance } });
                        finedCount++;

                        await Notification.create({
                            title: 'Late Fee Applied',
                            message: 'A late fee of ₹5 has been added to your outstanding balance.',
                            type: 'payment',
                            recipient: student._id
                        });

                        if (io) io.emit('newNotification', {
                            title: 'Late Fee Applied',
                            message: 'A late fee of ₹5 has been added to your outstanding balance.',
                            type: 'payment',
                            recipient: student._id,
                            createdAt: new Date()
                        });
                    }
                }
            }
            if (finedCount > 0) {
                console.log(`[Scheduler] Applied fines to ${finedCount} students.`);
            }
        } catch (error) {
            console.error('[Scheduler] Late Fee Error:', error);
        }
    }, {
        scheduled: true,
        timezone: "Asia/Kolkata"
    });

    // 4. Random Daily Reminders (3 times between 8 AM - 11 PM IST)
    // 4. Fixed Daily Reminders (10 AM, 2 PM, 7 PM IST)
    const sendReminders = async (batchName) => {
        console.log(`[Scheduler] Sending ${batchName} Reminders...`);
        try {
            const studentsWithDues = await Student.find({ balance: { $gt: 0 } });
            const now = new Date();
            let reminderCount = 0;

            for (const student of studentsWithDues) {
                // Simplified: Send reminder if balance > 0, regardless of plan status
                await Notification.create({
                    title: 'Overdue Payment Reminder',
                    message: `Urgent: You have an outstanding balance of ₹${student.balance} causing daily fines. Please pay immediately.`,
                    type: 'payment',
                    recipient: student._id
                });

                if (io) io.emit('newNotification', {
                    title: 'Overdue Payment Reminder',
                    message: `Urgent: You have an outstanding balance of ₹${student.balance} causing daily fines. Please pay immediately.`,
                    type: 'payment',
                    recipient: student._id,
                    createdAt: new Date()
                });
                reminderCount++;
            }
            console.log(`[Scheduler] ${batchName}: Sent overdue reminders to ${reminderCount} students.`);
        } catch (err) {
            console.error('[Scheduler] Reminder Batch Error:', err);
        }
    };

    // Schedule: 10:00 AM
    cron.schedule('0 10 * * *', () => sendReminders('Morning'), {
        scheduled: true,
        timezone: "Asia/Kolkata"
    });

    // Schedule: 2:00 PM
    cron.schedule('0 14 * * *', () => sendReminders('Afternoon'), {
        scheduled: true,
        timezone: "Asia/Kolkata"
    });

    // Schedule: 7:00 PM
    cron.schedule('0 19 * * *', () => sendReminders('Evening'), {
        scheduled: true,
        timezone: "Asia/Kolkata"
    });



    // 5. Keep-Alive Self Ping (Every 14 minutes, Active Hours Only)
    // Runs 00:00-00:59 and 07:00-23:59 IST.
    cron.schedule('*/14 0,7-23 * * *', async () => {
        const axios = require('axios');
        const SERVER_URL = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 5000}`;

        console.log(`[Keep-Alive] Pinging server at ${SERVER_URL}/ping...`);
        try {
            await axios.get(`${SERVER_URL}/ping`);
            console.log('[Keep-Alive] Ping successful.');
        } catch (error) {
            console.error('[Keep-Alive] Ping failed:', error.message);
        }
    }, {
        scheduled: true,
        timezone: "Asia/Kolkata"
    });

    // 6. Meal Reminders (IST)
    // Breakfast - 8:00 AM
    cron.schedule('0 8 * * *', async () => {
        try {
            const notification = await Notification.create({
                title: 'Breakfast is Ready! 🍳',
                message: 'Good Morning! Breakfast is being served in the canteen.',
                type: 'menu'
            });
            if (io) io.emit('newNotification', notification);
            console.log('[Scheduler] Breakfast reminder sent.');

        } catch (err) {
            console.error('[Scheduler] Breakfast Reminder Error:', err);
        }
    }, {
        scheduled: true,
        timezone: "Asia/Kolkata"
    });

    // Lunch - 12:30 PM
    cron.schedule('30 12 * * *', async () => {
        try {
            const notification = await Notification.create({
                title: 'Lunch Time! 🍛',
                message: 'Lunch is now being served. Don\'t miss your meal!',
                type: 'menu'
            });
            if (io) io.emit('newNotification', notification);
            console.log('[Scheduler] Lunch reminder sent.');

        } catch (err) {
            console.error('[Scheduler] Lunch Reminder Error:', err);
        }
    }, {
        scheduled: true,
        timezone: "Asia/Kolkata"
    });

    // Dinner - 7:30 PM
    cron.schedule('30 19 * * *', async () => {
        try {
            const notification = await Notification.create({
                title: 'Dinner Served! 🍽️',
                message: 'Dinner is ready in the canteen. Please come and have your meal.',
                type: 'menu'
            });
            if (io) io.emit('newNotification', notification);
            console.log('[Scheduler] Dinner reminder sent.');

        } catch (err) {
            console.error('[Scheduler] Dinner Reminder Error:', err);
        }
    }, {
        scheduled: true,
        timezone: "Asia/Kolkata"
    });

};

module.exports = initScheduler;
