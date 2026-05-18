import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';

export default function NotificationBell() {
    const { unreadCount } = useSocket();
    const navigate = useNavigate();

    return (
        <div className="notification-bell" onClick={() => navigate('/notifications')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            {unreadCount > 0 && (
                <span className="notification-badge">
                    {unreadCount > 9 ? '9+' : unreadCount}
                </span>
            )}
        </div>
    );
}
