const cron = require('node-cron');
const Announcement = require('./models/Announcement');
const Notification = require('./models/Notification');
const Student = require('./models/Student');
const Plan = require('./models/Plan');

const initScheduler = (io) => {
    console.log('Scheduler Initialized');

    // Run every minute (Announcements)
    cron.schedule('* * * * *', async () => {
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

                    await student.save();
                    updatedCount++;
                }
            }

            if (updatedCount > 0) {
                console.log(`[Admin Scheduler] Updated ${updatedCount} students with new plan.`);
            }
        } catch (error) {
            console.error('[Admin Scheduler] Plan Assignment Error:', error);
        }
    });

    // You can add more cleanup tasks or periodic jobs here
    // 3. Daily Late Fee (Fine) - Runs at Midnight
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
                        await student.save();
                        finedCount++;

                        await Notification.create({
                            title: 'Late Fee Applied',
                            message: 'A late fee of ₹5 has been added to your outstanding balance.',
                            type: 'payment',
                            recipient: student._id
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
    });

    // 4. Random Daily Reminders (3 times between 8 AM - 11 PM)
    cron.schedule('0 8 * * *', () => { // Schedules for the day at 8 AM
        console.log('[Scheduler] Scheduling random reminders for the day...');

        // Window: 15 hours (8 AM to 11 PM) in milliseconds
        const windowMs = 15 * 60 * 60 * 1000;

        // Generate 3 random delays
        const delays = [
            Math.floor(Math.random() * windowMs),
            Math.floor(Math.random() * windowMs),
            Math.floor(Math.random() * windowMs)
        ].sort((a, b) => a - b); // Sort to run in order

        const sendReminders = async (batchNum) => {
            console.log(`[Scheduler] Sending Batch ${batchNum} Reminders...`);
            try {
                const studentsWithDues = await Student.find({ balance: { $gt: 0 } });
                const now = new Date();
                let reminderCount = 0;

                for (const student of studentsWithDues) {
                    // Check if they have an active plan older than 7 days (same logic as fines)
                    const activePlan = student.activePlans?.find(p => p.status === 'active' || p.status === 'pending');

                    if (activePlan && activePlan.startDate) {
                        const startDate = new Date(activePlan.startDate);
                        const daysSinceStart = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));

                        if (daysSinceStart > 7) {
                            await Notification.create({
                                title: 'Overdue Payment Reminder',
                                message: `Urgent: You have an outstanding balance of ₹${student.balance} causing daily fines. Please pay immediately.`,
                                type: 'payment',
                                recipient: student._id
                            });
                            reminderCount++;
                        }
                    }
                }
                console.log(`[Scheduler] Batch ${batchNum}: Sent overdue reminders to ${reminderCount} students.`);
            } catch (err) {
                console.error('[Scheduler] Reminder Batch Error:', err);
            }
        };

        // Schedule the timeouts
        delays.forEach((delay, index) => {
            setTimeout(() => sendReminders(index + 1), delay);
            console.log(`[Scheduler] Reminder ${index + 1} scheduled in ${Math.round(delay / 60000)} minutes.`);
        });
    });

};

module.exports = initScheduler;
