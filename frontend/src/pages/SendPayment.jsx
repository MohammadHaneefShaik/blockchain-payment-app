import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ethers } from 'ethers';
import { useAuth } from '../context/AuthContext';
import { lookupUser, recordTransaction } from '../services/api';
import { BLOCKPAY_ABI, CONTRACT_ADDRESS } from '../utils/contract';

export default function SendPayment() {
    const { user, walletAddress, fetchBalance } = useAuth();
    const location = useLocation();
    const [receiverPhone, setReceiverPhone] = useState('');
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');
    const [receiver, setReceiver] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [lookupLoading, setLookupLoading] = useState(false);
    const [step, setStep] = useState(1); // 1: enter details, 2: confirm, 3: success
    const [qrAutoProcessed, setQrAutoProcessed] = useState(false);

    // Auto-fill from QR scan (GPay/PhonePe style — skip to confirm)
    useEffect(() => {
        const state = location.state;
        if (state?.phone && !qrAutoProcessed) {
            setQrAutoProcessed(true);
            setReceiverPhone(state.phone);
            if (state.amount) {
                setAmount(state.amount);
            }

            // Auto-lookup receiver and skip to confirm step
            const autoLookup = async () => {
                setLookupLoading(true);
                try {
                    const res = await lookupUser(state.phone);
                    setReceiver(res.data);

                    // If amount is also provided, go straight to confirm
                    if (state.amount && parseFloat(state.amount) > 0) {
                        setStep(2);
                    }
                    // Otherwise stay on step 1 with receiver pre-filled so user just enters amount
                } catch (err) {
                    setError(err.response?.data?.message || 'User not found');
                } finally {
                    setLookupLoading(false);
                }
            };
            autoLookup();

            // Clear location state so refreshing doesn't re-trigger
            window.history.replaceState({}, document.title);
        }
    }, [location.state, qrAutoProcessed]);

    const handleLookup = async () => {
        if (!receiverPhone || receiverPhone.length < 10) {
            setError('Enter a valid phone number');
            return;
        }

        if (receiverPhone === user?.phone) {
            setError("You can't send money to yourself");
            return;
        }

        setLookupLoading(true);
        setError('');

        try {
            const res = await lookupUser(receiverPhone);
            setReceiver(res.data);
            setError('');
        } catch (err) {
            setError(err.response?.data?.message || 'User not found');
            setReceiver(null);
        } finally {
            setLookupLoading(false);
        }
    };

    const handleConfirm = () => {
        if (!receiver) {
            setError('Please find a valid receiver first');
            return;
        }
        if (!amount || parseFloat(amount) <= 0) {
            setError('Enter a valid amount');
            return;
        }
        if (!walletAddress) {
            setError('Please connect your wallet first');
            return;
        }
        // Block same-wallet transfers
        if (receiver.walletAddress?.toLowerCase() === walletAddress?.toLowerCase()) {
            setError('Cannot send to the same wallet address. The receiver must use a different wallet.');
            return;
        }
        setStep(2);
    };

    const handleSend = async () => {
        setLoading(true);
        setError('');

        try {
            if (!window.ethereum) {
                throw new Error('MetaMask not found');
            }

            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();

            // Fetch current network gas fees (Polygon Amoy needs higher tip)
            const feeData = await provider.getFeeData();
            const minTip = ethers.parseUnits('30', 'gwei'); // Amoy minimum ~25 gwei
            const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas > minTip
                ? feeData.maxPriorityFeePerGas
                : minTip;
            const maxFeePerGas = (feeData.maxFeePerGas || maxPriorityFeePerGas) + maxPriorityFeePerGas;

            let txHash;

            // If contract is deployed, use it
            if (CONTRACT_ADDRESS) {
                const contract = new ethers.Contract(CONTRACT_ADDRESS, BLOCKPAY_ABI, signer);
                const tx = await contract.sendPayment(receiver.walletAddress, {
                    value: ethers.parseEther(amount),
                    maxPriorityFeePerGas,
                    maxFeePerGas
                });
                await tx.wait();
                txHash = tx.hash;
            } else {
                // Direct transfer (no contract needed)
                const tx = await signer.sendTransaction({
                    to: receiver.walletAddress,
                    value: ethers.parseEther(amount),
                    maxPriorityFeePerGas,
                    maxFeePerGas
                });
                await tx.wait();
                txHash = tx.hash;
            }

            // Record transaction in backend
            await recordTransaction({
                receiverPhone,
                amount,
                txHash,
                note
            });

            // Refresh balance
            fetchBalance(walletAddress);

            setSuccess(txHash);
            setStep(3);
        } catch (err) {
            console.error('Payment error:', err);
            if (err.code === 'ACTION_REJECTED') {
                setError('Transaction rejected by user');
            } else {
                setError(err.message || 'Payment failed');
            }
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setReceiverPhone('');
        setAmount('');
        setNote('');
        setReceiver(null);
        setError('');
        setSuccess('');
        setStep(1);
    };

    return (
        <div className="page send-page">
            <div className="page-header">
                <h1>Send Payment</h1>
                <p>Send crypto using phone number</p>
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
                                <input
                                    type="tel"
                                    placeholder="Enter phone number"
                                    value={receiverPhone}
                                    onChange={(e) => {
                                        setReceiverPhone(e.target.value);
                                        setReceiver(null);
                                    }}
                                />
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
                                <p className="wallet-preview">
                                    {receiver.walletAddress?.slice(0, 8)}...{receiver.walletAddress?.slice(-6)}
                                </p>
                            </div>
                            <div className="verified-check">✓</div>
                        </div>
                    )}

                    <div className="input-group">
                        <label>Amount (MATIC)</label>
                        <div className="input-wrapper amount-input">
                            <span className="currency-symbol">◈</span>
                            <input
                                type="number"
                                placeholder="0.00"
                                step="0.001"
                                min="0"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                            />
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
                            <input
                                type="text"
                                placeholder="What's this for?"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                            />
                        </div>
                    </div>

                    <button className="btn-primary" onClick={handleConfirm} disabled={!receiver || !amount}>
                        Continue
                    </button>
                </div>
            )}

            {/* Step 2: Confirm */}
            {step === 2 && (
                <div className="confirm-card">
                    <h3>Confirm Payment</h3>

                    {error && <div className="error-message">{error}</div>}

                    <div className="confirm-details">
                        <div className="confirm-row">
                            <span>To</span>
                            <strong>{receiver?.name}</strong>
                        </div>
                        <div className="confirm-row">
                            <span>Phone</span>
                            <strong>{receiverPhone}</strong>
                        </div>
                        <div className="confirm-row">
                            <span>Amount</span>
                            <strong className="highlight">{amount} MATIC</strong>
                        </div>
                        {note && (
                            <div className="confirm-row">
                                <span>Note</span>
                                <strong>{note}</strong>
                            </div>
                        )}
                        <div className="confirm-row">
                            <span>Network</span>
                            <strong>Polygon Amoy</strong>
                        </div>
                    </div>

                    <div className="confirm-actions">
                        <button className="btn-secondary" onClick={() => setStep(1)} disabled={loading}>
                            Back
                        </button>
                        <button className="btn-primary" onClick={handleSend} disabled={loading}>
                            {loading ? <span className="btn-spinner"></span> : 'Confirm & Pay'}
                        </button>
                    </div>
                </div>
            )}

            {/* Step 3: Success */}
            {step === 3 && (
                <div className="success-card">
                    <div className="success-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                    </div>
                    <h2>Payment Successful!</h2>
                    <p className="success-amount">{amount} MATIC</p>
                    <p className="success-to">sent to {receiver?.name}</p>

                    <div className="tx-hash">
                        <span>Tx Hash:</span>
                        <a
                            href={`https://amoy.polygonscan.com/tx/${success}`}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {success?.slice(0, 12)}...{success?.slice(-8)}
                        </a>
                    </div>

                    <button className="btn-primary" onClick={resetForm}>
                        Send Another
                    </button>
                </div>
            )}
        </div>
    );
}
