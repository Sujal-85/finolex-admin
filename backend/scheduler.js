const cron = require('node-cron');
const Announcement = require('./models/Announcement');
const Notification = require('./models/Notification');

const initScheduler = (io) => {
    console.log('Scheduler Initialized');

    // Run every minute
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

    // You can add more cleanup tasks or periodic jobs here
};

module.exports = initScheduler;
