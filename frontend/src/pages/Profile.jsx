import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
    const { user, walletAddress, balance, connectWallet, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const copyAddress = () => {
        if (walletAddress) {
            navigator.clipboard.writeText(walletAddress);
            alert('Wallet address copied!');
        }
    };

    return (
        <div className="page profile-page">
            <div className="page-header">
                <h1>Profile</h1>
                <p>Manage your account</p>
            </div>

            {/* Profile Card */}
            <div className="profile-card">
                <div className="profile-avatar-large">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <h2>{user?.name}</h2>
                <p className="profile-phone">{user?.phone}</p>
                <span className={`verified-badge ${user?.isVerified ? 'active' : ''}`}>
                    {user?.isVerified ? '✓ Verified' : '○ Not Verified'}
                </span>
            </div>

            {/* Info Sections */}
            <div className="profile-sections">
                <div className="profile-section">
                    <h3>Wallet Information</h3>
                    {walletAddress ? (
                        <div className="info-rows">
                            <div className="info-row">
                                <span className="info-label">Address</span>
                                <span className="info-value wallet-value" onClick={copyAddress}>
                                    {walletAddress.slice(0, 8)}...{walletAddress.slice(-6)}
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                    </svg>
                                </span>
                            </div>
                            <div className="info-row">
                                <span className="info-label">Balance</span>
                                <span className="info-value">{parseFloat(balance).toFixed(4)} MATIC</span>
                            </div>
                            <div className="info-row">
                                <span className="info-label">Network</span>
                                <span className="info-value">Polygon Amoy Testnet</span>
                            </div>
                        </div>
                    ) : (
                        <button className="connect-wallet-btn" onClick={connectWallet}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
                                <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
                                <path d="M18 12a2 2 0 0 0 0 4h4v-4h-4z" />
                            </svg>
                            Connect MetaMask Wallet
                        </button>
                    )}
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
                            <span className="info-label">2FA Status</span>
                            <span className="info-value">
                                {user?.isVerified ? '🟢 Active' : '🔴 Inactive'}
                            </span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Session</span>
                            <span className="info-value">JWT Authenticated</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Logout */}
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
