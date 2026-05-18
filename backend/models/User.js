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

    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: 6
    },

    walletAddress: {
        type: String,
        default: ''
    },

    qrCode: {
        type: String,
        default: ''
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

// Hash password before saving
UserSchema.pre('save', async function () {

    if (!this.isModified('password')) {
        return;
    }

    const salt = await bcrypt.genSalt(10);

    this.password = await bcrypt.hash(this.password, salt);

});

// Compare password method
UserSchema.methods.comparePassword = async function (candidatePassword) {

    return bcrypt.compare(candidatePassword, this.password);

};

module.exports =
    mongoose.models.User ||
    mongoose.model('User', UserSchema);