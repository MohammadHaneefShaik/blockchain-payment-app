import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getTransactions, verifyTransaction } from '../services/api';

export default function History() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(null);
  const [verifyResult, setVerifyResult] = useState(null);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      const res = await getTransactions();
      setTransactions(res.data);
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (txHash) => {
    setVerifying(txHash);
    setVerifyResult(null);
    try {
      const res = await verifyTransaction(txHash);
      setVerifyResult({ hash: txHash, ...res.data });
    } catch (err) {
      setVerifyResult({ hash: txHash, verified: false, message: 'Verification failed' });
    } finally {
      setVerifying(null);
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="page history-page">
      <div className="page-header">
        <h1>Transaction History</h1>
        <p>All your blockchain transactions</p>
      </div>

      {loading ? (
        <div className="empty-state">
          <div className="loading-spinner"></div>
        </div>
      ) : transactions.length === 0 ? (
        <div className="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="64" height="64">
            <rect x="2" y="3" width="20" height="18" rx="3"></rect>
            <line x1="2" y1="9" x2="22" y2="9"></line>
            <line x1="9" y1="21" x2="9" y2="9"></line>
          </svg>
          <h3>No Transactions Yet</h3>
          <p>Your transaction history will appear here</p>
        </div>
      ) : (
        <div className="transaction-list full">
          {transactions.map((txn, i) => {
            const isSent = txn.senderPhone === user?.phone;
            return (
              <div key={i} className="txn-item-full">
                <div className="txn-item-top">
                  <div className={`txn-icon ${isSent ? 'sent' : 'received'}`}>
                    {isSent ? '↑' : '↓'}
                  </div>
                  <div className="txn-details">
                    <p className="txn-party">
                      {isSent ? `To: ${txn.receiverPhone}` : `From: ${txn.senderPhone}`}
                    </p>
                    <p className="txn-time">{formatDate(txn.timestamp)}</p>
                    {txn.note && <p className="txn-note">📝 {txn.note}</p>}
                  </div>
                  <div className={`txn-amount ${isSent ? 'negative' : 'positive'}`}>
                    {isSent ? '-' : '+'}{txn.amount} MATIC
                  </div>
                </div>
                <div className="txn-item-bottom">
                  <a
                    href={`https://amoy.polygonscan.com/tx/${txn.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tx-link"
                  >
                    {txn.txHash?.slice(0, 10)}...{txn.txHash?.slice(-6)}
                  </a>
                  <div className="txn-actions">
                    <span className={`status-badge ${txn.status}`}>{txn.status}</span>
                    <button
                      className="verify-btn"
                      onClick={() => handleVerify(txn.txHash)}
                      disabled={verifying === txn.txHash}
                    >
                      {verifying === txn.txHash ? '...' : 'Verify'}
                    </button>
                  </div>
                </div>
                {verifyResult && verifyResult.hash === txn.txHash && (
                  <div className={`verify-result ${verifyResult.verified ? 'verified' : 'failed'}`}>
                    {verifyResult.verified
                      ? `✅ Verified on block #${verifyResult.blockNumber}`
                      : `❌ ${verifyResult.message}`}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
