/**
 * Role Manager Component
 * Manages KEY_SHOP role grants and revokes with simulation
 */
import React, { useState } from 'react';
import { useRoleManager } from '../hooks/useRoleManager';

const RoleManager = () => {
  const {
    selectedAddress,
    setSelectedAddress,
    customAddress,
    setCustomAddress,
    targetAddress,
    hasKeyShopRole,
    canManageRoles,
    roleAdmin,
    isSimulating,
    simulationResult,
    simulateRoleChange,
    executeRoleChange,
    isPending,
    txHash,
    KNOWN_ADDRESSES,
    getAddressDisplayName,
    isValidAddress,
    needsSimulation
  } = useRoleManager();

  const [showConfirm, setShowConfirm] = useState(null); // 'grant' or 'revoke'

  const handleAddressChange = (value) => {
    setSelectedAddress(value);
    if (value !== 'custom') {
      setCustomAddress('');
    }
  };

  const handleActionClick = (action) => {
    if (needsSimulation) {
      simulateRoleChange(action);
    } else if (simulationResult?.isValid && simulationResult.action === action) {
      setShowConfirm(action);
    }
  };

  const confirmAction = () => {
    if (showConfirm && simulationResult?.isValid) {
      executeRoleChange(showConfirm);
      setShowConfirm(null);
    }
  };

  const getRoleStatusDisplay = () => {
    if (!targetAddress) return null;
    
    return (
      <div className={`role-status ${hasKeyShopRole ? 'has-role' : 'no-role'}`}>
        <span className="role-icon">{hasKeyShopRole ? '✅' : '❌'}</span>
        <span className="role-text">
          {hasKeyShopRole ? 'Has KEY_SHOP role' : 'No KEY_SHOP role'}
        </span>
      </div>
    );
  };

  const getActionButtons = () => {
    if (!targetAddress || !canManageRoles) return null;

    const canGrant = !hasKeyShopRole && (!simulationResult || simulationResult.action !== 'grant' || !simulationResult.isValid);
    const canRevoke = hasKeyShopRole && (!simulationResult || simulationResult.action !== 'revoke' || !simulationResult.isValid);

    return (
      <div className="action-buttons">
        <button
          onClick={() => handleActionClick('grant')}
          disabled={!canGrant || isPending}
          className={`action-button grant ${canGrant ? 'enabled' : 'disabled'}`}
        >
          {isSimulating && needsSimulation ? '🔍 Checking...' : 
           simulationResult?.action === 'grant' && simulationResult.isValid ? '✅ Grant KEY_SHOP' :
           '🔑 Grant KEY_SHOP'}
        </button>
        
        <button
          onClick={() => handleActionClick('revoke')}
          disabled={!canRevoke || isPending}
          className={`action-button revoke ${canRevoke ? 'enabled' : 'disabled'}`}
        >
          {isSimulating && needsSimulation ? '🔍 Checking...' : 
           simulationResult?.action === 'revoke' && simulationResult.isValid ? '✅ Revoke KEY_SHOP' :
           '🚫 Revoke KEY_SHOP'}
        </button>
      </div>
    );
  };

  return (
    <div className="dashboard-panel role-manager">
      <h3>👑 Role Manager</h3>
      
      {/* Permissions Check */}
      {!canManageRoles && (
        <div className="permission-warning">
          <span className="warning-icon">⚠️</span>
          <span>You don't have permission to manage roles. Only role admin can grant/revoke.</span>
          {roleAdmin && (
            <div className="role-admin-info">
              <small>Role Admin: {getAddressDisplayName(roleAdmin)}</small>
            </div>
          )}
        </div>
      )}

      {/* Address Selection */}
      <div className="address-selection">
        <label htmlFor="addressSelect" className="input-label">
          Select Address:
        </label>
        
        <select
          id="addressSelect"
          value={selectedAddress}
          onChange={(e) => handleAddressChange(e.target.value)}
          className="address-dropdown"
          disabled={isPending}
        >
          <option value="">Choose an address...</option>
          {Object.entries(KNOWN_ADDRESSES).map(([name, value]) => (
            <option key={value} value={value}>
              {name}
            </option>
          ))}
          <option value="custom">Custom Address...</option>
        </select>

        {selectedAddress === 'custom' && (
          <div className="custom-address-input">
            <input
              type="text"
              value={customAddress}
              onChange={(e) => setCustomAddress(e.target.value)}
              placeholder="0x..."
              className={`custom-input ${customAddress && !isValidAddress(customAddress) ? 'invalid' : ''}`}
              disabled={isPending}
            />
            {customAddress && !isValidAddress(customAddress) && (
              <div className="input-error">Invalid address format</div>
            )}
          </div>
        )}
      </div>

      {/* Current Role Status */}
      {targetAddress && (
        <div className="current-status">
          <h4>📋 Current Status</h4>
          <div className="status-display">
            <div className="target-address">
              <span className="label">Address:</span>
              <code className="address">{targetAddress}</code>
              <span className="address-name">({getAddressDisplayName(targetAddress)})</span>
            </div>
            {getRoleStatusDisplay()}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {canManageRoles && getActionButtons()}

      {/* Simulation Results */}
      {simulationResult && (
        <div className="simulation-section">
          <h4>🔮 Simulation Results</h4>
          
          {simulationResult.isValid ? (
            <div className="simulation-success">
              <div className="simulation-preview">
                <div className="state-change">
                  <span className="current-state">
                    Current: {simulationResult.currentState ? '✅ Has Role' : '❌ No Role'}
                  </span>
                  <span className="arrow">→</span>
                  <span className="new-state">
                    After: {simulationResult.newState ? '✅ Has Role' : '❌ No Role'}
                  </span>
                </div>
                <div className="action-description">
                  <strong>Action:</strong> {simulationResult.message}
                </div>
                <div className="technical-details">
                  <small>
                    Function: <code>{simulationResult.functionName}</code><br/>
                    Role: <code>KEY_SHOP</code><br/>
                    Target: <code>{simulationResult.targetAddress}</code>
                  </small>
                </div>
              </div>
            </div>
          ) : (
            <div className="simulation-error">
              {simulationResult.isNoOp ? (
                <div className="no-op-message">
                  <span className="info-icon">ℹ️</span>
                  <span>{simulationResult.message}</span>
                </div>
              ) : (
                <div className="error-message">
                  <span className="error-icon">❌</span>
                  <span>{simulationResult.error || 'Simulation failed'}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="confirm-modal-overlay">
          <div className="confirm-modal">
            <h3>🔐 Confirm Role Change</h3>
            <div className="confirm-details">
              <p><strong>Action:</strong> {showConfirm.toUpperCase()} KEY_SHOP role</p>
              <p><strong>Address:</strong> {getAddressDisplayName(targetAddress)}</p>
              <p><strong>Target:</strong> <code>{targetAddress}</code></p>
              <div className="state-preview">
                <p>
                  <strong>Result:</strong> Address will {showConfirm === 'grant' ? 'gain' : 'lose'} KEY_SHOP role
                </p>
              </div>
            </div>
            <div className="confirm-actions">
              <button onClick={() => setShowConfirm(null)} className="btn-secondary">
                Cancel
              </button>
              <button onClick={confirmAction} className="btn-primary">
                Confirm {showConfirm === 'grant' ? 'Grant' : 'Revoke'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Status */}
      {txHash && (
        <div className="transaction-status">
          <p>✅ Transaction submitted!</p>
          <a 
            href={`https://sepolia.basescan.org/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="tx-link"
          >
            View on BaseScan →
          </a>
        </div>
      )}

      <style jsx>{`
        .role-manager {
          max-width: 600px;
        }

        .permission-warning {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem;
          background: #fef3c7;
          border: 1px solid #f59e0b;
          border-radius: 8px;
          margin-bottom: 1.5rem;
        }

        .warning-icon {
          color: #d97706;
        }

        .role-admin-info {
          margin-top: 0.5rem;
          font-family: 'JetBrains Mono', monospace;
        }

        .address-selection {
          margin-bottom: 1.5rem;
        }

        .input-label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: #374151;
        }

        .address-dropdown {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 0.95rem;
          background: white;
        }

        .address-dropdown:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
        }

        .custom-address-input {
          margin-top: 0.75rem;
        }

        .custom-input {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.9rem;
        }

        .custom-input.invalid {
          border-color: #ef4444;
        }

        .input-error {
          color: #ef4444;
          font-size: 0.8rem;
          margin-top: 0.25rem;
        }

        .current-status {
          margin-bottom: 1.5rem;
          padding: 1rem;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
        }

        .current-status h4 {
          margin: 0 0 0.75rem 0;
          color: #374151;
        }

        .target-address {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
          font-size: 0.9rem;
        }

        .target-address .address {
          font-family: 'JetBrains Mono', monospace;
          background: #e5e7eb;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
        }

        .address-name {
          color: #6b7280;
          font-style: italic;
        }

        .role-status {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem;
          border-radius: 6px;
        }

        .role-status.has-role {
          background: #d1fae5;
          color: #065f46;
        }

        .role-status.no-role {
          background: #fee2e2;
          color: #991b1b;
        }

        .action-buttons {
          display: flex;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .action-button {
          flex: 1;
          padding: 0.75rem 1rem;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .action-button.grant.enabled {
          background: #059669;
          color: white;
        }

        .action-button.grant.enabled:hover {
          background: #047857;
        }

        .action-button.revoke.enabled {
          background: #dc2626;
          color: white;
        }

        .action-button.revoke.enabled:hover {
          background: #b91c1c;
        }

        .action-button.disabled {
          background: #e5e7eb;
          color: #9ca3af;
          cursor: not-allowed;
        }

        .simulation-section {
          margin-bottom: 1.5rem;
          padding: 1rem;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
        }

        .simulation-section h4 {
          margin: 0 0 0.75rem 0;
          color: #374151;
        }

        .simulation-success {
          background: #ecfdf5;
          padding: 1rem;
          border-radius: 6px;
          border: 1px solid #d1fae5;
        }

        .state-change {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.75rem;
          font-family: 'JetBrains Mono', monospace;
        }

        .arrow {
          color: #059669;
          font-weight: bold;
        }

        .action-description {
          margin-bottom: 0.75rem;
          color: #065f46;
        }

        .technical-details {
          color: #6b7280;
          font-family: 'JetBrains Mono', monospace;
        }

        .simulation-error {
          background: #fef2f2;
          padding: 1rem;
          border-radius: 6px;
          border: 1px solid #fecaca;
        }

        .no-op-message, .error-message {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .error-message {
          color: #991b1b;
        }

        .confirm-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .confirm-modal {
          background: white;
          padding: 2rem;
          border-radius: 12px;
          max-width: 500px;
          width: 90%;
        }

        .confirm-modal h3 {
          margin: 0 0 1rem 0;
          color: #374151;
        }

        .confirm-details {
          margin-bottom: 1.5rem;
          padding: 1rem;
          background: #f8fafc;
          border-radius: 6px;
        }

        .confirm-details p {
          margin: 0.5rem 0;
        }

        .state-preview {
          margin-top: 0.75rem;
          padding-top: 0.75rem;
          border-top: 1px solid #e2e8f0;
        }

        .confirm-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
        }

        .btn-secondary, .btn-primary {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
        }

        .btn-secondary {
          background: #e5e7eb;
          color: #374151;
        }

        .btn-primary {
          background: #059669;
          color: white;
        }

        .transaction-status {
          padding: 1rem;
          background: #ecfdf5;
          border: 1px solid #d1fae5;
          border-radius: 8px;
          text-align: center;
        }

        .tx-link {
          color: #059669;
          text-decoration: none;
          font-weight: 600;
        }

        .tx-link:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
};

export default RoleManager;