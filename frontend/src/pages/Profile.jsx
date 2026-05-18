
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
    const { user, walletAddress, balance, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        // Clear saved user data so full phone+PIN login is required
        localStorage.removeItem('blockpay_user_phone');
        localStorage.removeItem('blockpay_user_name');
        localStorage.removeItem('blockpay_user_id');
        localStorage.setItem('blockpay_logged_out', 'true');
        sessionStorage.removeItem('blockpay_pin_verified');
        navigate('/login');
    };

    const copyAddress = () => {
        if (walletAddress) {
            navigator.clipboard.writeText(walletAddress);
            alert('Wallet address copied!');
        }
    };

    return (
        <div className="page profile-page">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1>Profile</h1>
                    <p>Manage your account</p>
                </div>
                <div className="notification-bell" onClick={() => navigate('/settings')} title="Settings">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="3"></circle>
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                    </svg>
                </div>  
            </div>

            <div className="profile-card">
                <div className="profile-avatar-large">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</div>
                <h2>{user?.name}</h2>
                <p className="profile-phone">{user?.phone}</p>
                <span className={`verified-badge ${user?.isVerified ? 'active' : ''}`}>
                    {user?.isVerified ? '✓ Verified' : '○ Not Verified'}
                </span>
            </div>

            <div className="profile-sections">
                <div className="profile-section">
                    <h3>Wallet Information</h3>
                    <div className="info-rows">
                        <div className="info-row">
                            <span className="info-label">Address</span>
                            <span className="info-value wallet-value" onClick={copyAddress}>
                                {walletAddress ? `${walletAddress.slice(0, 8)}...${walletAddress.slice(-6)}` : 'Not created'}
                                {walletAddress && (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                    </svg>
                                )}
                            </span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Balance</span>
                            <span className="info-value">{parseFloat(balance).toFixed(5)} POL</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Network</span>
                            <span className="info-value">Polygon Amoy Testnet</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Wallet Type</span>
                            <span className="info-value">Server-managed (No MetaMask needed)</span>
                        </div>
                    </div>
                </div>

                <div className="profile-section">
                    <h3>Account Details</h3>
                    <div className="info-rows">
                        <div className="info-row">
                            <span className="info-label">Name</span>
                            <span className="info-value">{user?.name}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Phone</span>
                            <span className="info-value">{user?.phone}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Member Since</span>
                            <span className="info-value">
                                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', {
                                    day: 'numeric', month: 'short', year: 'numeric'
                                }) : 'N/A'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="profile-section">
                    <h3>Security</h3>
                    <div className="info-rows">
                        <div className="info-row">
                            <span className="info-label">Authentication</span>
                            <span className="info-value">4-Digit PIN</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Key Storage</span>
                            <span className="info-value">AES-256 Encrypted</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Session</span>
                            <span className="info-value">JWT Authenticated</span>
                        </div>
                    </div>
                </div>
            </div>

            <button className="btn-danger" onClick={handleLogout}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                Logout
            </button>
        </div>
    );
}
