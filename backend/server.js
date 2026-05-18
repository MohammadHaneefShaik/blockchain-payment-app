const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { initSocket } = require('./socket');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

// Initialize socket connection manager
initSocket(io);

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/', (req, res) => {
    res.json({ message: 'BlockPay Backend Running', status: 'ok' });
});

// Debug endpoint — open http://127.0.0.1:5000/debug in browser
app.get('/debug', async (req, res) => {
    const User = require('./models/User');
    const info = {
        mongoState: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState],
        mongoURI: process.env.MONGO_URI ? '✅ Set' : '❌ NOT SET',
        jwtSecret: process.env.JWT_SECRET ? '✅ Set' : '❌ NOT SET',
        encryptionSecret: process.env.ENCRYPTION_SECRET ? '✅ Set' : '❌ NOT SET',
        adminKey: process.env.ADMIN_PRIVATE_KEY ? '✅ Set' : '❌ NOT SET',
        rpcUrl: process.env.RPC_URL || 'Using default',
        socketIO: '✅ Active',
    };

    // Try a test DB operation
    if (mongoose.connection.readyState === 1) {
        try {
            const count = await User.countDocuments();
            info.dbTest = '✅ DB works, user count: ' + count;
        } catch (err) {
            info.dbTest = '❌ DB query failed: ' + err.message;
        }
    } else {
        info.dbTest = '❌ Not connected to MongoDB';
    }

    res.json(info);
});

// Validate required env vars on startup
const requiredVars = ['MONGO_URI', 'JWT_SECRET', 'ENCRYPTION_SECRET'];
for (const v of requiredVars) {
    if (!process.env[v]) {
        console.warn(`⚠️  Missing required env var: ${v}`);
    }
}

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI;
mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('✅ MongoDB Connected', MONGO_URI);
        const PORT = process.env.PORT || 5000;
        server.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`🔌 Socket.IO ready`);
            console.log(`🔗 RPC: ${process.env.RPC_URL || 'https://rpc-amoy.polygon.technology'}`);
        });
    })
    .catch((err) => {
        console.error('❌ MongoDB Connection Error:', err.message);
        // Start server anyway for development
        const PORT = process.env.PORT || 5000;
        server.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT} (without DB)`);
            console.log(`🔌 Socket.IO ready`);
        });
    });
