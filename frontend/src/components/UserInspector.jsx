/**
 * User Inspector Component
 * Input any address and see their balances and recent activity
 */
import React, { useState, useEffect } from 'react';
import { useUserInspector } from '../hooks/useUserInspector';

const UserInspector = () => {
  const {
    targetAddress,
    isValidAddress,
    recentTransactions,
    isLoadingTxs,
    isLoadingBalances,
    setAddress,
    fetchRecentTransactions,
    clearInspector,
    balanceSummary,
    getBasescanAddressUrl,
    getBasescanTxUrl
  } = useUserInspector();

  const [inputValue, setInputValue] = useState('');

  // Auto-fetch transactions when valid address is set
  useEffect(() => {
    if (isValidAddress) {
      fetchRecentTransactions();
    }
  }, [isValidAddress, fetchRecentTransactions]);

  const handleAddressSubmit = (e) => {
    e.preventDefault();
    setAddress(inputValue);
  };

  const handleClear = () => {
    setInputValue('');
    clearInspector();
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const openBasescan = (url) => {
    window.open(url, '_blank');
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const getStatusIcon = (success) => {
    return success ? '✅' : '❌';
  };

  return (
    <div className="dashboard-panel user-inspector">
      <div className="panel-header">
        <h3>🔍 User Inspector</h3>
        <div className="header-subtitle">
          Look up any address's balances and recent activity
        </div>
      </div>

      {/* Address Input */}
      <div className="address-input-section">
        <form onSubmit={handleAddressSubmit} className="address-form">
          <div className="input-group">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Enter Ethereum address (0x...)"
              className="address-input"
            />
            <button 
              type="submit" 
              className="btn-primary"
              disabled={!inputValue.trim()}
            >
              🔍 Inspect
            </button>
            {targetAddress && (
              <button 
                type="button" 
                onClick={handleClear}
                className="btn-secondary"
              >
                Clear
              </button>
            )}
          </div>
        </form>

        {inputValue && !isValidAddress && inputValue.trim().length > 0 && (
          <div className="validation-error">
            ⚠️ Invalid Ethereum address format
          </div>
        )}
      </div>

      {/* Address Info */}
      {isValidAddress && (
        <div className="address-info-section">
          <div className="address-display">
            <div className="address-header">
              <span className="address-label">Inspecting:</span>
              <div className="address-actions">
                <code className="address-text">{targetAddress}</code>
                <button
                  className="copy-button"
                  onClick={() => copyToClipboard(targetAddress)}
                  title="Copy address"
                >
                  📋
                </button>
                <button
                  className="basescan-button"
                  onClick={() => openBasescan(getBasescanAddressUrl(targetAddress))}
                  title="View on Basescan"
                >
                  🔗 Basescan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Balance Summary */}
      {isValidAddress && (
        <div className="balance-section">
          <h4>💰 Token Balances</h4>
          {isLoadingBalances ? (
            <div className="loading-message">Loading balances...</div>
          ) : balanceSummary ? (
            <div className="balance-grid">
              <div className="balance-item caps">
                <div className="balance-icon">🧢</div>
                <div className="balance-info">
                  <div className="balance-label">Caps</div>
                  <div className="balance-value">{balanceSummary.cap}</div>
                </div>
              </div>
              <div className="balance-item keys">
                <div className="balance-icon">🗝️</div>
                <div className="balance-info">
                  <div className="balance-label">Keys</div>
                  <div className="balance-value">{balanceSummary.key}</div>
                </div>
              </div>
              <div className="balance-item fragments">
                <div className="balance-icon">💎</div>
                <div className="balance-info">
                  <div className="balance-label">Fragments</div>
                  <div className="balance-value">{balanceSummary.fragment}</div>
                </div>
              </div>
              <div className="balance-item shards">
                <div className="balance-icon">🔮</div>
                <div className="balance-info">
                  <div className="balance-label">Shards</div>
                  <div className="balance-value">{balanceSummary.shard}</div>
                </div>
              </div>
              <div className="balance-item raccoons">
                <div className="balance-icon">🦝</div>
                <div className="balance-info">
                  <div className="balance-label">Raccoons</div>
                  <div className="balance-value">{balanceSummary.raccoon}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="error-message">Failed to load balances</div>
          )}
        </div>
      )}

      {/* Recent Transactions */}
      {isValidAddress && (
        <div className="transactions-section">
          <div className="section-header">
            <h4>📊 Recent Activity</h4>
            <button
              onClick={fetchRecentTransactions}
              disabled={isLoadingTxs}
              className="refresh-button"
            >
              {isLoadingTxs ? '🔄 Loading...' : '🔄 Refresh'}
            </button>
          </div>

          {isLoadingTxs ? (
            <div className="loading-message">Loading recent transactions...</div>
          ) : recentTransactions.length > 0 ? (
            <div className="transactions-list">
              {recentTransactions.map((tx, index) => (
                <div key={tx.hash || index} className={`transaction-item ${tx.success ? 'success' : 'failed'}`}>
                  <div className="transaction-header">
                    <div className="transaction-type">
                      {getStatusIcon(tx.success)} {tx.type}
                    </div>
                    <div className="transaction-time">
                      {formatTimestamp(tx.timestamp)}
                    </div>
                  </div>
                  <div className="transaction-details">
                    <div className="transaction-hash">
                      <code>{tx.hash}</code>
                      <div className="transaction-actions">
                        <button
                          className="copy-button"
                          onClick={() => copyToClipboard(tx.hash)}
                          title="Copy transaction hash"
                        >
                          📋
                        </button>
                        <button
                          className="basescan-button"
                          onClick={() => openBasescan(getBasescanTxUrl(tx.hash))}
                          title="Resend receipt link - View on Basescan"
                        >
                          📧 Receipt Link
                        </button>
                      </div>
                    </div>
                    <div className="transaction-block">
                      Block: {tx.blockNumber?.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-transactions">
              No recent transactions found for this address.
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .user-inspector {
          max-width: 1000px;
        }

        .panel-header {
          margin-bottom: 24px;
        }

        .header-subtitle {
          color: #6b7280;
          font-size: 14px;
          margin-top: 4px;
        }

        .address-input-section {
          margin-bottom: 24px;
        }

        .address-form {
          margin-bottom: 12px;
        }

        .input-group {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .address-input {
          flex: 1;
          padding: 12px 16px;
          border: 2px solid #d1d5db;
          border-radius: 8px;
          font-family: 'Fira Code', monospace;
          font-size: 14px;
          background: white;
        }

        .address-input:focus {
          outline: none;
          border-color: #3b82f6;
        }

        .btn-primary, .btn-secondary {
          padding: 12px 20px;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-primary {
          background: #3b82f6;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #2563eb;
        }

        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: #6b7280;
          color: white;
        }

        .btn-secondary:hover {
          background: #4b5563;
        }

        .validation-error {
          color: #dc2626;
          font-size: 14px;
          margin-top: 4px;
        }

        .address-info-section {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 24px;
        }

        .address-display {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .address-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
        }

        .address-label {
          font-weight: 600;
          color: #374151;
        }

        .address-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .address-text {
          background: #f3f4f6;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          word-break: break-all;
        }

        .balance-section {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 24px;
        }

        .balance-section h4 {
          margin: 0 0 16px 0;
          color: #374151;
        }

        .balance-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 16px;
        }

        .balance-item {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .balance-item.caps {
          border-left: 4px solid #ef4444;
        }

        .balance-item.keys {
          border-left: 4px solid #f59e0b;
        }

        .balance-item.fragments {
          border-left: 4px solid #10b981;
        }

        .balance-item.shards {
          border-left: 4px solid #8b5cf6;
        }

        .balance-item.raccoons {
          border-left: 4px solid #6b7280;
        }

        .balance-icon {
          font-size: 24px;
        }

        .balance-info {
          flex: 1;
        }

        .balance-label {
          font-size: 12px;
          text-transform: uppercase;
          font-weight: 600;
          color: #6b7280;
          margin-bottom: 2px;
        }

        .balance-value {
          font-size: 18px;
          font-weight: bold;
          color: #111827;
        }

        .transactions-section {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 20px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .section-header h4 {
          margin: 0;
          color: #374151;
        }

        .refresh-button {
          background: #6b7280;
          color: white;
          border: none;
          padding: 8px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
        }

        .refresh-button:hover:not(:disabled) {
          background: #4b5563;
        }

        .refresh-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .transactions-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .transaction-item {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 16px;
          background: #fafafa;
        }

        .transaction-item.success {
          border-left: 4px solid #10b981;
          background: #f0fdf4;
        }

        .transaction-item.failed {
          border-left: 4px solid #ef4444;
          background: #fef2f2;
        }

        .transaction-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .transaction-type {
          font-weight: 600;
          color: #374151;
        }

        .transaction-time {
          font-size: 12px;
          color: #6b7280;
        }

        .transaction-details {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .transaction-hash {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
        }

        .transaction-hash code {
          font-size: 12px;
          color: #374151;
          background: #f3f4f6;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .transaction-actions {
          display: flex;
          gap: 6px;
        }

        .copy-button, .basescan-button {
          background: #6b7280;
          color: white;
          border: none;
          padding: 4px 8px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 10px;
          white-space: nowrap;
        }

        .copy-button:hover, .basescan-button:hover {
          background: #4b5563;
        }

        .basescan-button {
          background: #3b82f6;
        }

        .basescan-button:hover {
          background: #2563eb;
        }

        .transaction-block {
          font-size: 11px;
          color: #6b7280;
        }

        .loading-message, .error-message, .no-transactions {
          text-align: center;
          padding: 24px;
          color: #6b7280;
          font-style: italic;
        }

        .error-message {
          color: #dc2626;
        }

        @media (max-width: 768px) {
          .input-group {
            flex-direction: column;
            align-items: stretch;
          }

          .address-header {
            flex-direction: column;
            align-items: stretch;
          }

          .balance-grid {
            grid-template-columns: 1fr;
          }

          .transaction-hash {
            flex-direction: column;
            align-items: stretch;
            gap: 8px;
          }
        }
      `}</style>
    </div>
  );
};

export default UserInspector;