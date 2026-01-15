const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Import Models
const Student = require('../models/Student');
const Order = require('../models/Order');
const InventoryItem = require('../models/InventoryItem');
const MenuItem = require('../models/MenuItem');

// Helper to format currency
const formatCurrency = (amount) => `₹${amount.toLocaleString()}`;

// Local Intent Processing Logic
async function processLocalChat(message) {
    const lowerMsg = message.toLowerCase();

    // --- GREETINGS ---
    if (lowerMsg.match(/\b(hi|hello|hey|greetings)\b/)) {
        return "Hello! 👋 I'm your local Canteen Assistant. I can help you with student stats, order updates, stock levels, and today's menu. What would you like to know?";
    }

    // --- STUDENTS ---
    if (lowerMsg.includes('student') || lowerMsg.includes('students')) {
        if (lowerMsg.includes('count') || lowerMsg.includes('how many') || lowerMsg.includes('total')) {
            const count = await Student.countDocuments();
            const activeCount = await Student.countDocuments({ status: 'active' });
            return `There are currently **${count}** registered students, with **${activeCount}** active accounts. 🎓`;
        }
        if (lowerMsg.includes('hostel')) {
            // Example aggregate to count per hostel
            const hostelStats = await Student.aggregate([
                { $group: { _id: "$hostel", count: { $sum: 1 } } }
            ]);
            const statsStr = hostelStats.map(h => `- ${h._id || 'Unknown'}: ${h.count}`).join('\n');
            return `Here is the student breakdown by hostel:\n${statsStr}`;
        }
        // Procedures
        if (lowerMsg.includes('add') || lowerMsg.includes('create') || lowerMsg.includes('new')) {
            return "👨‍🎓 **How to Add a Student**:\n1. Go to the **Students** page.\n2. Click the **+ Add Student** button (top right).\n3. Fill in the Roll No, Name, and details.\n4. Click **Save**.";
        }
        if (lowerMsg.includes('edit') || lowerMsg.includes('update') || lowerMsg.includes('modify')) {
            return "✏️ **How to Edit a Student**:\n1. Navigate to the **Students** list.\n2. Find the student and click the **Edit (Pencil)** icon.\n3. Update their details and save.";
        }
    }

    // --- ORDERS ---
    if (lowerMsg.includes('order') || lowerMsg.includes('orders')) {
        if (lowerMsg.includes('pending')) {
            const pendingCount = await Order.countDocuments({ status: 'Pending' });
            return `You have **${pendingCount}** pending orders that need attention. ⏳`;
        }
        if (lowerMsg.includes('today')) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const count = await Order.countDocuments({ createdAt: { $gte: today } });
            return `There have been **${count}** orders placed today. 📅`;
        }
        const total = await Order.countDocuments();

        // Procedures
        if (lowerMsg.includes('create') || lowerMsg.includes('new')) {
            return "📝 **Create a Mess Order**:\n1. Go to **Mess Orders**.\n2. Click **Create New Order**.\n3. Fill in Event Name, Date, and Guest Count.\n4. Submit to track it.";
        }
        if (lowerMsg.includes('handle') || lowerMsg.includes('manage') || lowerMsg.includes('status')) {
            return "✅ **Handle Orders**:\n1. In **Mess Orders**, view the list.\n2. Use the Status dropdown to change from 'Pending' to 'In Progress' or 'Completed'.\n3. This tracks the order lifecycle.";
        }

        return `Total orders in the system: **${total}**. You can filter them by status in the Orders tab.`;
    }

    // --- INVENTORY ---
    if (lowerMsg.includes('stock') || lowerMsg.includes('inventory') || lowerMsg.includes('item')) {
        if (lowerMsg.includes('low') || lowerMsg.includes('running out')) {
            // Find items where quantity <= minThreshold
            const lowStockItems = await InventoryItem.find({ $expr: { $lte: ["$quantity", "$minThreshold"] } }).limit(5);
            if (lowStockItems.length === 0) {
                return "Good news! ✅ No items are currently running low on stock.";
            }
            const list = lowStockItems.map(i => `- **${i.name}**: ${i.quantity} ${i.unit} (Threshold: ${i.minThreshold})`).join('\n');
            return `⚠️ **Low Stock Alert**: The following items are running low:\n${list}\n\nPlease restock them soon!`;
        }
        const totalItems = await InventoryItem.countDocuments();
        return `We have **${totalItems}** unique items in the inventory. Ask me about "low stock" to see alerts. 📦`;
    }

    // --- MENU ---
    if (lowerMsg.includes('menu') || lowerMsg.includes('food') || lowerMsg.includes('lunch') || lowerMsg.includes('dinner') || lowerMsg.includes('breakfast')) {
        // Procedures
        if (lowerMsg.includes('add') || lowerMsg.includes('update') || lowerMsg.includes('create')) {
            return "🍽️ **Manage Menu**:\n1. Go to the **Menu** page.\n2. Select the specific Day (e.g., Monday).\n3. Use the **+ Add Item** button to add new dishes to Breakfast, Lunch, or Dinner.";
        }

        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const todayName = days[new Date().getDay()];

        // MenuItem stores individual items per day (e.g., day: 'Monday', mealType: 'lunch')
        const todayItems = await MenuItem.find({ day: todayName });

        if (todayItems.length === 0) {
            return `I couldn't find any menu items for **${todayName}**. Please check the Menu Management section. 🍽️`;
        }

        const getItems = (type) => {
            const items = todayItems.filter(i => i.mealType === type).map(i => i.name);
            return items.length > 0 ? items.join(', ') : 'Not set';
        };

        let response = `Here is the menu for **${todayName}**:`;
        if (lowerMsg.includes('breakfast')) response += `\n- **Breakfast**: ${getItems('breakfast')}`;
        else if (lowerMsg.includes('lunch')) response += `\n- **Lunch**: ${getItems('lunch')}`;
        else if (lowerMsg.includes('dinner')) response += `\n- **Dinner**: ${getItems('dinner')}`;
        else {
            response += `\n- **Breakfast**: ${getItems('breakfast')}`;
            response += `\n- **Lunch**: ${getItems('lunch')}`;
            response += `\n- **Dinner**: ${getItems('dinner')}`;
        }
        return response;
    }

    // --- REVENUE / FINANCE ---
    if (lowerMsg.includes('revenue') || lowerMsg.includes('income') || lowerMsg.includes('money')) {
        // Simple aggregation for total revenue
        const revenue = await Order.aggregate([
            { $group: { _id: null, total: { $sum: "$totalAmount" } } }
        ]);
        const totalRev = revenue.length > 0 ? revenue[0].total : 0;
        return `Total lifetime revenue is **${formatCurrency(totalRev)}**. 💰`;
    }

    // --- PROCEDURES & HELP (Global) ---
    // 2. Payment Procedures
    if (lowerMsg.includes('payment') || lowerMsg.includes('pay')) {
        if (lowerMsg.includes('add') || lowerMsg.includes('record') || lowerMsg.includes('create')) {
            return "💳 **Record a Payment**:\n1. Open **Quick Add** (+) in the top bar OR go to **Payments**.\n2. Select **Record Payment**.\n3. Enter the Student's Roll No and Amount.\n4. Choose mode (Cash/UPI) and Submit.";
        }
    }

    // 4. Complaint Handling
    if (lowerMsg.includes('complaint')) {
        return "💬 **Handle Complaints**:\n1. Visit the **Complaints** section.\n2. Review pending complaints.\n3. Click **Resolve** to mark them as done, or reply to the student directly.";
    }

    // 5. Announcement Handling
    if (lowerMsg.includes('announcement') || lowerMsg.includes('notice')) {
        return "📢 **Make an Announcement**:\n1. Click **Quick Add** (+) > **Create Announcement**.\n2. Enter a Title and Message.\n3. Select Audience (All Students/Hostel).\n4. Hit **Send** to broadcast instantly.";
    }

    // 6. Reports
    if (lowerMsg.includes('report') || lowerMsg.includes('download')) {
        return "📊 **Download Reports**:\n1. Go to the **Reports** page.\n2. Select the report type (Revenue, Mess Usage, Inventory).\n3. Choose your Date Range.\n4. Click **Download CSV/PDF**.";
    }

    // --- DEFAULT FALLBACK ---
    return "I can help you with:\n- **Procedures**: Ask 'How to add student?', 'How to record payment?', 'How to download reports?'\n- **Stats**: Ask 'Student count', 'Revenue', 'Order status'.\n- **Menu & Stock**: Ask 'Lunch menu', 'Low stock'.\n\nI'm your complete Canteen Guide! 🚀";
}

router.post('/', async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ error: "Message is required" });
        }

        const response = await processLocalChat(message);
        res.json({ response });

    } catch (error) {
        console.error("Local Chat Error:", error);
        res.status(500).json({ error: "Failed to process chat request" });
    }
});

module.exports = router;
