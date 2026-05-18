const express = require('express');
const auth = require('../middleware/authMiddleware');
const Notification = require('../models/Notification');
const User = require('../models/User');
const router = express.Router();

// @route   GET /api/notifications
// @desc    Get user's notifications
router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const notifications = await Notification.find({ userPhone: user.phone })
            .sort({ createdAt: -1 })
            .limit(50);

        const unreadCount = await Notification.countDocuments({
            userPhone: user.phone,
            read: false
        });

        res.json({ notifications, unreadCount });
    } catch (err) {
        console.error('Get notifications error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/notifications/unread-count
// @desc    Get unread notification count
router.get('/unread-count', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const unreadCount = await Notification.countDocuments({
            userPhone: user.phone,
            read: false
        });

        res.json({ unreadCount });
    } catch (err) {
        console.error('Unread count error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/notifications/read-all
// @desc    Mark all notifications as read
router.put('/read-all', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        await Notification.updateMany(
            { userPhone: user.phone, read: false },
            { read: true }
        );

        res.json({ message: 'All notifications marked as read' });
    } catch (err) {
        console.error('Mark read error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/notifications/:id/read
// @desc    Mark single notification as read
router.put('/:id/read', auth, async (req, res) => {
    try {
        const notification = await Notification.findByIdAndUpdate(
            req.params.id,
            { read: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        res.json(notification);
    } catch (err) {
        console.error('Mark read error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
