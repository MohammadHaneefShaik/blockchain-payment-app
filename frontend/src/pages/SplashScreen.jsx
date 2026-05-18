/**
 * SplashScreen — Animated loading screen with BlockPay branding
 * Routes:
 *   - PIN verified this session + valid token → Dashboard
 *   - Saved phone (returning user) but no PIN this session → Login (PIN-only mode)
 *   - No saved phone / logged out → Login (full phone + PIN)
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function SplashScreen() {
    const { token, loading } = useAuth();
    const navigate = useNavigate();
    const [fadeOut, setFadeOut] = useState(false);

    useEffect(() => {
        // Wait for auth to finish loading
        if (loading) return;

        const timer = setTimeout(() => {
            setFadeOut(true);
            setTimeout(() => {
                const pinVerified = sessionStorage.getItem('blockpay_pin_verified');
                const savedPhone = localStorage.getItem('blockpay_user_phone');
                const wasLoggedOut = localStorage.getItem('blockpay_logged_out');

                if (token && pinVerified) {
                    // Already verified PIN this session — go to dashboard
                    navigate('/dashboard', { replace: true });
                } else if (savedPhone && !wasLoggedOut) {
                    // Returning user — need PIN unlock
                    navigate('/login', { replace: true });
                } else {
                    // New user or logged out — full login
                    navigate('/login', { replace: true });
                }
            }, 500);
        }, 2000);

        return () => clearTimeout(timer);
    }, [token, loading, navigate]);

    return (
        <div className={`splash-screen ${fadeOut ? 'fade-out' : ''}`}>
            <div className="splash-bg-effects">
                <div className="splash-orb splash-orb-1"></div>
                <div className="splash-orb splash-orb-2"></div>
                <div className="splash-orb splash-orb-3"></div>
            </div>

            <div className="splash-content">
                <div className="splash-logo">
                    <div className="splash-icon pulse">
                        <svg viewBox="0 0 60 60" fill="none">
                            <rect x="6" y="6" width="20" height="20" rx="4" stroke="currentColor" strokeWidth="3" />
                            <rect x="34" y="6" width="20" height="20" rx="4" stroke="currentColor" strokeWidth="3" />
                            <rect x="6" y="34" width="20" height="20" rx="4" stroke="currentColor" strokeWidth="3" />
                            <rect x="38" y="38" width="12" height="12" rx="3" fill="currentColor" />
                        </svg>
                    </div>
                    <h1 className="splash-title">BlockPay</h1>
                    <p className="splash-tagline">Blockchain-Powered Payments</p>
                </div>

                <div className="splash-loader">
                    <div className="splash-loader-bar"></div>
                </div>
            </div>

            <p className="splash-footer">Powered by Polygon</p>
        </div>
    );
}
