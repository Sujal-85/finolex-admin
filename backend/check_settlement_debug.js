const mongoose = require('mongoose');
const Order = require('./models/Order');
require('dotenv').config();

const checkOrders = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to DB");

        const allOrders = await Order.find({});
        console.log(`Total Orders: ${allOrders.length}`);

        const completedOrders = await Order.find({ status: 'Completed' });
        console.log(`Completed Orders: ${completedOrders.length}`);

        if (completedOrders.length > 0) {
            console.log("Sample Completed Order:", JSON.stringify(completedOrders[0], null, 2));

            const total = completedOrders.reduce((acc, order) => {
                console.log(`Order ${order._id}: amount=${order.totalAmount} (type: ${typeof order.totalAmount})`);
                return acc + (order.totalAmount || 0);
            }, 0);
            console.log(`Calculated Total in Script: ${total}`);
        } else {
            console.log("No completed orders found. Settlement will be 0.");

            // List pending orders
            const pending = await Order.find({ status: { $ne: 'Completed' } });
            console.log("Other Orders statuses:", pending.map(o => `${o.eventName}: ${o.status}`));
        }

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

checkOrders();
