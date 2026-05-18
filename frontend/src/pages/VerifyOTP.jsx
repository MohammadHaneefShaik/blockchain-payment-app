/**
 * VerifyOTP — 6-digit OTP verification via Firebase Phone Auth
 * After Firebase verifies: existing users → dashboard, new users → SetPIN
 */
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login as apiLogin } from '../services/api';

export default function VerifyOTP() {
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { loginUser } = useAuth();
    const phone = location.state?.phone || '';
    const name = location.state?.name || '';
    const countryCode = location.state?.countryCode || '+91';

    const handleChange = (index, value) => {
        if (value.length > 1) return;
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto-focus next input
        if (value && index < 5) {
            document.getElementById(`otp-${index + 1}`)?.focus();
        }

        // Auto-submit when all 6 digits are entered
        if (value && index === 5) {
            const otpString = newOtp.join('');
            if (otpString.length === 6) {
                handleVerify(otpString);
            }
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            document.getElementById(`otp-${index - 1}`)?.focus();
        }
    };

    const handleVerify = async (otpCode) => {
        setError('');
        setLoading(true);

        try {
            // Verify OTP with Firebase
            if (!window.confirmationResult) {
                setError('Session expired. Please go back and resend OTP.');
                setLoading(false);
                return;
            }

            const result = await window.confirmationResult.confirm(otpCode);
            console.log('✅ Firebase OTP verified:', result.user.phoneNumber);

            // Phone is now verified by Firebase!
            // Check if this is an existing user by trying to login
            // For new users, proceed to PIN setup
            try {
                // Try to see if user exists in our backend
                const { default: API } = await import('../services/api');
                const checkRes = await API.post('/auth/verify-otp', {
                    phone,
                    otp: 'firebase-verified',
                    firebaseUid: result.user.uid
                });

                if (checkRes.data.isExistingUser) {
                    // Existing user — they already have an account
                    loginUser(checkRes.data.user, checkRes.data.token);
                    sessionStorage.setItem('blockpay_pin_verified', 'true');
                    navigate('/dashboard', { replace: true });
                } else {
                    // New user — go to PIN setup
                    navigate('/set-pin', {
                        state: {
                            phone,
                            name,
                            tempToken: checkRes.data.tempToken
                        },
                        replace: true
                    });
                }
            } catch (backendErr) {
                // If backend doesn't recognize the user, treat as new
                // Generate a simple temp token client-side for PIN setup
                navigate('/set-pin', {
                    state: {
                        phone,
                        name,
                        firebaseVerified: true,
                        firebaseUid: result.user.uid
                    },
                    replace: true
                });
            }
        } catch (err) {
            console.error('OTP verification error:', err);
            if (err.code === 'auth/invalid-verification-code') {
                setError('Invalid OTP. Please check and try again.');
            } else if (err.code === 'auth/code-expired') {
                setError('OTP expired. Please go back and resend.');
            } else {
                setError(err.message || 'OTP verification failed');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const otpString = otp.join('');

        if (otpString.length !== 6) {
            setError('Please enter all 6 digits');
            return;
        }

        await handleVerify(otpString);
    };

    const handleResend = () => {
        // Go back to signup to resend OTP
        navigate('/signup', { state: { name, phone } });
    };

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
                    <h1>Verify Phone</h1>
                    <p className="auth-subtitle">Enter the 6-digit code</p>
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="otp-info">
                        <p>We sent a verification code to</p>
                        <strong>{countryCode} {phone || 'your phone'}</strong>
                        <p className="otp-hint">📱 Check your SMS messages</p>
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <div className="otp-inputs">
                        {otp.map((digit, index) => (
                            <input
                                key={index}
                                id={`otp-${index}`}
                                type="text"
                                inputMode="numeric"
                                maxLength="1"
                                value={digit}
                                onChange={(e) => handleChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                className="otp-input"
                                autoFocus={index === 0}
                            />
                        ))}
                    </div>

                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? <span className="btn-spinner"></span> : 'Verify OTP'}
                    </button>

                    <p className="auth-link">
                        Didn't receive code?{' '}
                        <button type="button" className="link-btn" onClick={handleResend}>
                            Resend OTP
                        </button>
                    </p>
                </form>
            </div>
        </div>
    );
}
