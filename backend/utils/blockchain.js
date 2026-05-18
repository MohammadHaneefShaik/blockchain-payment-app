/**
 * Blockchain Utilities for BlockPay
 * Handles wallet creation, balance fetching, and transaction signing
 * All blockchain interactions happen server-side — users never touch crypto
 */

const { ethers } = require('ethers');
const { encryptPrivateKey, decryptPrivateKey } = require('./crypto');

// Polygon Amoy Testnet Configuration
const RPC_URL = process.env.RPC_URL || 'https://rpc-amoy.polygon.technology';
const CHAIN_ID = parseInt(process.env.CHAIN_ID || '80002');

/**
 * Get a JSON RPC provider for Polygon Amoy
 */
const getProvider = () => {
    return new ethers.JsonRpcProvider(RPC_URL, {
        name: 'polygon-amoy',
        chainId: CHAIN_ID
    });
};

/**
 * Create a new random wallet for a user
 * @returns {{ address: string, encryptedPrivateKey: string }}
 */
const createWallet = () => {
    const wallet = ethers.Wallet.createRandom();
    const encryptedKey = encryptPrivateKey(wallet.privateKey);

    return {
        address: wallet.address,
        encryptedPrivateKey: encryptedKey
    };
};

/**
 * Get the POL balance of a wallet address
 * @param {string} address - Wallet address
 * @returns {Promise<string>} - Balance in POL (e.g. "0.1000")
 */
const getBalance = async (address) => {
    try {
        const provider = getProvider();
        const balance = await provider.getBalance(address);
        return ethers.formatEther(balance);
    } catch (err) {
        console.error('Balance fetch error:', err.message);
        return '0';
    }
};

/**
 * Send a blockchain transaction (server-side signing)
 * @param {string} senderEncryptedKey - AES-encrypted private key of sender
 * @param {string} toAddress - Recipient wallet address
 * @param {string} amount - Amount in POL (e.g. "0.01")
 * @returns {Promise<{ txHash: string, status: string }>}
 */
const sendTransaction = async (senderEncryptedKey, toAddress, amount) => {
    const provider = getProvider();

    // Decrypt sender's private key and create wallet signer
    const privateKey = decryptPrivateKey(senderEncryptedKey);
    const wallet = new ethers.Wallet(privateKey, provider);

    // Fetch current gas fees (Polygon Amoy needs higher priority fee)
    const feeData = await provider.getFeeData();
    const minTip = ethers.parseUnits('30', 'gwei');
    const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas > minTip
        ? feeData.maxPriorityFeePerGas
        : minTip;
    const maxFeePerGas = (feeData.maxFeePerGas || maxPriorityFeePerGas) + maxPriorityFeePerGas;

    // Build and send transaction
    const tx = await wallet.sendTransaction({
        to: toAddress,
        value: ethers.parseEther(amount),
        maxPriorityFeePerGas,
        maxFeePerGas
    });

    console.log(`📤 Transaction sent: ${tx.hash}`);

    // Wait for confirmation (1 block)
    const receipt = await tx.wait(1);

    return {
        txHash: tx.hash,
        status: receipt.status === 1 ? 'confirmed' : 'failed',
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
    };
};

/**
 * Fund a newly created wallet with test POL from the admin/master wallet
 * @param {string} toAddress - New user's wallet address
 * @param {string} amount - Amount to send (default: "0.00001")
 * @returns {Promise<string|null>} - Transaction hash or null on failure
 */
const fundNewUser = async (toAddress, amount = '0.01') => {
    const adminKey = process.env.ADMIN_PRIVATE_KEY;

    if (!adminKey) {
        console.warn('⚠️  ADMIN_PRIVATE_KEY not set — skipping auto-funding');
        return null;
    }

    try {
        const provider = getProvider();
        const adminWallet = new ethers.Wallet(adminKey, provider);

        // Check admin balance first
        const adminBalance = await provider.getBalance(adminWallet.address);
        const requiredAmount = ethers.parseEther(amount);

        if (adminBalance < requiredAmount) {
            console.warn(`⚠️  Admin wallet has insufficient balance: ${ethers.formatEther(adminBalance)} POL`);
            return null;
        }

        // Fetch gas fees
        const feeData = await provider.getFeeData();
        const minTip = ethers.parseUnits('30', 'gwei');
        const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas > minTip
            ? feeData.maxPriorityFeePerGas
            : minTip;
        const maxFeePerGas = (feeData.maxFeePerGas || maxPriorityFeePerGas) + maxPriorityFeePerGas;

        const tx = await adminWallet.sendTransaction({
            to: toAddress,
            value: requiredAmount,
            maxPriorityFeePerGas,
            maxFeePerGas
        });

        console.log(`💰 Funding new user ${toAddress}: ${tx.hash}`);
        await tx.wait(1);
        console.log(`✅ Funded successfully: ${amount} POL`);

        return tx.hash;
    } catch (err) {
        console.error('❌ Auto-funding failed:', err.message);
        return null;
    }
};

module.exports = {
    getProvider,
    createWallet,
    getBalance,
    sendTransaction,
    fundNewUser
};
