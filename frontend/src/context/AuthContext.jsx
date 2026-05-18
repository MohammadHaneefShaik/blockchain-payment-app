import { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { getProfile, updateWallet } from '../services/api';
import { NETWORK_CONFIG } from '../utils/contract';

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
                fetchBalance(res.data.walletAddress);
            }
        } catch (err) {
            console.error('Failed to load user:', err);
            logout();
        } finally {
            setLoading(false);
        }
    };

    const fetchBalance = async (address) => {
        try {
            if (window.ethereum) {
                const provider = new ethers.BrowserProvider(window.ethereum);
                const bal = await provider.getBalance(address);
                setBalance(ethers.formatEther(bal));
            }
        } catch (err) {
            console.error('Balance fetch error:', err);
        }
    };

    const loginUser = (userData, authToken) => {
        setUser(userData);
        setToken(authToken);
        localStorage.setItem('blockpay_token', authToken);
        if (userData.walletAddress) {
            setWalletAddress(userData.walletAddress);
            fetchBalance(userData.walletAddress);
        }
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        setWalletAddress('');
        setBalance('0');
        localStorage.removeItem('blockpay_token');
    };

    const connectWallet = async () => {
        if (!window.ethereum) {
            alert('Please install MetaMask to connect your wallet!');
            return null;
        }

        try {
            // Request accounts
            await window.ethereum.request({ method: 'eth_requestAccounts' });

            // Try to switch to Polygon Amoy
            try {
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: NETWORK_CONFIG.chainId }]
                });
            } catch (switchError) {
                // Chain not added, add it
                if (switchError.code === 4902) {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [NETWORK_CONFIG]
                    });
                }
            }

            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const address = await signer.getAddress();

            // Save to backend
            await updateWallet(address);
            setWalletAddress(address);
            fetchBalance(address);

            // Reload user
            await loadUser();

            return address;
        } catch (err) {
            console.error('Wallet connection error:', err);
            const message = err.response?.data?.message || 'Failed to connect wallet. Please try again.';
            alert(message);
            return null;
        }
    };

    const value = {
        user,
        token,
        walletAddress,
        balance,
        loading,
        loginUser,
        logout,
        connectWallet,
        loadUser,
        fetchBalance
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}
