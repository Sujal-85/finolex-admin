---
description: How to set up and configure n8n Email Notifications
---

# Setup n8n Email Notifications

This workflow guides you through setting up n8n to receive order and payment notifications from the Admin Portal.

## 1. Create n8n Workflow
1. Open your n8n instance.
2. Create a new workflow.
3. Add a **Webhook** trigger node:
   - Method: `POST`
   - Path: `finolex-notifications`
   - **Important**: Copy the *Test URL* for testing, then the *Production URL* for deployment.
4. Add a **Gmail** (or Email) node connected to the Webhook:
   - **To**: `help.prasannacaterers@gmail.com`
   - **Subject**: `{{$json.body.subject}}`
   - **Body**: `{{$json.body.message}}`
   - **Details**: Append `{{JSON.stringify($json.body.details, null, 2)}}` to the body for full details.
5. Save and **Activate** the workflow.

## 2. Configure Backend
1. Open `backend/.env`.
2. Update `N8N_WEBHOOK_URL` with your **Production URL** from n8n.
   ```env
   N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/finolex-notifications
   ```
3. Restart the backend server:
   ```bash
   # In backend/ directory
   npm run dev
   ```

## 3. Test Notifications
1. **Create an Order**: Go to Admin Dashboard -> Create Order.
2. **Make a Payment**: Go to Payments -> Add Payment.
3. Check `help.prasannacaterers@gmail.com` for the email.

> [!NOTE]
> The backend logs `[n8n] Notification sent: ...` on success. Check the backend terminal if emails don't arrive.
