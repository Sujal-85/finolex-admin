const ActivityLog = require('../models/ActivityLog');

const logActivity = async (data) => {
    try {
        const { user, action, module, details, ipAddress, status } = data;

        // Create new log entry
        const newLog = new ActivityLog({
            user: user || 'System',
            action,
            module,
            details,
            ipAddress,
            status: status || 'success'
        });

        await newLog.save();
        console.log(`[Activity Logged] ${action} - ${module}`);
    } catch (error) {
        console.error('Error logging activity:', error);
        // Don't throw error to prevent blocking main flow
    }
};

module.exports = logActivity;
