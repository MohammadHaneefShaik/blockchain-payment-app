import { createContext, useContext, useState, useEffect } from 'react';
import { getProfile, getBalance as fetchBalanceAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('blockpay_token'));
    const [walletAddress, setWalletAddress] = useState('');
    const [balance, setBalance] = useState('0');
    const [loading, setLoading] = useState(true);

    // Load user on mount
    useEffect(() => {
        if (token) {
            loadUser();
        } else {
            setLoading(false);
        }
    }, [token]);

    const loadUser = async () => {
        try {
            const res = await getProfile();
            setUser(res.data);
            if (res.data.walletAddress) {
                setWalletAddress(res.data.walletAddress);
                refreshBalance();
            }
        } catch (err) {
            console.error('Failed to load user:', err);
            logout();
        } finally {
            setLoading(false);
        }
    };

    // Fetch balance from backend RPC (no MetaMask needed)
    const refreshBalance = async () => {
        try {
            const res = await fetchBalanceAPI();
            setBalance(res.data.balance || '0');
            if (res.data.walletAddress) {
                setWalletAddress(res.data.walletAddress);
            }
        } catch (err) {
            console.error('Balance fetch error:', err);
        }
    };

    const loginUser = (userData, authToken) => {
        setUser(userData);
        setToken(authToken);
        localStorage.setItem('blockpay_token', authToken);
        // Save user info for quick PIN unlock on next visit
        if (userData.phone) {
            localStorage.setItem('blockpay_user_phone', userData.phone);
        }
        if (userData.name) {
            localStorage.setItem('blockpay_user_name', userData.name);
        }
        if (userData.id) {
            localStorage.setItem('blockpay_user_id', userData.id);
        }
        // Clear any previous logout flag
        localStorage.removeItem('blockpay_logged_out');
        if (userData.walletAddress) {
            setWalletAddress(userData.walletAddress);
            // Fetch balance after a short delay to allow chain to process
            setTimeout(() => refreshBalance(), 1000);
        }
    };

    // Clear session — called on token expiry AND explicit logout
    // Note: Profile.jsx handles setting 'blockpay_logged_out' flag for explicit logout
    const logout = () => {
        setUser(null);
        setToken(null);
        setWalletAddress('');
        setBalance('0');
        localStorage.removeItem('blockpay_token');
    };

    const value = {
        user,
        token,
        walletAddress,
        balance,
        loading,
        loginUser,
        logout,
        loadUser,
        refreshBalance
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}
