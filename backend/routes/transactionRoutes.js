const express = require('express');
const { ethers } = require('ethers');
const auth = require('../middleware/authMiddleware');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { notifyUser } = require('../socket');
const router = express.Router();

// @route   POST /api/transactions
// @desc    Record a new transaction
router.post('/', auth, async (req, res) => {
    try {
        const { receiverPhone, amount, txHash, note } = req.body;

        if (!receiverPhone || !amount || !txHash) {
            return res.status(400).json({ message: 'Receiver phone, amount, and txHash are required' });
        }

        // Get sender info
        const sender = await User.findById(req.user.id);
        if (!sender) {
            return res.status(404).json({ message: 'Sender not found' });
        }

        // Get receiver info
        const receiver = await User.findOne({ phone: receiverPhone });
        if (!receiver) {
            return res.status(404).json({ message: 'Receiver not found' });
        }

        // Block same-wallet transactions
        if (sender.walletAddress.toLowerCase() === receiver.walletAddress.toLowerCase()) {
            return res.status(400).json({
                message: 'Cannot send to the same wallet address. Sender and receiver must have different wallets.'
            });
        }

        const transaction = new Transaction({
            senderPhone: sender.phone,
            receiverPhone: receiver.phone,
            senderWallet: sender.walletAddress,
            receiverWallet: receiver.walletAddress,
            amount,
            txHash,
            note: note || '',
            status: 'confirmed'
        });

        await transaction.save();

        // === Create notifications for both users ===

        // Notification for receiver (payment received)
        const receiverNotif = await Notification.create({
            userPhone: receiver.phone,
            type: 'payment_received',
            title: 'Payment Received! 💰',
            message: `${sender.name} sent you ${amount} MATIC`,
            data: {
                senderName: sender.name,
                senderPhone: sender.phone,
                amount,
                txHash,
                note: note || ''
            }
        });

        // Notification for sender (payment sent)
        await Notification.create({
            userPhone: sender.phone,
            type: 'payment_sent',
            title: 'Payment Sent ✅',
            message: `You sent ${amount} MATIC to ${receiver.name}`,
            data: {
                receiverName: receiver.name,
                receiverPhone: receiver.phone,
                amount,
                txHash,
                note: note || ''
            }
        });

        // === Send real-time push to receiver via Socket.IO ===
        notifyUser(receiver.phone, {
            id: receiverNotif._id,
            type: 'payment_received',
            title: 'Payment Received! 💰',
            message: `${sender.name} sent you ${amount} MATIC`,
            data: {
                senderName: sender.name,
                amount,
                txHash
            },
            createdAt: receiverNotif.createdAt
        });

        res.status(201).json({
            message: 'Transaction recorded successfully',
            transaction
        });
    } catch (err) {
        console.error('Transaction record error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/transactions
// @desc    Get user's transaction history
router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const transactions = await Transaction.find({
            $or: [
                { senderPhone: user.phone },
                { receiverPhone: user.phone }
            ]
        }).sort({ timestamp: -1 }).limit(50);

        res.json(transactions);
    } catch (err) {
        console.error('Transaction history error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/transactions/verify/:txHash
// @desc    Verify a transaction on blockchain
router.get('/verify/:txHash', auth, async (req, res) => {
    try {
        const { txHash } = req.params;
        const rpcUrl = process.env.RPC_URL || 'https://rpc-amoy.polygon.technology';

        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const receipt = await provider.getTransactionReceipt(txHash);

        if (!receipt) {
            return res.json({ verified: false, message: 'Transaction not found on blockchain' });
        }

        res.json({
            verified: receipt.status === 1,
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed.toString(),
            from: receipt.from,
            to: receipt.to
        });
    } catch (err) {
        console.error('Verification error:', err);
        res.status(500).json({ message: 'Error verifying transaction' });
    }
});

module.exports = router;
