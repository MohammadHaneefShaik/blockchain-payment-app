import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Signup from './pages/Signup';
import VerifyOTP from './pages/VerifyOTP';
import Dashboard from './pages/Dashboard';
import SendPayment from './pages/SendPayment';
import QRPage from './pages/QRPage';
import History from './pages/History';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <BrowserRouter>
          <div className="app-container">
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/verify-otp" element={<VerifyOTP />} />
              <Route path="/dashboard" element={
                <ProtectedRoute><Dashboard /></ProtectedRoute>
              } />
              <Route path="/send" element={
                <ProtectedRoute><SendPayment /></ProtectedRoute>
              } />
              <Route path="/qr" element={
                <ProtectedRoute><QRPage /></ProtectedRoute>
              } />
              <Route path="/history" element={
                <ProtectedRoute><History /></ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute><Profile /></ProtectedRoute>
              } />
              <Route path="/notifications" element={
                <ProtectedRoute><Notifications /></ProtectedRoute>
              } />
            </Routes>
            <Navbar />
          </div>
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
