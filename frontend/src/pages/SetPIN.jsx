import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { setPin } from '../services/api';
import { useAuth } from '../context/AuthContext';
import PinInput from '../components/PinInput';

export default function SetPIN() {
    const [step, setStep] = useState(1);
    const [firstPin, setFirstPin] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [pinReset, setPinReset] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { loginUser } = useAuth();
    const phone = location.state?.phone || '';
    const email = location.state?.email || '';
    const name = location.state?.name || '';
    const tempToken = location.state?.tempToken || '';
    const firebaseVerified = location.state?.firebaseVerified || false;
    const firebaseUid = location.state?.firebaseUid || '';

    if (!phone || (!tempToken && !firebaseVerified)) {
        return (
            <div className="auth-page"><div className="auth-container"><div className="auth-form">
                <h2>Session Expired</h2>
                <p>Please start the signup process again.</p>
                <button className="btn-primary" onClick={() => navigate('/signup')}>Go to Signup</button>
            </div></div></div>
        );
    }

    const handleFirstPin = (pin) => {
        setFirstPin(pin);
        setError('');
        setStep(2);
        setPinReset(prev => !prev);
    };

    const handleConfirmPin = async (confirmPin) => {
        if (confirmPin !== firstPin) {
            setError('PINs do not match. Try again.');
            setStep(1); setFirstPin('');
            setPinReset(prev => !prev);
            return;
        }
        setError(''); setLoading(true); setStep(3);
        try {
            const payload = { name, email, phone, pin: confirmPin };
            if (tempToken) payload.tempToken = tempToken;
            if (firebaseVerified) {
                payload.firebaseVerified = true;
                payload.firebaseUid = firebaseUid;
            }
            const res = await setPin(payload);
            loginUser(res.data.user, res.data.token);
            sessionStorage.setItem('blockpay_pin_verified', 'true');
            setTimeout(() => navigate('/dashboard', { replace: true }), 1500);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create account');
            setStep(1); setFirstPin(''); setLoading(false);
            setPinReset(prev => !prev);
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
                    <h1>Set Your PIN</h1>
                    <p className="auth-subtitle">Secure your account</p>
                </div>
                <div className="auth-form">
                    {step === 3 ? (
                        <div className="wallet-creating">
                            <div className="wallet-anim"><div className="wallet-spinner"></div></div>
                            <h3>Creating Your Wallet...</h3>
                            <p className="wallet-sub">Setting up your blockchain wallet</p>
                            <div className="wallet-steps">
                                <div className="wallet-step done"><span className="step-check">✓</span><span>Account verified</span></div>
                                <div className="wallet-step done"><span className="step-check">✓</span><span>PIN secured</span></div>
                                <div className="wallet-step active"><div className="loading-spinner tiny"></div><span>Creating wallet</span></div>
                            </div>
                        </div>
                    ) : (
                        <>
                            {error && <div className="error-message">{error}</div>}
                            <PinInput length={4} onComplete={step === 1 ? handleFirstPin : handleConfirmPin} onClear={pinReset} label={step === 1 ? 'Create a 4-digit PIN' : 'Confirm your PIN'} />
                            <div className="pin-progress">
                                <div className={`pin-step ${step >= 1 ? 'active' : ''}`}><div className="step-dot"></div><span>Create</span></div>
                                <div className="pin-step-line"></div>
                                <div className={`pin-step ${step >= 2 ? 'active' : ''}`}><div className="step-dot"></div><span>Confirm</span></div>
                            </div>
                            <p className="pin-note">🔒 Your PIN is encrypted and never stored in plain text</p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
