import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
    const { token, loading } = useAuth();

    if (loading) {
        return <div className="loading-screen"><div className="loading-spinner"></div></div>;
    }

    // Must have both a valid token AND PIN verified this session
    const pinVerified = sessionStorage.getItem('blockpay_pin_verified');

    if (!token || !pinVerified) {
        return <Navigate to="/login" replace />;
    }

    return children;
}
