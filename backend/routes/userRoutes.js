/**
 * User Routes for BlockPay
 * Profile info, balance fetching (via RPC), and user lookup
 */

const express = require('express');
const auth = require('../middleware/authMiddleware');
const User = require('../models/User');
const { getBalance } = require('../utils/blockchain');
const router = express.Router();

/**
 * @route   GET /api/user/profile
 * @desc    Get current user's profile
 */
router.get('/profile', auth, async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'Invalid token: Missing user ID' });
        }
        const user = await User.findById(req.user.id).select('-pin -encryptedPrivateKey');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (err) {
        console.error('Profile error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * @route   GET /api/user/balance
 * @desc    Fetch live blockchain balance for the current user
 */
router.get('/balance', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!user.walletAddress) {
            return res.json({ balance: '0', walletAddress: '' });
        }

        // Fetch live balance from blockchain RPC
        const balance = await getBalance(user.walletAddress);

        // Update cached balance in database (use updateOne to skip full-doc validation on legacy users)
        await User.updateOne({ _id: user._id }, { $set: { balance } });

        res.json({
            balance,
            walletAddress: user.walletAddress
        });
    } catch (err) {
        console.error('Balance fetch error:', err);
        res.status(500).json({ message: 'Failed to fetch balance' });
    }
});

/**
 * @route   GET /api/user/lookup/:phone
 * @desc    Lookup a user by phone number (for sending payments)
 */
router.get('/lookup/:phone', auth, async (req, res) => {
    try {
        const user = await User.findOne({ phone: req.params.phone })
            .select('name phone walletAddress');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!user.walletAddress) {
            return res.status(400).json({ message: 'User wallet is not set up yet' });
        }

        res.json(user);
    } catch (err) {
        console.error('Lookup error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
