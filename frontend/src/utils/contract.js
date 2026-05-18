// BlockPay Smart Contract ABI
// Contract: BlockPay.sol deployed on Polygon Amoy Testnet
export const BLOCKPAY_ABI = [
    {
        "inputs": [
            {
                "internalType": "address payable",
                "name": "receiver",
                "type": "address"
            }
        ],
        "name": "sendPayment",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "address",
                "name": "from",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "address",
                "name": "to",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "PaymentSent",
        "type": "event"
    }
];

// Contract address - update after deployment
export const CONTRACT_ADDRESS = '';

// Polygon Amoy Testnet config
export const NETWORK_CONFIG = {
    chainId: '0x13882',
    chainName: 'Polygon Amoy Testnet',
    nativeCurrency: {
        name: 'MATIC',
        symbol: 'MATIC',
        decimals: 18
    },
    rpcUrls: ['https://rpc-amoy.polygon.technology'],
    blockExplorerUrls: ['https://amoy.polygonscan.com/']
};
