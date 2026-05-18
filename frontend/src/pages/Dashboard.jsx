import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { getTransactions, getUnreadCount } from '../services/api';
import NotificationBell from '../components/NotificationBell';

export default function Dashboard() {
    const { user, walletAddress, balance, connectWallet, loading } = useAuth();
    const { setUnreadCount } = useSocket();
    const [recentTxns, setRecentTxns] = useState([]);
    const [txnLoading, setTxnLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (walletAddress) {
            loadTransactions();
        }
        // Load unread notification count
        loadUnreadCount();
    }, [walletAddress]);

    const loadUnreadCount = async () => {
        try {
            const res = await getUnreadCount();
            setUnreadCount(res.data.unreadCount);
        } catch (err) {
            console.error('Failed to load unread count:', err);
        }
    };

    const loadTransactions = async () => {
        setTxnLoading(true);
        try {
            const res = await getTransactions();
            setRecentTxns(res.data.slice(0, 5));
        } catch (err) {
            console.error('Failed to load transactions:', err);
        } finally {
            setTxnLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="loading-spinner"></div>
            </div>
        );
    }

    return (
        <div className="page dashboard-page">
            {/* Header */}
            <div className="dashboard-header">
                <div className="header-top">
                    <div>
                        <p className="greeting">Hello,</p>
                        <h1 className="user-name">{user?.name || 'User'} 👋</h1>
                    </div>
                    <div className="header-actions">
                        <NotificationBell />
                        <div className="header-avatar" onClick={() => navigate('/profile')}>
                            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Balance Card */}
            <div className="balance-card">
                <div className="balance-card-bg"></div>
                <div className="balance-content">
                    <p className="balance-label">Total Balance</p>
                    <h2 className="balance-amount">
                        {walletAddress ? `${parseFloat(balance).toFixed(4)} MATIC` : '---'}
                    </h2>
                    {walletAddress ? (
                        <p className="wallet-addr">
                            {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                            <span className="connected-badge">● Connected</span>
                        </p>
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
            </div>

            {/* Quick Actions */}
            <div className="quick-actions">
                <div className="quick-action" onClick={() => navigate('/send')}>
                    <div className="action-icon send-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="22" y1="2" x2="11" y2="13"></line>
                            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                        </svg>
                    </div>
                    <span>Send</span>
                </div>
                <div className="quick-action" onClick={() => navigate('/qr')}>
                    <div className="action-icon qr-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="7" height="7"></rect>
                            <rect x="14" y="3" width="7" height="7"></rect>
                            <rect x="3" y="14" width="7" height="7"></rect>
                            <rect x="14" y="14" width="3" height="3"></rect>
                        </svg>
                    </div>
                    <span>QR Pay</span>
                </div>
                <div className="quick-action" onClick={() => navigate('/history')}>
                    <div className="action-icon history-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                    </div>
                    <span>History</span>
                </div>
                <div className="quick-action" onClick={() => navigate('/profile')}>
                    <div className="action-icon profile-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                    </div>
                    <span>Profile</span>
                </div>
            </div>

            {/* Recent Transactions */}
            <div className="section">
                <div className="section-header">
                    <h3>Recent Transactions</h3>
                    {recentTxns.length > 0 && (
                        <button className="see-all-btn" onClick={() => navigate('/history')}>See All</button>
                    )}
                </div>

                {!walletAddress ? (
                    <div className="empty-state">
                        <p>Connect your wallet to start transacting</p>
                    </div>
                ) : txnLoading ? (
                    <div className="empty-state">
                        <div className="loading-spinner small"></div>
                    </div>
                ) : recentTxns.length === 0 ? (
                    <div className="empty-state">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="48" height="48">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        <p>No transactions yet</p>
                        <button className="btn-secondary" onClick={() => navigate('/send')}>Send your first payment</button>
                    </div>
                ) : (
                    <div className="transaction-list">
                        {recentTxns.map((txn, i) => (
                            <div key={i} className="txn-item">
                                <div className={`txn-icon ${txn.senderPhone === user?.phone ? 'sent' : 'received'}`}>
                                    {txn.senderPhone === user?.phone ? '↑' : '↓'}
                                </div>
                                <div className="txn-details">
                                    <p className="txn-party">
                                        {txn.senderPhone === user?.phone ? txn.receiverPhone : txn.senderPhone}
                                    </p>
                                    <p className="txn-time">
                                        {new Date(txn.timestamp).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className={`txn-amount ${txn.senderPhone === user?.phone ? 'negative' : 'positive'}`}>
                                    {txn.senderPhone === user?.phone ? '-' : '+'}{txn.amount} MATIC
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
