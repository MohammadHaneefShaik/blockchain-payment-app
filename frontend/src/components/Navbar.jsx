import { NavLink, useLocation } from 'react-router-dom';

export default function Navbar() {
    const location = useLocation();

    // Hide navbar on auth/splash pages
    const hideOn = ['/', '/login', '/signup', '/verify-otp', '/set-pin'];
    if (hideOn.includes(location.pathname)) return null;

    return (
        <nav className="bottom-nav">
            <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
                <span>Home</span>
            </NavLink>

            <NavLink to="/send" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
                <span>Send</span>
            </NavLink>

            <NavLink to="/qr" className={({ isActive }) => `nav-item qr-btn ${isActive ? 'active' : ''}`}>
                <div className="qr-icon-wrapper">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="7" height="7"></rect>
                        <rect x="14" y="3" width="7" height="7"></rect>
                        <rect x="3" y="14" width="7" height="7"></rect>
                        <rect x="14" y="14" width="3" height="3"></rect>
                        <line x1="21" y1="14" x2="21" y2="21"></line>
                        <line x1="14" y1="21" x2="21" y2="21"></line>
                    </svg>
                </div>
                <span>QR Pay</span>
            </NavLink>

            <NavLink to="/history" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <span>History</span>
            </NavLink>

            <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <span>Profile</span>
            </NavLink>
        </nav>
    );
}
