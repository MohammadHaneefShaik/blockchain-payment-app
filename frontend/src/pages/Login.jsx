/**
 * Login — Two modes:
 * 1. PIN-only (quick unlock) — when user was previously logged in and hasn't explicitly logged out
 * 2. Phone + PIN (full login) — after explicit logout or fresh install
 */
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../services/api';
import { useAuth } from '../context/AuthContext';
import PinInput from '../components/PinInput';

export default function Login() {
    const [phone, setPhone] = useState('');
    const [showPin, setShowPin] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [pinReset, setPinReset] = useState(false);
    const navigate = useNavigate();
    const { loginUser } = useAuth();

    // Check if we have a saved user for PIN-only quick unlock
    const [quickUnlockMode, setQuickUnlockMode] = useState(false);
    const [savedName, setSavedName] = useState('');
    const [savedPhone, setSavedPhone] = useState('');

    useEffect(() => {
        const wasLoggedOut = localStorage.getItem('blockpay_logged_out');
        const userPhone = localStorage.getItem('blockpay_user_phone');
        const userName = localStorage.getItem('blockpay_user_name');

        // If user has a saved phone and did NOT explicitly logout → PIN-only mode
        if (userPhone && !wasLoggedOut) {
            setQuickUnlockMode(true);
            setSavedPhone(userPhone);
            setSavedName(userName || '');
            setPhone(userPhone);
        }
    }, []);

    const handlePhoneSubmit = (e) => {
        e.preventDefault();
        if (!phone || phone.length < 10) {
            setError('Enter a valid phone number');
            return;
        }
        setError('');
        setShowPin(true);
    };

    const handlePinComplete = async (pin) => {
        setError('');
        setLoading(true);

        // Use saved phone in quick unlock mode, or the entered phone
        const loginPhone = quickUnlockMode ? savedPhone : phone;

        try {
            const res = await login({ phone: loginPhone, pin });
            loginUser(res.data.user, res.data.token);
            // Mark PIN as verified for this browser session
            sessionStorage.setItem('blockpay_pin_verified', 'true');
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
            setPinReset(prev => !prev);
        } finally {
            setLoading(false);
        }
    };

    // Switch from PIN-only mode to full login (phone + PIN)
    const switchToFullLogin = () => {
        setQuickUnlockMode(false);
        setPhone('');
        setShowPin(false);
        setError('');
        // Set logged out flag so it stays in full login mode
        localStorage.setItem('blockpay_logged_out', 'true');
    };

    // ═══════════════════════════════════════════
    // MODE 1: PIN-only Quick Unlock
    // ═══════════════════════════════════════════
    if (quickUnlockMode) {
        return (
            <div className="auth-page">
                <div className="auth-bg-effects">
                    <div className="bg-orb bg-orb-1"></div>
                    <div className="bg-orb bg-orb-2"></div>
                    <div className="bg-orb bg-orb-3"></div>
                </div>

                <div className="auth-container">
                    <div className="auth-logo">
                        <div className="logo-icon">
                            <svg viewBox="0 0 40 40" fill="none">
                                <rect x="4" y="4" width="14" height="14" rx="3" stroke="currentColor" strokeWidth="2.5" />
                                <rect x="22" y="4" width="14" height="14" rx="3" stroke="currentColor" strokeWidth="2.5" />
                                <rect x="4" y="22" width="14" height="14" rx="3" stroke="currentColor" strokeWidth="2.5" />
                                <rect x="25" y="25" width="8" height="8" rx="2" fill="currentColor" />
                            </svg>
                        </div>
                        <h1>BlockPay</h1>
                        <p className="auth-subtitle">Blockchain-Powered Payments</p>
                    </div>

                    <div className="auth-form">
                        <div className="quick-unlock-header">
                            <div className="quick-unlock-avatar">
                                {savedName?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <h2>Welcome back{savedName ? `, ${savedName}` : ''}!</h2>
                            <p className="pin-subtitle">Enter your 4-digit PIN to unlock</p>
                        </div>

                        {error && <div className="error-message">{error}</div>}

                        <PinInput
                            length={4}
                            onComplete={handlePinComplete}
                            onClear={pinReset}
                            label=""
                            error={error}
                        />

                        {loading && (
                            <div className="pin-loading">
                                <div className="loading-spinner small"></div>
                                <span>Verifying...</span>
                            </div>
                        )}

                        <button
                            className="btn-text"
                            onClick={switchToFullLogin}
                            style={{ marginTop: '1.5rem' }}
                        >
                            Login with a different account
                        </button>

                        <p className="auth-link">
                            New to BlockPay? <Link to="/signup">Create Account</Link>
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // ═══════════════════════════════════════════
    // MODE 2: Full Login (Phone + PIN)
    // ═══════════════════════════════════════════
    return (
        <div className="auth-page">
            <div className="auth-bg-effects">
                <div className="bg-orb bg-orb-1"></div>
                <div className="bg-orb bg-orb-2"></div>
                <div className="bg-orb bg-orb-3"></div>
            </div>

            <div className="auth-container">
                <div className="auth-logo">
                    <div className="logo-icon">
                        <svg viewBox="0 0 40 40" fill="none">
                            <rect x="4" y="4" width="14" height="14" rx="3" stroke="currentColor" strokeWidth="2.5" />
                            <rect x="22" y="4" width="14" height="14" rx="3" stroke="currentColor" strokeWidth="2.5" />
                            <rect x="4" y="22" width="14" height="14" rx="3" stroke="currentColor" strokeWidth="2.5" />
                            <rect x="25" y="25" width="8" height="8" rx="2" fill="currentColor" />
                        </svg>
                    </div>
                    <h1>BlockPay</h1>
                    <p className="auth-subtitle">Blockchain-Powered Payments</p>
                </div>

                {!showPin ? (
                    <form className="auth-form" onSubmit={handlePhoneSubmit}>
                        <h2>Welcome Back</h2>

                        {error && <div className="error-message">{error}</div>}

                        <div className="input-group">
                            <label>Phone Number</label>
                            <div className="input-wrapper">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                                </svg>
                                <input
                                    type="tel"
                                    placeholder="Enter phone number"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    required
                                    autoFocus
                                />
                            </div>
                        </div>

                        <button type="submit" className="btn-primary">
                            Continue
                        </button>

                        <p className="auth-link">
                            New to BlockPay? <Link to="/signup">Create Account</Link>
                        </p>
                    </form>
                ) : (
                    <div className="auth-form">
                        <h2>Enter PIN</h2>
                        <p className="pin-subtitle">Enter your 4-digit PIN for <strong>{phone}</strong></p>

                        {error && <div className="error-message">{error}</div>}

                        <PinInput
                            length={4}
                            onComplete={handlePinComplete}
                            onClear={pinReset}
                            label=""
                            error={error}
                        />

                        {loading && (
                            <div className="pin-loading">
                                <div className="loading-spinner small"></div>
                                <span>Verifying...</span>
                            </div>
                        )}

                        <button
                            className="btn-text"
                            onClick={() => { setShowPin(false); setError(''); }}
                        >
                            ← Change Number
                        </button>

                        <p className="auth-link">
                            New to BlockPay? <Link to="/signup">Create Account</Link>
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
