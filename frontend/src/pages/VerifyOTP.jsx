// VerifyOTP.jsx – Email based OTP verification
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { verifyOTP } from '../services/api';

export default function VerifyOTP() {
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { loginUser } = useAuth();

    const email = location.state?.email || '';
    const phone = location.state?.phone || '';
    const name = location.state?.name || '';
    const countryCode = location.state?.countryCode || '+91';

    const handleChange = (index, value) => {
        if (value.length > 1) return;
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        if (value && index < 5) {
            document.getElementById(`otp-${index + 1}`)?.focus();
        }
        if (index === 5 && newOtp.join('').length === 6) {
            handleVerify(newOtp.join(''));
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
        if (!email) {
            setError('Email missing');
            setLoading(false);
            return;
        }
        try {
            const res = await verifyOTP({ email, otp: otpCode });
            if (res.data.isExistingUser) {
                // Existing user – log them in
                loginUser(res.data.user, res.data.token);
                sessionStorage.setItem('blockpay_pin_verified', 'true');
                navigate('/dashboard', { replace: true });
            } else {
                // New user – proceed to set PIN
                const { tempToken } = res.data;
                navigate('/set-pin', {
                    state: { email, phone, name, tempToken },
                    replace: true
                });
            }
        } catch (err) {
            const msg = err.response?.data?.message || 'OTP verification failed';
            if (msg.includes('Invalid session')) {
                // Show a friendly message and let user click Resend OTP
                setError('Session expired. Please request a new OTP.');
                setOtp(['', '', '', '', '', '']); // clear entered digits
            } else {
                setError(msg);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const otpString = otp.join('');
        if (otpString.length !== 6) {
            setError('Please enter all 6 digits');
            return;
        }
        handleVerify(otpString);
    };

    const handleResend = () => {
        // Resend OTP using email flow – redirect to signup where email can be resent
        navigate('/signup', { state: { email, phone, name, countryCode } });
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
                    <h1>Verify Email</h1>
                    <p className="auth-subtitle">Enter the 6‑digit code sent to {email}</p>
                </div>
                <form className="auth-form" onSubmit={handleSubmit}>
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
                        <button type="button" className="link-btn" onClick={handleResend}>Resend OTP</button>
                    </p>
                </form>
            </div>
        </div>
    );
}
