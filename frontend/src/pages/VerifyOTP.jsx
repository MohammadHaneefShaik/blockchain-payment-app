import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { verifyOTP } from '../services/api';

export default function VerifyOTP() {
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const phone = location.state?.phone || '';

    const handleChange = (index, value) => {
        if (value.length > 1) return;
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto-focus next input
        if (value && index < 5) {
            document.getElementById(`otp-${index + 1}`)?.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            document.getElementById(`otp-${index - 1}`)?.focus();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const otpString = otp.join('');

        if (otpString.length !== 6) {
            setError('Please enter all 6 digits');
            return;
        }

        setLoading(true);

        try {
            await verifyOTP({ phone, otp: otpString });
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'OTP verification failed');
        } finally {
            setLoading(false);
        }
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
                        <strong>{phone || 'your phone'}</strong>
                        <p className="otp-hint">💡 Demo OTP: <code>123456</code></p>
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
                        Didn't receive code? <button type="button" className="link-btn">Resend OTP</button>
                    </p>
                </form>
            </div>
        </div>
    );
}
