import axios from 'axios';

const API = axios.create({
<<<<<<< HEAD
    baseURL: 'http://127.0.0.1:5001/api'
=======
    baseURL: import.meta.env.VITE_API_URL
>>>>>>> 32ee32a041c9b9fa0386a1e5ec02f953008c66e3
});

// Add JWT token to every request
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('blockpay_token');

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

// ========== Auth APIs (new OTP + PIN flow) ==========
export const sendOTP = (phone) => API.post('/auth/send-otp', { phone });
export const verifyOTP = (data) => API.post('/auth/verify-otp', data);
export const setPin = (data) => API.post('/auth/set-pin', data);
export const login = (data) => API.post('/auth/login', data);

// ========== User APIs ==========
export const getProfile = () => API.get('/user/profile');
<<<<<<< HEAD
export const getBalance = () => API.get('/user/balance');
export const lookupUser = (phone) => API.get(`/user/lookup/${phone}`);

// ========== Transaction APIs (backend-signed) ==========
export const sendPayment = (data) => API.post('/transactions/send', data);
export const getTransactions = () => API.get('/transactions');
export const verifyTransaction = (txHash) => API.get(`/transactions/verify/${txHash}`);

// ========== Notification APIs ==========
export const getNotifications = () => API.get('/notifications');
export const getUnreadCount = () => API.get('/notifications/unread-count');
export const markAllNotificationsRead = () => API.put('/notifications/read-all');
export const markNotificationRead = (id) => API.put(`/notifications/${id}/read`);
=======
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
>>>>>>> 32ee32a041c9b9fa0386a1e5ec02f953008c66e3

export default API;
