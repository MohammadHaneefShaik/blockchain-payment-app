import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useAuth } from '../context/AuthContext';

export default function QRPage() {

    const { user } = useAuth();

    const [activeTab, setActiveTab] = useState('myqr');
    const [qrImage, setQrImage] = useState('');
    const [amount, setAmount] = useState('');
    const [scanResult, setScanResult] = useState(null);

    const scannerRef = useRef(null);

    const navigate = useNavigate();

    // Generate QR Code
    useEffect(() => {

        generateQR();

    }, [user, amount]);

    const generateQR = async () => {

        if (!user) return;

        let qrData =
            `blockpay://pay/${user.phone}`;

        // Add optional amount
        if (amount && parseFloat(amount) > 0) {

            qrData =
                `blockpay://pay/${user.phone}?amount=${amount}`;
        }

        try {

            const url = await QRCode.toDataURL(
                qrData,
                {
                    width: 280,
                    margin: 2,
                    color: {
                        dark: '#000000',
                        light: '#FFFFFF'
                    }
                }
            );

            setQrImage(url);

        } catch (err) {

            console.error('QR generation error:', err);

        }

    };

    // Start / Stop scanner
    useEffect(() => {

        if (activeTab === 'scan') {

            startScanner();
        }

        return () => {

            stopScanner();
        };

    }, [activeTab]);

    const startScanner = () => {

        try {

            const scanner =
                new Html5QrcodeScanner(
                    'qr-reader',
                    {
                        fps: 10,
                        qrbox: {
                            width: 250,
                            height: 250
                        },
                        rememberLastUsedCamera: true,
                    }
                );

            scanner.render(

                // Success callback
                (decodedText) => {

                    try {

                        if (
                            decodedText.startsWith(
                                'blockpay://pay/'
                            )
                        ) {

                            // Parse custom protocol manually
                            // (new URL() is unreliable with blockpay://)
                            const withoutPrefix =
                                decodedText.replace(
                                    'blockpay://pay/', ''
                                );

                            const [phonePart, queryPart] =
                                withoutPrefix.split('?');

                            const phone = phonePart;

                            let scannedAmount = '';
                            if (queryPart) {
                                const params =
                                    new URLSearchParams(queryPart);
                                scannedAmount =
                                    params.get('amount') || '';
                            }

                            stopScanner();

                            // Navigate directly to payment page
                            // (GPay/PhonePe style — instant redirect)
                            navigate('/send', {
                                state: {
                                    phone: phone,
                                    amount: scannedAmount
                                }
                            });

                            return;
                        }

                    } catch (err) {

                        console.error(
                            'QR Parse Error:',
                            err
                        );

                    }

                },

                // Error callback
                (errorMessage) => {

                    // Ignore normal frame scan errors
                    if (
                        !errorMessage.includes(
                            'No MultiFormat Readers'
                        )
                    ) {

                        console.warn(errorMessage);

                    }

                }

            );

            scannerRef.current = scanner;

        } catch (err) {

            console.error(
                'Scanner start error:',
                err
            );

        }

    };

    const stopScanner = () => {

        if (scannerRef.current) {

            scannerRef.current
                .clear()
                .then(() => {

                    scannerRef.current = null;

                })
                .catch(() => { });

        }

    };

    // Navigate to payment page
    const handlePayFromScan = () => {

        if (scanResult) {

            navigate('/send', {
                state: {
                    phone: scanResult.phone,
                    amount: scanResult.amount || ''
                }
            });

        }

    };

    return (

        <div className="page qr-page">

            <div className="page-header">

                <h1>QR Payment</h1>

                <p>
                    Pay or receive money
                    using QR code
                </p>

            </div>

            {/* Tabs */}

            <div className="tab-switcher">

                <button
                    className={`tab ${activeTab === 'myqr'
                            ? 'active'
                            : ''
                        }`}
                    onClick={() => {

                        setActiveTab('myqr');

                        setScanResult(null);

                    }}
                >
                    My QR
                </button>

                <button
                    className={`tab ${activeTab === 'scan'
                            ? 'active'
                            : ''
                        }`}
                    onClick={() => {

                        setActiveTab('scan');

                        setScanResult(null);

                    }}
                >
                    Scan QR
                </button>

            </div>

            {/* My QR */}

            {activeTab === 'myqr' && (

                <div className="qr-display">

                    <div className="qr-card">

                        <div className="qr-user-info">

                            <div className="qr-avatar">

                                {user?.name
                                    ?.charAt(0)
                                    ?.toUpperCase()}

                            </div>

                            <h3>{user?.name}</h3>

                            <p>{user?.phone}</p>

                        </div>

                        {qrImage && (

                            <div className="qr-image-wrapper">

                                <img
                                    src={qrImage}
                                    alt="My QR"
                                />

                            </div>

                        )}

                        <p className="qr-instruction">

                            Scan this QR to pay me

                        </p>

                    </div>

                    {/* Amount */}

                    <div className="input-group">

                        <label>
                            Set Amount
                            (optional)
                        </label>

                        <div className="input-wrapper amount-input">

                            <span className="currency-symbol">
                                ◈
                            </span>

                            <input
                                type="number"
                                placeholder="0.00"
                                step="0.001"
                                min="0"
                                value={amount}
                                onChange={(e) =>
                                    setAmount(
                                        e.target.value
                                    )
                                }
                            />

                        </div>

                        <p className="input-hint">

                            Generate payment request QR

                        </p>

                    </div>

                </div>

            )}

            {/* Scan QR */}

            {activeTab === 'scan' && (

                <div className="qr-scanner">

                    {!scanResult ? (

                        <>

                            <div
                                id="qr-reader"
                                className="scanner-viewport"
                            ></div>

                            <p className="scan-instruction">

                                Point camera at BlockPay QR

                            </p>

                        </>

                    ) : (

                        <div className="scan-result">

                            <div className="scan-success-icon">

                                ✅

                            </div>

                            <h3>
                                QR Scanned Successfully
                            </h3>

                            <p className="scan-phone">

                                {scanResult.phone}

                            </p>

                            {scanResult.amount && (

                                <p className="scan-amount">

                                    Amount:
                                    {' '}
                                    {scanResult.amount}

                                </p>

                            )}

                            <div className="scan-actions">

                                <button
                                    className="btn-secondary"
                                    onClick={() => {

                                        setScanResult(null);

                                        setActiveTab('scan');

                                    }}
                                >
                                    Scan Again
                                </button>

                                <button
                                    className="btn-primary"
                                    onClick={
                                        handlePayFromScan
                                    }
                                >
                                    Pay Now
                                </button>

                            </div>

                        </div>

                    )}

                </div>

            )}

        </div>

    );

}