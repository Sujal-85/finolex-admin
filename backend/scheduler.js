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
};

module.exports = initScheduler;
