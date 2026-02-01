require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const menuRoutes = require('./routes/menuRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const complaintRoutes = require('./routes/complaintRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const statsRoutes = require('./routes/statsRoutes');
const chatRoutes = require('./routes/chatRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const planRoutes = require('./routes/planRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');

const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins for now, or match your frontend URL
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE"]
    }
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Socket.io Middleware to make io available in routes
app.use((req, res, next) => {
    req.io = io;
    next();
});

console.log('Registering Routes...');
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/upload', require('./routes/uploadRoutes'));
app.use('/api/announcements', announcementRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/coupons', require('./routes/couponRoutes'));

console.log('Loading Settlement Routes...');
app.use('/api/settlements', require('./routes/settlementRoutes'));
app.use('/api/activity-logs', require('./routes/activityLogRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/receipts', require('./routes/receiptRoutes'));

// Keep-Alive Endpoint
app.get('/ping', (req, res) => {
    res.status(200).send('pong');
});

// Base route
app.get('/', (req, res) => {
    res.send('Finolex Canteen Admin API is running');
});

// Socket.io Connection Handler
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Database Connection
mongoose.connection.on('connecting', () => console.error("⏳ MongoDB: Connecting..."));
mongoose.connection.on('connected', () => console.error("✅ MongoDB: Connected"));
mongoose.connection.on('disconnecting', () => console.error("🔌 MongoDB: Disconnecting..."));
mongoose.connection.on('disconnected', () => console.error("❌ MongoDB: Disconnected"));
mongoose.connection.on('error', (err) => console.error("💥 MongoDB Error:", err));

console.error("DEBUG: MONGODB_URI starts with: " + (process.env.MONGODB_URI ? process.env.MONGODB_URI.substring(0, 15) + "..." : "UNDEFINED"));

mongoose.connect(process.env.MONGODB_URI, {
    family: 4, // Force IPv4
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
})
    .then(async () => {
        console.log('✅ Connected to MongoDB');

        // Auto-fix indexes
        try {
            const User = require('./models/User');
            await User.syncIndexes();
            console.log('User Indexes Synced');
        } catch (idxError) {
            console.warn('Index sync failed:', idxError.message);
        }
    })
    .catch((err) => {
        console.error('❌ MongoDB Connection Error:', err);
        // Do not exit, keep server running to serve health checks (though API will fail)
    });

// Start Server IMMEDIATELY to satisfy Cloud Run start probe
server.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);

    // Initialize Scheduler
    const initScheduler = require('./scheduler');
    initScheduler(io);
});
