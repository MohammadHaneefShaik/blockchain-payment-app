/**
 * Transaction Routes for BlockPay
 * All blockchain transactions are signed and sent by the backend
 * Users only provide phone number, amount, and PIN confirmation
 */

const express = require('express');
const { ethers } = require('ethers');
const auth = require('../middleware/authMiddleware');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { notifyUser } = require('../socket');
const {
    sendTransaction,
    getProvider,
    getBalance
} = require('../utils/blockchain');
const router = express.Router();

/**
 * @route   POST /api/transactions/send
 * @desc    Execute a blockchain payment (backend-signed)
 */
router.post('/send', auth, async (req, res) => {
    try {
        const { receiverPhone, amount, pin, note } = req.body;

        // Validate inputs
        if (!receiverPhone || !amount || !pin) {
            return res.status(400).json({
                message: 'Receiver phone, amount, and PIN are required'
            });
        }

        const amountNum = parseFloat(amount);
        if (isNaN(amountNum) || amountNum <= 0) {
            return res.status(400).json({ message: 'Invalid amount' });
        }

        // Get sender
        const sender = await User.findById(req.user.id);
        if (!sender) {
            return res.status(404).json({ message: 'Sender not found' });
        }

        // Verify sender's PIN
        const pinValid = await sender.comparePin(pin);
        if (!pinValid) {
            return res.status(401).json({ message: 'Invalid PIN' });
        }

        // Block self-transfer
        if (sender.phone === receiverPhone) {
            return res.status(400).json({ message: "You can't send money to yourself" });
        }

        // Get receiver
        const receiver = await User.findOne({ phone: receiverPhone });
        if (!receiver) {
            return res.status(404).json({ message: 'Receiver not found' });
        }

        if (!receiver.walletAddress) {
            return res.status(400).json({ message: 'Receiver has no wallet' });
        }

        // Check LIVE blockchain balance
const liveBalance =
    parseFloat(
        await getBalance(
            sender.walletAddress
        )
    );

// Include gas fee buffer
const requiredBalance =
    amountNum + 0.002;

if (liveBalance < requiredBalance) {

    return res.status(400).json({

        message:
            `Insufficient balance. Need at least ${requiredBalance.toFixed(4)} POL including gas fees`

    });

}

        // Prevent duplicate transactions (same sender + receiver + amount within 30 seconds)
        const recentDuplicate = await Transaction.findOne({
            senderPhone: sender.phone,
            receiverPhone: receiver.phone,
            amount: amount.toString(),
            timestamp: { $gte: new Date(Date.now() - 30000) }
        });

        if (recentDuplicate) {
            return res.status(400).json({
                message: 'Duplicate transaction detected. Please wait before sending again.'
            });
        }

        // Check sender has encrypted key
        if (!sender.encryptedPrivateKey) {
            return res.status(400).json({ message: 'Wallet not configured. Please contact support.' });
        }

        // Execute blockchain transaction (server-side signing)
        console.log(`📤 Sending ${amount} POL: ${sender.phone} → ${receiver.phone}`);

        const result = await sendTransaction(
            sender.encryptedPrivateKey,
            receiver.walletAddress,
            amount.toString()
        );

        // Record transaction in database
        const transaction = new Transaction({
            senderPhone: sender.phone,
            receiverPhone: receiver.phone,
            senderWallet: sender.walletAddress,
            receiverWallet: receiver.walletAddress,
            amount: amount.toString(),
            txHash: result.txHash,
            note: note || '',
            status: result.status
        });

        await transaction.save();

        
        // Refresh cached balances
sender.balance =
    await getBalance(
        sender.walletAddress
    );

receiver.balance =
    await getBalance(
        receiver.walletAddress
    );

await sender.save();
await receiver.save();
        // === Create notifications for both users ===

        // Notification for receiver (payment received)
        const receiverNotif = await Notification.create({
            userPhone: receiver.phone,
            type: 'payment_received',
            title: 'Payment Received! 💰',
            message: `${sender.name} sent you ${amount} POL`,
            data: {
                senderName: sender.name,
                senderPhone: sender.phone,
                amount,
                txHash: result.txHash,
                note: note || ''
            }
        });

        // Notification for sender (payment sent)
        await Notification.create({
            userPhone: sender.phone,
            type: 'payment_sent',
            title: 'Payment Sent ✅',
            message: `You sent ${amount} POL to ${receiver.name}`,
            data: {
                receiverName: receiver.name,
                receiverPhone: receiver.phone,
                amount,
                txHash: result.txHash,
                note: note || ''
            }
        });

        // === Send real-time push to receiver via Socket.IO ===
        notifyUser(receiver.phone, {
            id: receiverNotif._id,
            type: 'payment_received',
            title: 'Payment Received! 💰',
            message: `${sender.name} sent you ${amount} POL`,
            data: {
                senderName: sender.name,
                amount,
                txHash: result.txHash
            },
            createdAt: receiverNotif.createdAt
        });

        res.status(201).json({
            message: 'Payment successful!',
            transaction: {
                txHash: result.txHash,
                amount,
                receiverName: receiver.name,
                receiverPhone: receiver.phone,
                status: result.status,
                explorerUrl: `https://amoy.polygonscan.com/tx/${result.txHash}`
            }
        });
    } catch (err) {
        console.error('Transaction error:', err);

        // Provide user-friendly error messages
        if (err.message?.includes('insufficient funds')) {
            return res.status(400).json({
                message: 'Insufficient balance for this transaction (including gas fees)'
            });
        }

        res.status(500).json({
            message: err.message || 'Transaction failed. Please try again.'
        });
    }
});

/**
 * @route   GET /api/transactions
 * @desc    Get user's transaction history
 */
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

/**
 * @route   GET /api/transactions/verify/:txHash
 * @desc    Verify a transaction on blockchain
 */
router.get('/verify/:txHash', auth, async (req, res) => {
    try {
        const { txHash } = req.params;
        const provider = getProvider();
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
