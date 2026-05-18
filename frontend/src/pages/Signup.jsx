/**
 * Signup — Enter name + phone, then send OTP via Firebase Phone Auth
 * Step 1 of the new user registration flow
 */
import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, RecaptchaVerifier, signInWithPhoneNumber } from '../firebase';

export default function Signup() {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [countryCode, setCountryCode] = useState('+91');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const recaptchaRef = useRef(null);

    // Set up invisible reCAPTCHA on mount
    useEffect(() => {
        try {
            if (!window.recaptchaVerifier) {
                window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                    size: 'invisible',
                    callback: () => {
                        console.log('reCAPTCHA verified');
                    },
                    'expired-callback': () => {
                        console.log('reCAPTCHA expired');
                        setError('reCAPTCHA expired. Please try again.');
                    }
                });
            }
        } catch (err) {
            console.error('reCAPTCHA setup error:', err);
        }

        return () => {
            if (window.recaptchaVerifier) {
                try {
                    window.recaptchaVerifier.clear();
                } catch (e) { /* ignore */ }
                window.recaptchaVerifier = null;
            }
        };
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!name.trim()) {
            setError('Please enter your name');
            return;
        }

        if (!phone || phone.length < 10) {
            setError('Enter a valid phone number');
            return;
        }

        setLoading(true);

        try {
            const fullPhone = `${countryCode}${phone}`;
            const appVerifier = window.recaptchaVerifier;

            if (!appVerifier) {
                setError('reCAPTCHA not loaded. Please refresh the page.');
                setLoading(false);
                return;
            }

            // Send OTP via Firebase Phone Auth (real SMS!)
            const confirmationResult = await signInWithPhoneNumber(auth, fullPhone, appVerifier);

            // Store confirmation result for verification
            window.confirmationResult = confirmationResult;

            navigate('/verify-otp', { state: { phone, name, countryCode } });
        } catch (err) {
            console.error('Firebase OTP error:', err);

            // Reset reCAPTCHA on error
            if (window.recaptchaVerifier) {
                try {
                    window.recaptchaVerifier.clear();
                } catch (e) { /* ignore */ }
                window.recaptchaVerifier = null;
            }
            // Recreate it
            try {
                window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                    size: 'invisible'
                });
            } catch (e) { /* ignore */ }

            if (err.code === 'auth/invalid-phone-number') {
                setError('Invalid phone number format. Use country code + number.');
            } else if (err.code === 'auth/too-many-requests') {
                setError('Too many attempts. Please try again later.');
            } else if (err.code === 'auth/quota-exceeded') {
                setError('SMS quota exceeded. Try again tomorrow.');
            } else {
                setError(err.message || 'Failed to send OTP');
            }
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
                    <h1>BlockPay</h1>
                    <p className="auth-subtitle">Create Your Account</p>
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
                    <h2>Get Started</h2>

                    {error && <div className="error-message">{error}</div>}

                    <div className="input-group">
                        <label>Full Name</label>
                        <div className="input-wrapper">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                            <input
                                type="text"
                                placeholder="Enter your name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                autoFocus
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Phone Number</label>
                        <div className="input-with-action">
                            <div className="input-wrapper" style={{ maxWidth: '90px' }}>
                                <input
                                    type="text"
                                    value={countryCode}
                                    onChange={(e) => setCountryCode(e.target.value)}
                                    style={{ textAlign: 'center' }}
                                />
                            </div>
                            <div className="input-wrapper">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                                </svg>
                                <input
                                    type="tel"
                                    placeholder="Phone number"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? <span className="btn-spinner"></span> : 'Send OTP'}
                    </button>

                    <p className="auth-link">
                        Already have an account? <Link to="/login">Login</Link>
                    </p>
                </form>

                {/* Invisible reCAPTCHA container */}
                <div id="recaptcha-container" ref={recaptchaRef}></div>
            </div>
        </div>
    );
}
