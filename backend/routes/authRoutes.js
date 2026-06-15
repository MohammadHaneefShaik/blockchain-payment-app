/**
 * Authentication Routes for BlockPay
 * Flow: send-otp → verify-otp → set-pin (creates wallet) → login
 * No MetaMask required — wallets created automatically
 */

const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { createWallet, fundNewUser } = require('../utils/blockchain');
const Notification = require('../models/Notification');
const { sendEmail } = require('../utils/mailer');
const crypto = require('crypto');
const router = express.Router();

// In-memory OTP store (use Redis in production)
const otpStore = new Map();

/**
 * @route   POST /api/auth/send-otp
 * @desc    Send OTP to phone number (demo: always stores 123456)
 */
router.post('/send-otp', async (req, res) => {
    try {
        const { email, name, phone } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        // Generate OTP (dynamic, using crypto.randomBytes for compatibility)
        const otp = (function(){
            const buf = crypto.randomBytes(3); // 24 bits
            const num = buf.readUIntBE(0,3) % 900000 + 100000; // 100000-999999
            return num.toString();
        })();
        otpStore.set(email, {
            otp,
            expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes
        });

        // Send OTP via email to the provided address
        await sendEmail(email, 'BlockPay OTP', `<p>Your OTP is: ${otp}</p>`);

        console.log(`📧 OTP for ${email}: ${otp}`);

        console.log(`📱 OTP for ${phone}: ${otp}`);

        res.json({
            message: 'OTP sent successfully',
            ...(process.env.OTP_DEMO_MODE === 'true' ? { demo_otp: otp } : {})
        });
    } catch (err) {
        console.error('Send OTP error:', err);
        res.status(500).json({ message: 'Failed to send OTP' });
    }
});

/**
 * @route   POST /api/auth/verify-otp
 * @desc    Verify OTP and return temporary token for PIN setup
 */
router.post('/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ message: 'Email and OTP are required' });
        }

        const stored = otpStore.get(email);

        if (!stored) {
            return res.status(400).json({ message: 'No OTP found. Please request a new one.' });
        }

        if (Date.now() > stored.expiresAt) {
            otpStore.delete(email);
            return res.status(400).json({ message: 'OTP expired. Please request a new one.' });
        }

        if (stored.otp !== otp) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        // OTP verified — clean up
        otpStore.delete(email);

        // Check if user already exists
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            existingUser.isVerified = true;
            await existingUser.save();

            const token = jwt.sign(
                { id: existingUser._id, email: existingUser.email },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );

            return res.json({
                message: 'OTP verified — welcome back!',
                isExistingUser: true,
                token,
                user: {
                    id: existingUser._id,
                    name: existingUser.name,
                    email: existingUser.email,
                    walletAddress: existingUser.walletAddress,
                    isVerified: true
                }
            });
        }

        // New user — return temp token for PIN setup
        const tempToken = jwt.sign(
            { email, verified: true },
            process.env.JWT_SECRET,
            { expiresIn: '15m' }
        );

        res.json({
            message: 'OTP verified successfully',
            isExistingUser: false,
            tempToken
        });
    } catch (err) {
        console.error('OTP verification error:', err);
        res.status(500).json({ message: 'Server error during OTP verification' });
    }
});

/**
 * @route   POST /api/auth/set-pin
 * @desc    Set 4-digit PIN, create wallet, fund with test POL
 */
router.post('/set-pin', async (req, res) => {
    try {
        const { name, phone, email, pin, tempToken, firebaseVerified, firebaseUid } = req.body;

        // Validate inputs
        if (!name || !phone || !pin) {
            return res.status(400).json({ message: 'Name, phone, and PIN are required' });
        }

        if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
            return res.status(400).json({ message: 'PIN must be exactly 4 digits' });
        }

        // Verify authorization: either tempToken or Firebase verification
        if (firebaseVerified && firebaseUid) {
            // Firebase has already verified the phone number
            console.log(`✅ Firebase-verified signup: ${phone}, UID: ${firebaseUid}`);
        } else if (tempToken) {
            // Legacy: verify temp token
            let decoded;
            try {
                decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
            } catch (err) {
                return res.status(401).json({ message: 'Session expired. Please verify OTP again.' });
            }
            // Updated check: compare email and verification flag from token
            if (decoded.email !== email || !decoded.verified) {
                return res.status(401).json({ message: 'Invalid session. Please verify OTP again.' });
            }
        } else {
            return res.status(401).json({ message: 'Phone verification required.' });
        }

        // Check if user already exists
        // Check if user already exists by phone or email
        const existing = await User.findOne({ $or: [{ phone }, { email }] });
        if (existing) {
            return res.status(400).json({ message: 'Account already exists. Please login.' });
        }

        // Create blockchain wallet automatically
        console.log('🔐 Creating wallet for', phone);
        const { address, encryptedPrivateKey } = createWallet();
        console.log(`✅ Wallet created: ${address}`);

        // Generate QR code data
        const qrCode = `blockpay://pay/${phone}`;

        // Create user with hashed PIN and encrypted wallet
        const user = new User({
            name,
            phone,
            email,
            pin,
            walletAddress: address,
            encryptedPrivateKey,
            qrCode,
            isVerified: true
        });

        await user.save();
        console.log('✅ User created:', phone);

        // Fund new user with test POL (async — don't block response)
        fundNewUser(address).then((txHash) => {
            if (txHash) {
                console.log(`💰 User ${phone} funded: ${txHash}`);

                // Create welcome notification
                Notification.create({
                    userPhone: phone,
                    type: 'welcome',
                    title: 'Welcome to BlockPay! 🎉',
                    message: 'Your wallet has been created and funded with 0.0001 POL',
                    data: { txHash, walletAddress: address }
                }).catch(err => console.error('Welcome notification error:', err));
            }
        }).catch(err => {
            console.error('Auto-funding error:', err);
        });

        // Generate JWT
        const token = jwt.sign(
            { id: user._id, phone: user.phone },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'Account created successfully!',
            token,
            user: {
                id: user._id,
                name: user.name,
                phone: user.phone,
                walletAddress: address,
                isVerified: true
            }
        });
    } catch (err) {
        console.error('Set PIN error:', err);
        res.status(500).json({ message: err.message || 'Failed to create account' });
    }
});

/**
 * @route   POST /api/auth/login
 * @desc    Login with phone number and 4-digit PIN
 */
router.post('/login', async (req, res) => {
    try {
        const { phone, pin } = req.body;

        if (!phone || !pin) {
            return res.status(400).json({ message: 'Phone and PIN are required' });
        }

        // Find user
        const user = await User.findOne({ phone });
        if (!user) {
            return res.status(400).json({ message: 'Account not found. Please sign up.' });
        }

        // Check PIN
        const isMatch = await user.comparePin(pin);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid PIN' });
        }

        // Generate JWT
        const token = jwt.sign(
            { id: user._id, phone: user.phone },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                phone: user.phone,
                walletAddress: user.walletAddress,
                isVerified: user.isVerified
            }
        });
    } catch (err) {
        console.log(
            '================ LOGIN ERROR ================'
        );

        console.log(err);

        console.log('MESSAGE:', err.message);

        console.log('STACK:', err.stack);

        res.status(500).json({

            message: err.message

        });
    }
});

module.exports = router;
