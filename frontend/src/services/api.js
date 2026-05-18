import axios from 'axios';

const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL
});

// Add JWT token to every request
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('blockpay_token');

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

// Auth APIs
export const signup = (data) => API.post('/auth/signup', data);
export const login = (data) => API.post('/auth/login', data);
export const verifyOTP = (data) => API.post('/auth/verify-otp', data);

// User APIs
export const getProfile = () => API.get('/user/profile');
export const updateWallet = (walletAddress) =>
    API.put('/user/wallet', { walletAddress });

export const lookupUser = (phone) =>
    API.get(`/user/lookup/${phone}`);

// Transaction APIs
export const recordTransaction = (data) =>
    API.post('/transactions', data);

export const getTransactions = () =>
    API.get('/transactions');

export const verifyTransaction = (txHash) =>
    API.get(`/transactions/verify/${txHash}`);

// Notification APIs
export const getNotifications = () =>
    API.get('/notifications');

export const getUnreadCount = () =>
    API.get('/notifications/unread-count');

export const markAllNotificationsRead = () =>
    API.put('/notifications/read-all');

export const markNotificationRead = (id) =>
    API.put(`/notifications/${id}/read`);

export default API;
