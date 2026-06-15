const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({

    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },

    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        unique: true,
        trim: true,
        index: true
    },

    // Email address for OTP verification
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true
    },

    // 4-digit PIN (bcrypt hashed) — replaces password
    pin: {
        type: String,
        required: [true, 'PIN is required'],
        minlength: 4
    },

    // Blockchain wallet address (auto-created on signup)
    walletAddress: {
        type: String,
        default: ''
    },

    // AES-encrypted private key (stored securely)
    encryptedPrivateKey: {
        type: String,
        default: ''
    },

    // QR code data for receiving payments
    qrCode: {
        type: String,
        default: ''
    },

    // Cached balance (updated periodically)
    balance: {
        type: String,
        default: '0'
    },

    isVerified: {
        type: Boolean,
        default: false
    },

    createdAt: {
        type: Date,
        default: Date.now
    }

});

// Hash PIN before saving
UserSchema.pre('save', async function () {

    if (!this.isModified('pin')) {
        return;
    }

    const salt = await bcrypt.genSalt(10);
    this.pin = await bcrypt.hash(this.pin, salt);

});

// Compare PIN method
UserSchema.methods.comparePin = async function (candidatePin) {
    if (!this.pin) return false;
    return bcrypt.compare(candidatePin, this.pin);
};

module.exports =
    mongoose.models.User ||
    mongoose.model('User', UserSchema);