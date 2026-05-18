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

    try {

        // Detect MetaMask / Ethereum provider
        if (window.ethereum) {

            // Request wallet access
            await window.ethereum.request({
                method: 'eth_requestAccounts'
            });

            // Switch to Polygon Amoy
            try {

                await window.ethereum.request({

                    method: 'wallet_switchEthereumChain',

                    params: [
                        {
                            chainId:
                                NETWORK_CONFIG.chainId
                        }
                    ]

                });

            } catch (switchError) {

                // Add network if missing
                if (switchError.code === 4902) {

                    await window.ethereum.request({

                        method: 'wallet_addEthereumChain',

                        params: [NETWORK_CONFIG]

                    });

                }

            }

            // Connect wallet
            const provider =
                new ethers.BrowserProvider(
                    window.ethereum
                );

            const signer =
                await provider.getSigner();

            const address =
                await signer.getAddress();

            // Save wallet to backend
            await updateWallet(address);

            setWalletAddress(address);

            // Fetch balance
            fetchBalance(address);

            // Reload profile
            await loadUser();

            return address;
        }

        // Mobile fallback
        const isMobile =
            /Android|iPhone|iPad|iPod/i
                .test(navigator.userAgent);

        if (isMobile) {

            // Redirect into MetaMask browser
            const dappUrl =
                window.location.host;

            window.location.href =
                `https://metamask.app.link/dapp/${dappUrl}`;

            return null;
        }

        // Desktop without MetaMask
        alert(
            'Please install MetaMask!'
        );

        return null;

    } catch (err) {

        console.error(
            'Wallet connection error:',
            err
        );

        alert(
            'Failed to connect wallet'
        );

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
