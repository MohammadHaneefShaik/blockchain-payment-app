const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
    senderPhone: {
        type: String,
        required: true
    },
    receiverPhone: {
        type: String,
        required: true
    },
    senderWallet: {
        type: String,
        required: true
    },
    receiverWallet: {
        type: String,
        required: true
    },
    amount: {
        type: String,
        required: true
    },
    txHash: {
        type: String,
        required: true,
        unique: true
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'failed'],
        default: 'pending'
    },
    note: {
        type: String,
        default: ''
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Transaction', TransactionSchema);
