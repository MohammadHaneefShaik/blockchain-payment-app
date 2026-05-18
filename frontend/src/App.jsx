import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { Toaster } from 'react-hot-toast';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import SplashScreen from './pages/SplashScreen';
import Login from './pages/Login';
import Signup from './pages/Signup';
import VerifyOTP from './pages/VerifyOTP';
import SetPIN from './pages/SetPIN';
import Dashboard from './pages/Dashboard';
import SendPayment from './pages/SendPayment';
import QRPage from './pages/QRPage';
import History from './pages/History';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Notifications from './pages/Notifications';

function App() {
    return (
        <AuthProvider>
            <SocketProvider>
                <BrowserRouter>
                    <div className="app-container">
                        <Toaster position="top-center" toastOptions={{
                            style: { background: '#1a1b2e', color: '#fff', border: '1px solid rgba(139,92,246,0.3)' }
                        }} />
                        <Routes>
                            <Route path="/" element={<SplashScreen />} />
                            <Route path="/login" element={<Login />} />
                            <Route path="/signup" element={<Signup />} />
                            <Route path="/verify-otp" element={<VerifyOTP />} />
                            <Route path="/set-pin" element={<SetPIN />} />
                            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                            <Route path="/send" element={<ProtectedRoute><SendPayment /></ProtectedRoute>} />
                            <Route path="/qr" element={<ProtectedRoute><QRPage /></ProtectedRoute>} />
                            <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
                            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                            <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
                        </Routes>
                        <Navbar />
                    </div>
                </BrowserRouter>
            </SocketProvider>
        </AuthProvider>
    );
}

export default App;
