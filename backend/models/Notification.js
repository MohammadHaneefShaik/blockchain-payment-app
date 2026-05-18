const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    userPhone: {
        type: String,
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: ['payment_received', 'payment_sent', 'welcome', 'system'],
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    data: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    read: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Notification', NotificationSchema);
