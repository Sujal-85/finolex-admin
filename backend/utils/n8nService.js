const axios = require('axios');

/**
 * Sends a notification payload to the n8n webhook.
 * 
 * @param {Object} data - The data to send.
 * @param {string} data.type - Type of notification (e.g., 'new_order', 'payment_received').
 * @param {string} data.recipientEmail - (Optional) Specific recipient, defaults to admin.
 * @param {string} data.subject - Subject line for the email.
 * @param {string} data.message - Body content of the email.
 * @param {Object} data.details - Additional structured data (e.g., order details, amount).
 */
const sendNotification = async (data) => {
    try {
        const webhookUrl = process.env.N8N_WEBHOOK_URL;

        if (!webhookUrl) {
            console.warn("N8N_WEBHOOK_URL is not set. Skipping email notification.");
            return;
        }

        const payload = {
            ...data,
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development'
        };

        // Fire and forget - don't block the main thread
        axios.post(webhookUrl, payload)
            .then(response => {
                console.log(`[n8n] Notification sent: ${data.type}`);
            })
            .catch(error => {
                console.error(`[n8n] Failed to send notification: ${error.message}`);
            });

    } catch (error) {
        console.error("n8n Service Error:", error);
    }
};

module.exports = { sendNotification };
