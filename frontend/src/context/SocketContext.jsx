import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export function SocketProvider({ children }) {
    const { user, token } = useAuth();
    const [socket, setSocket] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [toastNotification, setToastNotification] = useState(null);
    const socketRef = useRef(null);

    // Connect to Socket.IO when user logs in
    useEffect(() => {
        if (user && token) {
            const newSocket = io('http://127.0.0.1:5001', {
                transports: ['websocket', 'polling']
            });

            newSocket.on('connect', () => {
                console.log('🔌 Socket connected:', newSocket.id);
                // Register this user's phone for notifications
                newSocket.emit('register', user.phone);
            });

            // Listen for real-time notifications
            newSocket.on('notification', (notification) => {
                console.log('🔔 Real-time notification:', notification);

                // Add to notifications list
                setNotifications(prev => [notification, ...prev]);
                setUnreadCount(prev => prev + 1);

                // Show toast notification
                setToastNotification(notification);

                // Auto-hide toast after 5 seconds
                setTimeout(() => {
                    setToastNotification(null);
                }, 5000);
            });

            newSocket.on('disconnect', () => {
                console.log('🔌 Socket disconnected');
            });

            socketRef.current = newSocket;
            setSocket(newSocket);

            return () => {
                newSocket.disconnect();
                socketRef.current = null;
            };
        }
    }, [user, token]);

    // Dismiss toast
    const dismissToast = useCallback(() => {
        setToastNotification(null);
    }, []);

    // Update unread count (called from notification page)
    const markAllRead = useCallback(() => {
        setUnreadCount(0);
        setNotifications(prev =>
            prev.map(n => ({ ...n, read: true }))
        );
    }, []);

    const value = {
        socket,
        notifications,
        setNotifications,
        unreadCount,
        setUnreadCount,
        toastNotification,
        dismissToast,
        markAllRead
    };

    return (
        <SocketContext.Provider value={value}>
            {children}

            {/* Toast Notification Popup */}
            {toastNotification && (
                <div className="toast-notification" onClick={dismissToast}>
                    <div className="toast-icon">
                        {toastNotification.type === 'payment_received' ? '💰' : '✅'}
                    </div>
                    <div className="toast-content">
                        <p className="toast-title">{toastNotification.title}</p>
                        <p className="toast-message">{toastNotification.message}</p>
                    </div>
                    <button className="toast-close" onClick={dismissToast}>×</button>
                </div>
            )}
        </SocketContext.Provider>
    );
}
