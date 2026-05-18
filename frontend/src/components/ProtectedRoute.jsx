import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
    const { token, loading } = useAuth();

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="loading-spinner"></div>
                <p>Loading BlockPay...</p>
            </div>
        );
    }

    if (!token) {
        return <Navigate to="/" replace />;
    }

    return children;
}
