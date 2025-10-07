/**
 * ROT RITUAL COMMAND CENTER
 * Complete operational dashboard with emergency controls and monitoring
 */
import React, { useState, useEffect } from 'react';
import { useChainId } from 'wagmi';
import { useAdminAccess } from '../hooks/useAdminAccess';
import { useSecurityAudit } from '../hooks/useSecurityAudit';
import { useLiveMetrics } from '../hooks/useLiveMetrics';
import { useEmergencyControls } from '../hooks/useEmergencyControls';
import { usePauseStatus } from '../hooks/usePauseStatus';
import { useR2Health } from '../hooks/useR2Health';
import GitStatusPanel from '../components/GitStatusPanel';
import KeyPriceEditor from '../components/KeyPriceEditor';
import RoleManager from '../components/RoleManager';
import CosmeticPoolRotation from '../components/CosmeticPoolRotation';
import RelicsPoolRotation from '../components/RelicsPoolRotation';
import ApiHealthMonitor from '../components/ApiHealthMonitor';
import SystemDiagnostics from '../components/SystemDiagnostics';
import UserInspector from '../components/UserInspector';
import PoolR2Diff from '../components/PoolR2Diff';
import CosmeticUploadManager from '../components/CosmeticUploadManager';
import RewardModalPreviews from '../components/RewardModalPreviews';
import { ADDRS } from '@rot-ritual/addresses';

const Admin = () => {
  const chainId = useChainId();
  const { canRead, canWrite, accessStatus, address, permissions, isConnected } = useAdminAccess();
  
  // Only run security audit and other hooks if wallet is connected
  const { auditResults, isAuditing, runAudit, isHealthy, hasErrors, pauseStatus } = useSecurityAudit();
  const { metrics, formatRevenue, formatLatency, formatRecentTx } = useLiveMetrics();
  const { executeEmergencyAction, emergencyActions, isActionPending, auditLog } = useEmergencyControls();
  const { healthStatus: r2Health, getHealthIcon, getHealthText, formatPercentage, formatLastCheck, runHealthCheck } = useR2Health();
  
  const [showConfirmModal, setShowConfirmModal] = useState(null);
  const [confirmText, setConfirmText] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      runAudit();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [autoRefresh, runAudit]);

  // Access control - show wallet connection first
  if (!isConnected) {
    return (
      <div className="admin-access-denied">
        <h2>🎛️ ROT RITUAL COMMAND CENTER</h2>
        <h3>🔒 Wallet Connection Required</h3>
        <p>Connect your wallet to access the operational dashboard.</p>
        
        <div className="wallet-connect-section">
          <div className="access-info">
            <p><strong>Required:</strong></p>
            <ul style={{ textAlign: 'left', marginTop: '0.5rem' }}>
              <li><strong>Chain:</strong> Base Sepolia (84532)</li>
              <li><strong>Admin Address:</strong> 0x52257934A41c55F4758b92F4D23b69f920c3652A</li>
            </ul>
          </div>
          
          <div style={{ margin: '2rem 0' }}>
            <p>Click the "Connect Wallet" button in the top navigation to get started.</p>
          </div>
        </div>
      </div>
    );
  }

  // Show access denied if wrong permissions
  if (!canRead) {
    return (
      <div className="admin-access-denied">
        <h2>🔒 Access Denied</h2>
        <p>Your wallet does not have admin privileges.</p>
        <div className="access-info">
          <p><strong>Connected:</strong> {address}</p>
          <p><strong>Status:</strong> {accessStatus.reason}</p>
          <p><strong>Required Admin:</strong> 0x52257934A41c55F4758b92F4D23b69f920c3652A</p>
        </div>
      </div>
    );
  }

  // Show debug info if audit results have errors
  if (auditResults?.error) {
    return (
      <div className="admin-access-denied">
        <h2>🚨 Contract Loading Failed</h2>
        <p>Failed to load contract addresses. This typically indicates a network issue or invalid configuration.</p>
        <div className="access-info">
          <p><strong>Error Details:</strong></p>
          <code style={{ background: '#fee2e2', padding: '1rem', display: 'block', marginTop: '0.5rem' }}>
            {auditResults.error}
          </code>
          <p style={{ marginTop: '1rem' }}><strong>Troubleshooting:</strong></p>
          <ul style={{ textAlign: 'left', marginTop: '0.5rem' }}>
            <li>Make sure you're connected to <strong>Base Sepolia</strong> (Chain ID 84532)</li>
            <li>Check your internet connection and RPC provider</li>
            <li>Try refreshing the page</li>
            <li>Verify the contract addresses are deployed on the correct network</li>
          </ul>
        </div>
      </div>
    );
  }

  // System status color
  const getSystemStatusColor = () => {
    if (hasErrors) return '#dc2626'; // Red
    if (pauseStatus?.anyPaused) return '#f59e0b'; // Amber  
    if (isHealthy) return '#10b981'; // Green
    return '#6b7280'; // Gray
  };

  const getSystemStatusText = () => {
    if (hasErrors) return 'SYSTEM ERROR';
    if (pauseStatus?.allPaused) return 'EMERGENCY PAUSE';
    if (pauseStatus?.anyPaused) return 'PARTIAL PAUSE'; 
    if (isHealthy) return 'OPERATIONAL';
    return 'UNKNOWN';
  };

  // Confirmation modal for emergency actions (controlled, a11y, Esc-to-close)
  const ConfirmModal = ({ action, onConfirm, onCancel, confirmText, setConfirmText }) => (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      onKeyDown={(e) => { if (e.key === 'Escape') onCancel(); }}
      tabIndex={-1}
    >
      <div className="modal-content">
        <h3 id="confirm-title">⚠️ Confirm Emergency Action</h3>
        <div className="modal-body">
          <p><strong>Action:</strong> {action.description}</p>
          <p className="warning-text">{action.warning}</p>
          <div className="confirm-input">
            <p>Type <strong>{action.confirmText}</strong> to confirm:</p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={action.confirmText}
              autoFocus
            />
          </div>
        </div>
        <div className="modal-actions">
          <button onClick={onCancel} className="btn-secondary">Cancel</button>
          <button
            onClick={() => {
              if (confirmText === action.confirmText) {
                onConfirm();
              } else {
                alert('Confirmation text does not match!');
              }
            }}
            className="btn-danger"
          >
            Execute Action
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <h1>🎛️ ROT RITUAL COMMAND CENTER</h1>
        <div className="header-controls">
          <div className="system-status" style={{ backgroundColor: getSystemStatusColor() }}>
            {getSystemStatusText()}
          </div>
          <button 
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`refresh-toggle ${autoRefresh ? 'active' : ''}`}
          >
            {autoRefresh ? '⏸️ Pause' : '▶️ Resume'} Auto-Refresh
          </button>
          <button onClick={runAudit} disabled={isAuditing} className="manual-refresh">
            {isAuditing ? '🔄 Auditing...' : '🔄 Refresh Now'}
          </button>
        </div>
      </div>

      {/* Access Status */}
      <div className="access-banner">
        <span>👤 {address?.slice(0, 8)}...{address?.slice(-6)}</span>
        <span>🔑 {accessStatus.level.toUpperCase()} ACCESS</span>
        <span>{accessStatus.reason}</span>
      </div>

      {/* Emergency Controls - Only show if user has write access */}
      {canWrite && (
        <div className="emergency-controls">
          <div className="emergency-header">
            <h2>🚨 Emergency Controls</h2>
            <p>Use these controls to immediately pause/unpause protocol operations</p>
          </div>
          
          <div className="emergency-grid">
            {/* Global Emergency Pause */}
            <div className="emergency-section critical">
              <h3>🚨 Global Emergency</h3>
              <div className="control-group">
                <button 
                  className="btn-emergency"
                  onClick={() => setShowConfirmModal('globalPause')}
                  disabled={pauseStatus?.allPaused || isActionPending}
                >
                  {pauseStatus?.allPaused ? '🚨 ALREADY PAUSED' : '🚨 PAUSE ALL'}
                </button>
                <button 
                  className="btn-success"
                  onClick={() => setShowConfirmModal('globalUnpause')}
                  disabled={!pauseStatus?.anyPaused || isActionPending}
                >
                  ✅ UNPAUSE ALL
                </button>
              </div>
            </div>

            {/* Sacrifices Control */}
            <div className="emergency-section">
              <h3>⚔️ Sacrifices</h3>
              <div className="control-group">
                <span className={`status-indicator ${pauseStatus?.sacrifices ? 'paused' : 'active'}`}>
                  {pauseStatus?.sacrifices ? '⏸️ PAUSED' : '✅ Active'}
                </span>
                <button 
                  className="btn-warning"
                  onClick={() => setShowConfirmModal('pauseSacrifices')}
                  disabled={pauseStatus?.sacrifices || pauseStatus?.allPaused || isActionPending}
                >
                  ⏸️ Pause
                </button>
                <button 
                  className="btn-success"
                  onClick={() => setShowConfirmModal('unpauseSacrifices')}
                  disabled={!pauseStatus?.sacrifices || pauseStatus?.allPaused || isActionPending}
                >
                  ▶️ Unpause
                </button>
              </div>
            </div>

            {/* Conversions Control */}
            <div className="emergency-section">
              <h3>🔄 Conversions</h3>
              <div className="control-group">
                <span className={`status-indicator ${pauseStatus?.conversions ? 'paused' : 'active'}`}>
                  {pauseStatus?.conversions ? '⏸️ PAUSED' : '✅ Active'}
                </span>
                <button 
                  className="btn-warning"
                  onClick={() => setShowConfirmModal('pauseConversions')}
                  disabled={pauseStatus?.conversions || pauseStatus?.allPaused || isActionPending}
                >
                  ⏸️ Pause
                </button>
                <button 
                  className="btn-success"
                  onClick={() => setShowConfirmModal('unpauseConversions')}
                  disabled={!pauseStatus?.conversions || pauseStatus?.allPaused || isActionPending}
                >
                  ▶️ Unpause
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Dashboard Grid */}
      <div className="dashboard-grid">
        
        {/* System Diagnostics Panel */}
        <SystemDiagnostics />

        {/* User Inspector Panel */}
        <UserInspector />

        {/* Pool R2 Diff Analysis Panel */}
        <PoolR2Diff />

        {/* Reward Modal Previews Panel */}
        <RewardModalPreviews />

        {/* Cosmetic Upload Manager Panel - Only show if user has write access */}
        {canWrite && <CosmeticUploadManager />}
        
        {/* Security Audit Panel */}
        <div className="dashboard-panel security-panel">
          <h3>🔒 Security Status</h3>
          {auditResults ? (
            <div className="audit-results">
              {Object.entries(auditResults.checks).map(([key, check]) => (
                <div key={key} className={`audit-check ${check.status}`}>
                  <span className="check-icon">
                    {check.status === 'passed' ? '✅' : 
                     check.status === 'operational' ? '✅' : 
                     check.status === 'info' ? 'ℹ️' :
                     check.status === 'paused' ? '⚠️' : '❌'}
                  </span>
                  <span className="check-name">{check.name}</span>
                  <span className="check-status">{check.status}</span>
                  {check.fixCommand && (
                    <details className="fix-command">
                      <summary>Show Fix</summary>
                      <code>{check.fixCommand}</code>
                    </details>
                  )}
                </div>
              ))}
              <div className="audit-timestamp">
                Last audit: {auditResults.timestamp.toLocaleTimeString()}
              </div>
            </div>
          ) : (
            <div className="loading">Running security audit...</div>
          )}
        </div>

        {/* Live Metrics Panel */}
        <div className="dashboard-panel metrics-panel">
          <h3>📊 Live Metrics</h3>
          <div className="metrics-grid">
            <div className="metric">
              <span className="metric-label">💎 Keys Sold Today</span>
              <span className="metric-value">{metrics.keysSoldToday}</span>
            </div>
            <div className="metric">
              <span className="metric-label">💰 Revenue Today</span>
              <span className="metric-value">{formatRevenue()}</span>
            </div>
            <div className="metric">
              <span className="metric-label">🦝 Active Raccoons</span>
              <span className="metric-value">{metrics.activeRaccoons.toLocaleString()}</span>
            </div>
            <div className="metric">
              <span className="metric-label">⚔️ Sacrifices Today</span>
              <span className="metric-value">{metrics.sacrificesToday}</span>
            </div>
            <div className="metric">
              <span className="metric-label">🌐 RPC Health</span>
              <span className="metric-value">{formatLatency()}</span>
            </div>
            <div className="metric">
              <span className="metric-label">📈 Current Block</span>
              <span className="metric-value">{metrics.rpcHealth.currentBlock.toLocaleString()}</span>
            </div>
            <div className="metric">
              <span className="metric-label">🖼️ R2 Assets</span>
              <span className="metric-value">{getHealthIcon()} {formatPercentage()}</span>
            </div>
            <div className="metric">
              <span className="metric-label">⏰ Last R2 Check</span>
              <span className="metric-value">{formatLastCheck()}</span>
            </div>
          </div>
        </div>

        {/* Recent Activity Panel */}
        <div className="dashboard-panel activity-panel">
          <h3>📈 Recent Activity</h3>
          <div className="activity-feed">
            {metrics.recentTransactions.length > 0 ? (
              metrics.recentTransactions.slice(0, 10).map((tx, index) => (
                <div key={index} className="activity-item">
                  <span className="activity-type">{tx.type}</span>
                  <span className="activity-details">{formatRecentTx(tx)}</span>
                  <a 
                    href={`https://sepolia.basescan.org/tx/${tx.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="activity-link"
                  >
                    🔗
                  </a>
                </div>
              ))
            ) : (
              <div className="no-activity">No recent transactions</div>
            )}
          </div>
        </div>

        {/* Contract Addresses Panel */}
        <div className="dashboard-panel addresses-panel">
          <h3>📍 Contract Addresses</h3>
          {ADDRS[chainId] ? (
            <div className="addresses-list">
              {/* Chain-First Contracts */}
              <div className="address-section">
                <h4>🔥 Chain-First Contracts</h4>
                <div className="address-item">
                  <span className="address-label">Relics (Bootstrap):</span>
                  <code className="address-value">{ADDRS[chainId].Relics}</code>
                </div>
                <div className="address-item">
                  <span className="address-label">MAW Sacrifice:</span>
                  <code className="address-value">{ADDRS[chainId].MawSacrifice}</code>
                  {auditResults?.addresses?.actualMaw && auditResults.addresses.actualMaw !== ADDRS[chainId].MawSacrifice && (
                    <span className="address-note">⚠️ Chain reports: {auditResults.addresses.actualMaw}</span>
                  )}
                </div>
              </div>

              {/* Static Contracts */}
              <div className="address-section">
                <h4>📦 Static Contracts</h4>
                <div className="address-item">
                  <span className="address-label">Cosmetics V2:</span>
                  <code className="address-value">{ADDRS[chainId].Cosmetics}</code>
                </div>
                <div className="address-item">
                  <span className="address-label">KeyShop:</span>
                  <code className="address-value">{ADDRS[chainId].KeyShop}</code>
                </div>
                <div className="address-item">
                  <span className="address-label">Raccoons:</span>
                  <code className="address-value">{ADDRS[chainId].Raccoons}</code>
                </div>
                <div className="address-item">
                  <span className="address-label">Raccoon Renderer:</span>
                  <code className="address-value">{ADDRS[chainId].RaccoonRenderer}</code>
                </div>
                <div className="address-item">
                  <span className="address-label">Ritual Read Aggregator:</span>
                  <code className="address-value">{ADDRS[chainId].RitualReadAggregator}</code>
                </div>
              </div>

              {/* Future Contracts */}
              <div className="address-section">
                <h4>🚧 Future Contracts</h4>
                <div className="address-item">
                  <span className="address-label">Cultists:</span>
                  <code className="address-value">{ADDRS[chainId].Cultists}</code>
                  <span className="address-note">Not deployed yet</span>
                </div>
                <div className="address-item">
                  <span className="address-label">Demons:</span>
                  <code className="address-value">{ADDRS[chainId].Demons}</code>
                  <span className="address-note">Not deployed yet</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="debug-info">
              <p><strong>Debug Info:</strong></p>
              <p>Chain ID: {chainId}</p>
              <p>Is Base Sepolia: {chainId === 84532 ? 'Yes' : 'No'}</p>
              <p>Addresses Available: {ADDRS[chainId] ? 'Yes' : 'No'}</p>
              <p>Audit Results: {auditResults ? 'Available' : 'None'}</p>
              <p>Is Auditing: {isAuditing ? 'Yes' : 'No'}</p>
              {ADDRS[chainId] && (
                <div style={{ marginTop: '10px', fontSize: '12px' }}>
                  <p><strong>Static Addresses:</strong></p>
                  <p>• Relics: {ADDRS[chainId].Relics}</p>
                  <p>• MAW (Expected): {ADDRS[chainId].MawSacrifice}</p>
                  <p>• KeyShop: {ADDRS[chainId].KeyShop}</p>
                </div>
              )}
              <button 
                onClick={runAudit} 
                style={{ marginTop: '10px', padding: '5px 10px', fontSize: '12px' }}
              >
                🔄 Manual Audit Trigger
              </button>
              {!isConnected && <p>❌ Wallet not connected</p>}
              {isConnected && chainId !== 84532 && <p>❌ Wrong network - switch to Base Sepolia</p>}
              {isConnected && chainId === 84532 && !auditResults && <p>⏳ Loading contract data...</p>}
            </div>
          )}
        </div>

        {/* API & R2 Health Monitor Panel */}
        <ApiHealthMonitor />

        {/* Git Repository Status Panel */}
        <GitStatusPanel />

        {/* Key Price Editor Panel - Only show if user has write access */}
        {canWrite && <KeyPriceEditor />}

        {/* Role Manager Panel - Only show if user has write access */}
        {canWrite && <RoleManager />}

        {/* Cosmetic Pool Rotation Panel - Only show if user has write access */}
        {canWrite && <CosmeticPoolRotation />}
        
        {/* Relics Pool Rotation Panel - Only show if user has write access */}
        {canWrite && <RelicsPoolRotation />}

        {/* Audit Log Panel - Only show if user has write access */}
        {canWrite && (
          <div className="dashboard-panel audit-log-panel">
            <h3>📝 Audit Log</h3>
            <div className="audit-log">
              {auditLog.length > 0 ? (
                auditLog.slice(0, 10).map((entry) => (
                  <div key={entry.id} className={`log-entry ${entry.type.toLowerCase()}`}>
                    <span className="log-time">
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </span>
                    <span className="log-type">{entry.type}</span>
                    <span className="log-action">{entry.action}</span>
                    {entry.txHash && (
                      <a 
                        href={`https://sepolia.basescan.org/tx/${entry.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="log-link"
                      >
                        🔗
                      </a>
                    )}
                  </div>
                ))
              ) : (
                <div className="no-logs">No admin actions recorded</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <ConfirmModal
          action={emergencyActions[showConfirmModal]}
          confirmText={confirmText}
          setConfirmText={setConfirmText}
          onConfirm={async () => {
            try {
              await executeEmergencyAction(showConfirmModal, address);
              setShowConfirmModal(null);
              setConfirmText("");
            } catch (error) {
              alert(`Action failed: ${error.message}`);
            }
          }}
          onCancel={() => {
            setShowConfirmModal(null);
            setConfirmText("");
          }}
        />
      )}

      <style jsx>{`
        .admin-dashboard {
          padding: 2rem;
          max-width: 1400px;
          margin: 0 auto;
          font-family: 'Inter', sans-serif;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid #e5e5e5;
        }

        .dashboard-header h1 {
          margin: 0;
          font-size: 2rem;
          font-weight: 700;
        }

        .header-controls {
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .system-status {
          padding: 0.5rem 1rem;
          border-radius: 6px;
          color: white;
          font-weight: 600;
          font-size: 0.9rem;
        }

        .access-banner {
          display: flex;
          gap: 2rem;
          padding: 1rem;
          background: #f8f9fa;
          border-radius: 8px;
          margin-bottom: 2rem;
          font-weight: 500;
        }

        .emergency-controls {
          background: linear-gradient(135deg, #fef2f2, #fee2e2);
          border: 2px solid #dc2626;
          border-radius: 12px;
          padding: 2rem;
          margin-bottom: 2rem;
        }

        .emergency-header h2 {
          margin: 0 0 0.5rem 0;
          color: #dc2626;
        }

        .emergency-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 2rem;
          margin-top: 1.5rem;
        }

        .emergency-section {
          background: white;
          padding: 1.5rem;
          border-radius: 8px;
          border: 1px solid #e5e5e5;
        }

        .emergency-section.critical {
          border-color: #dc2626;
          background: #fef2f2;
        }

        .control-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-top: 1rem;
        }

        .btn-emergency {
          background: #dc2626;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          font-size: 1rem;
        }

        .btn-emergency:hover:not(:disabled) {
          background: #b91c1c;
        }

        .btn-success {
          background: #10b981;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
        }

        .btn-warning {
          background: #f59e0b;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
        }

        .status-indicator {
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .status-indicator.active {
          background: #d1fae5;
          color: #065f46;
        }

        .status-indicator.paused {
          background: #fef3c7;
          color: #92400e;
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 2rem;
        }

        .dashboard-panel {
          background: white;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          padding: 2rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .dashboard-panel h3 {
          margin: 0 0 1.5rem 0;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .audit-check {
          display: grid;
          grid-template-columns: auto 1fr auto auto;
          gap: 1rem;
          padding: 0.75rem;
          border-radius: 6px;
          margin-bottom: 0.5rem;
          align-items: center;
        }

        .audit-check.passed {
          background: #d1fae5;
        }

        .audit-check.failed {
          background: #fee2e2;
        }

        .audit-check.operational {
          background: #d1fae5;
        }

        .audit-check.paused {
          background: #fef3c7;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .metric {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .metric-label {
          font-size: 0.875rem;
          color: #6b7280;
        }

        .metric-value {
          font-size: 1.5rem;
          font-weight: 600;
          color: #111827;
        }

        .activity-feed {
          max-height: 300px;
          overflow-y: auto;
        }

        .activity-item {
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 1rem;
          padding: 0.75rem;
          border-bottom: 1px solid #e5e5e5;
          align-items: center;
        }

        .activity-type {
          font-weight: 600;
          color: #4f46e5;
        }

        .addresses-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .address-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .address-label {
          font-size: 0.875rem;
          font-weight: 500;
          color: #6b7280;
        }

        .address-value {
          font-family: 'Fira Code', monospace;
          background: #f3f4f6;
          padding: 0.5rem;
          border-radius: 4px;
          font-size: 0.8rem;
          word-break: break-all;
        }

        .address-section {
          margin-bottom: 1.5rem;
        }

        .address-section h4 {
          margin: 0 0 0.75rem 0;
          font-size: 0.9rem;
          font-weight: 600;
          color: #4b5563;
          padding-bottom: 0.25rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .address-note {
          font-size: 0.75rem;
          color: #6b7280;
          font-style: italic;
          margin-top: 0.25rem;
          display: block;
        }

        .audit-log {
          max-height: 300px;
          overflow-y: auto;
        }

        .log-entry {
          display: grid;
          grid-template-columns: auto auto 1fr auto;
          gap: 1rem;
          padding: 0.5rem;
          border-radius: 4px;
          margin-bottom: 0.5rem;
          align-items: center;
          font-size: 0.875rem;
        }

        .log-entry.success {
          background: #d1fae5;
        }

        .log-entry.failed {
          background: #fee2e2;
        }

        .log-entry.attempt {
          background: #dbeafe;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          padding: 2rem;
          border-radius: 12px;
          max-width: 500px;
          width: 90%;
        }

        .modal-actions {
          display: flex;
          gap: 1rem;
          justify-content: end;
          margin-top: 2rem;
        }

        .btn-secondary {
          background: #6b7280;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 6px;
          cursor: pointer;
        }

        .btn-danger {
          background: #dc2626;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
        }

        .warning-text {
          color: #dc2626;
          font-weight: 500;
          background: #fee2e2;
          padding: 1rem;
          border-radius: 6px;
          margin: 1rem 0;
        }

        .confirm-input {
          margin: 1rem 0;
        }

        .confirm-input input {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid #e5e5e5;
          border-radius: 6px;
          font-size: 1rem;
          margin-top: 0.5rem;
        }

        button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .refresh-toggle, .manual-refresh {
          background: #4f46e5;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.875rem;
        }

        .refresh-toggle.active {
          background: #10b981;
        }

        .admin-access-denied {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 50vh;
          text-align: center;
          padding: 2rem;
        }

        @media (max-width: 768px) {
          .dashboard-grid {
            grid-template-columns: 1fr;
          }
          
          .emergency-grid {
            grid-template-columns: 1fr;
          }
          
          .header-controls {
            flex-direction: column;
            gap: 0.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default Admin;