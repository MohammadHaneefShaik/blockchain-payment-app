import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { lookupUser, sendPayment } from '../services/api';
import PinInput from '../components/PinInput';

export default function SendPayment() {
    const { user, refreshBalance } = useAuth();
    const location = useLocation();
    const [receiverPhone, setReceiverPhone] = useState('');
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');
    const [receiver, setReceiver] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(null);
    const [loading, setLoading] = useState(false);
    const [lookupLoading, setLookupLoading] = useState(false);
    const [step, setStep] = useState(1); // 1: details, 2: confirm, 3: PIN, 4: success
    const [qrAutoProcessed, setQrAutoProcessed] = useState(false);
    const [pinReset, setPinReset] = useState(false);

    // Auto-fill from QR scan
    useEffect(() => {
        const state = location.state;
        if (state?.phone && !qrAutoProcessed) {
            setQrAutoProcessed(true);
            setReceiverPhone(state.phone);
            if (state.amount) setAmount(state.amount);
            const autoLookup = async () => {
                setLookupLoading(true);
                try {
                    const res = await lookupUser(state.phone);
                    setReceiver(res.data);
                    if (state.amount && parseFloat(state.amount) > 0) setStep(2);
                } catch (err) {
                    setError(err.response?.data?.message || 'User not found');
                } finally { setLookupLoading(false); }
            };
            autoLookup();
            window.history.replaceState({}, document.title);
        }
    }, [location.state, qrAutoProcessed]);

    const handleLookup = async () => {
        if (!receiverPhone || receiverPhone.length < 10) { setError('Enter a valid phone number'); return; }
        if (receiverPhone === user?.phone) { setError("You can't send money to yourself"); return; }
        setLookupLoading(true); setError('');
        try {
            const res = await lookupUser(receiverPhone);
            setReceiver(res.data); setError('');
        } catch (err) {
            setError(err.response?.data?.message || 'User not found'); setReceiver(null);
        } finally { setLookupLoading(false); }
    };

    const handleConfirm = () => {
        if (!receiver) { setError('Please find a valid receiver first'); return; }
        if (!amount || parseFloat(amount) <= 0) { setError('Enter a valid amount'); return; }
        setError(''); setStep(2);
    };

    const handleProceedToPin = () => { setStep(3); setPinReset(prev => !prev); };

    const handlePinSubmit = async (pin) => {
        setLoading(true); setError('');
        try {
            const res = await sendPayment({ receiverPhone, amount, pin, note });
            refreshBalance();
            setSuccess(res.data.transaction);
            setStep(4);
        } catch (err) {
            setError(err.response?.data?.message || 'Payment failed');
            setPinReset(prev => !prev);
        } finally { setLoading(false); }
    };

    const resetForm = () => {
        setReceiverPhone(''); setAmount(''); setNote('');
        setReceiver(null); setError(''); setSuccess(null); setStep(1);
    };

    return (
        <div className="page send-page">
            <div className="page-header">
                <h1>Send Payment</h1>
                <p>Send POL using phone number</p>
            </div>

            {/* Step 1: Enter Details */}
            {step === 1 && (
                <div className="send-form">
                    {error && <div className="error-message">{error}</div>}
                    <div className="input-group">
                        <label>Receiver's Phone Number</label>
                        <div className="input-with-action">
                            <div className="input-wrapper">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                                </svg>
                                <input type="tel" placeholder="Enter phone number" value={receiverPhone}
                                    onChange={(e) => { setReceiverPhone(e.target.value); setReceiver(null); }} />
                            </div>
                            <button className="lookup-btn" onClick={handleLookup} disabled={lookupLoading}>
                                {lookupLoading ? '...' : 'Find'}
                            </button>
                        </div>
                    </div>

                    {receiver && (
                        <div className="receiver-card">
                            <div className="receiver-avatar">{receiver.name?.charAt(0)?.toUpperCase()}</div>
                            <div className="receiver-info">
                                <h4>{receiver.name}</h4>
                                <p>{receiver.phone}</p>
                                <p className="wallet-preview">{receiver.walletAddress?.slice(0, 8)}...{receiver.walletAddress?.slice(-6)}</p>
                            </div>
                            <div className="verified-check">✓</div>
                        </div>
                    )}

                    <div className="input-group">
                        <label>Amount (POL)</label>
                        <div className="input-wrapper amount-input">
                            <span className="currency-symbol">◈</span>
                            <input type="number" placeholder="0.00" step="0.001" min="0"
                                value={amount} onChange={(e) => setAmount(e.target.value)} />
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Note (optional)</label>
                        <div className="input-wrapper">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="17" y1="10" x2="3" y2="10"></line>
                                <line x1="21" y1="6" x2="3" y2="6"></line>
                                <line x1="21" y1="14" x2="3" y2="14"></line>
                                <line x1="17" y1="18" x2="3" y2="18"></line>
                            </svg>
                            <input type="text" placeholder="What's this for?"
                                value={note} onChange={(e) => setNote(e.target.value)} />
                        </div>
                    </div>

                    <button className="btn-primary" onClick={handleConfirm} disabled={!receiver || !amount}>Continue</button>
                </div>
            )}

            {/* Step 2: Confirm */}
            {step === 2 && (
                <div className="confirm-card">
                    <h3>Confirm Payment</h3>
                    {error && <div className="error-message">{error}</div>}
                    <div className="confirm-details">
                        <div className="confirm-row"><span>To</span><strong>{receiver?.name}</strong></div>
                        <div className="confirm-row"><span>Phone</span><strong>{receiverPhone}</strong></div>
                        <div className="confirm-row"><span>Amount</span><strong className="highlight">{amount} POL</strong></div>
                        {note && <div className="confirm-row"><span>Note</span><strong>{note}</strong></div>}
                        <div className="confirm-row"><span>Network</span><strong>Polygon Amoy</strong></div>
                    </div>
                    <div className="confirm-actions">
                        <button className="btn-secondary" onClick={() => setStep(1)}>Back</button>
                        <button className="btn-primary" onClick={handleProceedToPin}>Confirm & Pay</button>
                    </div>
                </div>
            )}

            {/* Step 3: PIN Verification */}
            {step === 3 && (
                <div className="pin-verify-card">
                    <h3>Enter PIN to Confirm</h3>
                    <p className="pin-verify-sub">Confirm payment of <strong>{amount} POL</strong> to <strong>{receiver?.name}</strong></p>
                    {error && <div className="error-message">{error}</div>}
                    <PinInput length={4} onComplete={handlePinSubmit} onClear={pinReset} label="" />
                    {loading && (
                        <div className="pin-loading">
                            <div className="loading-spinner small"></div>
                            <span>Processing payment on blockchain...</span>
                        </div>
                    )}
                    <button className="btn-text" onClick={() => { setStep(2); setError(''); }}>← Back</button>
                </div>
            )}

            {/* Step 4: Success */}
            {step === 4 && success && (
                <div className="success-card">
                    <div className="success-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                    </div>
                    <h2>Payment Successful!</h2>
                    <p className="success-amount">{success.amount} POL</p>
                    <p className="success-to">sent to {success.receiverName}</p>
                    <div className="tx-hash">
                        <span>Tx Hash:</span>
                        <a href={success.explorerUrl} target="_blank" rel="noopener noreferrer">
                            {success.txHash?.slice(0, 12)}...{success.txHash?.slice(-8)}
                        </a>
                    </div>
                    <button className="btn-primary" onClick={resetForm}>Send Another</button>
                </div>
            )}
        </div>
    );
}
