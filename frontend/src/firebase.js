/**
 * Firebase configuration for BlockPay
 * Used for Phone Authentication (OTP verification)
 * 
 * To set up:
 * 1. Go to https://console.firebase.google.com
 * 2. Create a new project (or use existing)
 * 3. Enable Authentication > Phone sign-in method
 * 4. Add your domain to Authorized domains
 * 5. Copy your config values below
 */
import { initializeApp } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "YOUR_API_KEY",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "YOUR_PROJECT.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "YOUR_PROJECT.appspot.com",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "YOUR_SENDER_ID",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Disable app verification for testing (remove in production)
// auth.settings.appVerificationDisabledForTesting = true;

export { auth, RecaptchaVerifier, signInWithPhoneNumber };
export default app;
