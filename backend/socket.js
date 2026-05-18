// Socket.IO connection manager
// Maps user phone numbers to socket IDs for real-time notifications

const connectedUsers = new Map(); // phone -> socketId

let ioInstance = null;

const initSocket = (io) => {
    ioInstance = io;

    io.on('connection', (socket) => {
        console.log('🔌 Socket connected:', socket.id);

        // User registers with their phone number after connecting
        socket.on('register', (phone) => {
            if (phone) {
                connectedUsers.set(phone, socket.id);
                console.log(`📱 User registered: ${phone} -> ${socket.id}`);
            }
        });

        socket.on('disconnect', () => {
            // Remove user from connected map
            for (const [phone, id] of connectedUsers.entries()) {
                if (id === socket.id) {
                    connectedUsers.delete(phone);
                    console.log(`📱 User disconnected: ${phone}`);
                    break;
                }
            }
        });
    });
};

// Send a real-time notification to a specific user
const notifyUser = (phone, notification) => {
    const socketId = connectedUsers.get(phone);
    if (socketId && ioInstance) {
        ioInstance.to(socketId).emit('notification', notification);
        console.log(`🔔 Notification sent to ${phone}:`, notification.title);
        return true;
    }
    return false;
};

// Get online status
const isUserOnline = (phone) => {
    return connectedUsers.has(phone);
};

module.exports = { initSocket, notifyUser, isUserOnline };
