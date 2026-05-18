import { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '../services/api';

export default function Notifications() {
    const { setUnreadCount, markAllRead } = useSocket();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadNotifications(); }, []);

    const loadNotifications = async () => {
        try {
            const res = await getNotifications();
            setNotifications(res.data.notifications);
            setUnreadCount(res.data.unreadCount);
        } catch (err) { console.error('Failed to load notifications:', err); }
        finally { setLoading(false); }
    };

    const handleMarkAllRead = async () => {
        try {
            await markAllNotificationsRead();
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            markAllRead();
        } catch (err) { console.error('Failed to mark all read:', err); }
    };

    const handleMarkRead = async (id) => {
        try {
            await markNotificationRead(id);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) { console.error('Failed to mark read:', err); }
    };

    const formatTime = (dateStr) => {
        const d = new Date(dateStr); const now = new Date();
        const diffMs = now - d; const diffMin = Math.floor(diffMs / 60000);
        const diffHr = Math.floor(diffMs / 3600000); const diffDay = Math.floor(diffMs / 86400000);
        if (diffMin < 1) return 'Just now';
        if (diffMin < 60) return `${diffMin}m ago`;
        if (diffHr < 24) return `${diffHr}h ago`;
        if (diffDay < 7) return `${diffDay}d ago`;
        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    };

    const getIcon = (type) => {
        switch (type) {
            case 'payment_received': return '💰';
            case 'payment_sent': return '✅';
            case 'welcome': return '👋';
            default: return '🔔';
        }
    };

    const unreadExists = notifications.some(n => !n.read);

    return (
        <div className="page notifications-page">
            <div className="page-header">
                <div className="notif-header-row">
                    <div><h1>Notifications</h1><p>Stay updated on your transactions</p></div>
                    {unreadExists && (<button className="mark-all-read-btn" onClick={handleMarkAllRead}>Mark all read</button>)}
                </div>
            </div>

            {loading ? (
                <div className="empty-state"><div className="loading-spinner"></div></div>
            ) : notifications.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-notif-icon">🔔</div>
                    <h3>No Notifications</h3>
                    <p>You'll see payment alerts here</p>
                </div>
            ) : (
                <div className="notification-list">
                    {notifications.map((notif) => (
                        <div key={notif._id} className={`notification-item ${!notif.read ? 'unread' : ''}`}
                            onClick={() => !notif.read && handleMarkRead(notif._id)}>
                            <div className="notif-icon-wrapper"><span className="notif-emoji">{getIcon(notif.type)}</span></div>
                            <div className="notif-content">
                                <p className="notif-title">{notif.title}</p>
                                <p className="notif-message">{notif.message}</p>
                                <p className="notif-time">{formatTime(notif.createdAt)}</p>
                            </div>
                            {!notif.read && <div className="notif-unread-dot"></div>}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
