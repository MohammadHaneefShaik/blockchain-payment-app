const express = require('express');
const auth = require('../middleware/authMiddleware');
const User = require('../models/User');
const router = express.Router();

// @route   GET /api/user/profile
// @desc    Get current user's profile
router.get('/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (err) {
        console.error('Profile error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/user/wallet
// @desc    Update wallet address
router.put('/wallet', auth, async (req, res) => {
    try {
        const { walletAddress } = req.body;

        if (!walletAddress) {
            return res.status(400).json({ message: 'Wallet address is required' });
        }

        // Check if another user already has this wallet address
        const existingUser = await User.findOne({
            walletAddress: { $regex: new RegExp(`^${walletAddress}$`, 'i') },
            _id: { $ne: req.user.id }
        });

        if (existingUser) {
            return res.status(400).json({
                message: 'This wallet is already linked to another account. Each user must use a unique wallet address.'
            });
        }

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { walletAddress },
            { new: true }
        ).select('-password');

        res.json({
            message: 'Wallet connected successfully',
            user
        });
    } catch (err) {
        console.error('Wallet update error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/user/lookup/:phone
// @desc    Lookup a user by phone number
router.get('/lookup/:phone', auth, async (req, res) => {
    try {
        const user = await User.findOne({ phone: req.params.phone }).select('name phone walletAddress');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (!user.walletAddress) {
            return res.status(400).json({ message: 'User has not connected a wallet' });
        }
        res.json(user);
    } catch (err) {
        console.error('Lookup error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
