/**
 * AES-256 Encryption Utilities for Private Key Security
 * Uses crypto-js for encrypting/decrypting blockchain wallet private keys
 */

const CryptoJS = require('crypto-js');

// Encryption secret from environment
const getSecret = () => {
    const secret = process.env.ENCRYPTION_SECRET;
    if (!secret) {
        throw new Error('ENCRYPTION_SECRET is not set in environment variables');
    }
    return secret;
};

/**
 * Encrypt a private key using AES-256
 * @param {string} privateKey - The raw private key to encrypt
 * @returns {string} - The encrypted private key (base64 encoded)
 */
const encryptPrivateKey = (privateKey) => {
    const secret = getSecret();
    const encrypted = CryptoJS.AES.encrypt(privateKey, secret).toString();
    return encrypted;
};

/**
 * Decrypt an encrypted private key
 * @param {string} encryptedKey - The AES-encrypted private key
 * @returns {string} - The decrypted private key
 */
const decryptPrivateKey = (encryptedKey) => {
    const secret = getSecret();
    const bytes = CryptoJS.AES.decrypt(encryptedKey, secret);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    if (!decrypted) {
        throw new Error('Failed to decrypt private key — invalid encryption secret');
    }
    return decrypted;
};

module.exports = { encryptPrivateKey, decryptPrivateKey };
