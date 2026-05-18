const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

// @route   POST /api/auth/signup
// @desc    Register a new user
router.post('/signup', async (req, res) => {

    console.log("SIGNUP ROUTE HIT");

    try {
        console.log(req.body);
        const { name, phone, password } = req.body;

        if (!name || !phone || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        // Check if user exists
        const existingUser = await User.findOne({ phone });
        if (existingUser) {
            return res.status(400).json({ message: 'User with this phone already exists' });
        }

        // Create user
        const user = new User({ name, phone, password });
        console.log("Before save");

        console.log(user);
        await user.save();
        console.log("After save");
        // Generate JWT
        const token = jwt.sign(
            { id: user._id, phone: user.phone },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'User registered successfully',
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

        console.log("========= SIGNUP ERROR =========");

        console.log(err);

        console.log(err.message);

        res.status(500).json({
            message: err.message
        });
    }
});

// @route   POST /api/auth/login
// @desc    Authenticate user and return JWT
router.post('/login', async (req, res) => {
    try {
        const { phone, password } = req.body;

        if (!phone || !password) {
            return res.status(400).json({ message: 'Phone and password are required' });
        }

        // Find user
        const user = await User.findOne({ phone });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
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
        console.error('Login error:', err);
        res.status(500).json({ message: 'Server error during login' });
    }
});

// @route   POST /api/auth/verify-otp
// @desc    Simulate OTP verification (demo: accepts 123456)
router.post('/verify-otp', async (req, res) => {
    try {
        const { phone, otp } = req.body;

        if (!phone || !otp) {
            return res.status(400).json({ message: 'Phone and OTP are required' });
        }

        // Demo OTP verification — accepts 123456
        if (otp !== '123456') {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        // Mark user as verified
        const user = await User.findOneAndUpdate(
            { phone },
            { isVerified: true },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            message: 'OTP verified successfully',
            user: {
                id: user._id,
                name: user.name,
                phone: user.phone,
                isVerified: true
            }
        });
    } catch (err) {
        console.error('OTP verification error:', err);
        res.status(500).json({ message: 'Server error during OTP verification' });
    }
});

module.exports = router;
