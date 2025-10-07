/**
 * Cosmetic Pool Rotation Component
 * Manages monthly cosmetic pool rotations with presets
 */
import React, { useState } from 'react';
import { useCosmeticPoolManager } from '../hooks/useCosmeticPoolManager';
import { useR2Health } from '../hooks/useR2Health';
import { CustomPoolEditor } from './CustomPoolEditor';

const CosmeticPoolRotation = () => {
  const {
    currentPool,
    selectedPreset,
    setSelectedPreset,
    previewPool,
    COSMETIC_PRESETS,
    getPresetData,
    simulateUpdate,
    applyUpdate,
    isSimulating,
    simulationResult,
    isPending,
    txHash,
    formatCosmeticDisplay,
    hasValidSimulation,
    needsSimulation,
    hasCurrentPool,
    totalCosmetics,
    // Custom pool management
    isCustomMode,
    customPool,
    newCosmeticId,
    setNewCosmeticId,
    newCosmeticWeight,
    setNewCosmeticWeight,
    switchToCustomMode,
    switchToPresetMode,
    addCosmeticToPool,
    removeCosmeticFromPool,
    updateCosmeticWeight
  } = useCosmeticPoolManager();

  const { runHealthCheck } = useR2Health();
  const [showConfirm, setShowConfirm] = useState(false);

  const handlePresetChange = (value) => {
    setSelectedPreset(value);
  };

  const handleApplyClick = () => {
    if (hasValidSimulation) {
      setShowConfirm(true);
    }
  };

  const confirmApply = async () => {
    await applyUpdate();
    setShowConfirm(false);
    // Re-check R2 availability after applying
    setTimeout(() => {
      runHealthCheck();
    }, 2000);
  };

  const renderCurrentPoolTable = () => {
    if (!hasCurrentPool) {
      return (
        <div className="empty-pool">
          <span className="empty-icon">📭</span>
          <span>No cosmetic pool configured</span>
        </div>
      );
    }

    const displayData = formatCosmeticDisplay(currentPool);

    return (
      <div className="pool-table">
        <table className="cosmetic-table">
          <thead>
            <tr>
              <th>Cosmetic ID</th>
              <th>Weight</th>
              <th>Drop Rate</th>
            </tr>
          </thead>
          <tbody>
            {displayData.map((cosmetic, index) => (
              <tr key={index}>
                <td className="cosmetic-id">#{cosmetic.id}</td>
                <td className="cosmetic-weight">{cosmetic.weight}</td>
                <td className="cosmetic-probability">{cosmetic.probability}%</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="pool-summary">
          <span>Total: {totalCosmetics} cosmetics, {currentPool.total} weight</span>
        </div>
      </div>
    );
  };

  const renderPreviewTable = () => {
    if (!previewPool) return null;

    const displayData = formatCosmeticDisplay(previewPool);

    return (
      <div className="preview-section">
        <h4>📋 Preview: {previewPool.preset.name}</h4>
        {previewPool.preset.theme && (
          <div className="preset-theme">{previewPool.preset.theme}</div>
        )}
        <div className="preset-description">{previewPool.preset.description}</div>
        
        <div className="pool-table">
          <table className="cosmetic-table">
            <thead>
              <tr>
                <th>Cosmetic ID</th>
                <th>Weight</th>
                <th>Drop Rate</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {displayData.map((cosmetic, index) => {
                const isNew = previewPool.changes.addedIds.includes(cosmetic.id);
                const isModified = previewPool.changes.modifiedWeights.includes(cosmetic.id);
                const status = isNew ? 'New' : isModified ? 'Modified' : 'Unchanged';
                const statusClass = isNew ? 'new' : isModified ? 'modified' : 'unchanged';

                return (
                  <tr key={index} className={statusClass}>
                    <td className="cosmetic-id">#{cosmetic.id}</td>
                    <td className="cosmetic-weight">{cosmetic.weight}</td>
                    <td className="cosmetic-probability">{cosmetic.probability}%</td>
                    <td className={`cosmetic-status ${statusClass}`}>{status}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {previewPool.changes.removedIds.length > 0 && (
            <div className="removed-cosmetics">
              <strong>Removed:</strong> {previewPool.changes.removedIds.map(id => `#${id}`).join(', ')}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderSimulationResults = () => {
    if (!simulationResult) return null;

    if (simulationResult.isNoOp) {
      return (
        <div className="simulation-result no-op">
          <h4>ℹ️ No Changes Needed</h4>
          <p>{simulationResult.message}</p>
        </div>
      );
    }

    if (!simulationResult.isValid) {
      return (
        <div className="simulation-result error">
          <h4>❌ Simulation Failed</h4>
          <p>{simulationResult.error}</p>
        </div>
      );
    }

    return (
      <div className="simulation-result success">
        <h4>✅ Simulation Successful</h4>
        <div className="simulation-details">
          <p><strong>Action:</strong> {simulationResult.message}</p>
          <div className="function-call">
            <strong>Function Call:</strong>
            <code>
              {simulationResult.functionCall.name}([{simulationResult.functionCall.args[0].join(', ')}], [{simulationResult.functionCall.args[1].join(', ')}])
            </code>
          </div>
          <div className="changes-summary">
            <div className="change-stats">
              <span className="stat">
                <span className="stat-label">Added:</span>
                <span className="stat-value">{simulationResult.changes.addedIds.length}</span>
              </span>
              <span className="stat">
                <span className="stat-label">Removed:</span>
                <span className="stat-value">{simulationResult.changes.removedIds.length}</span>
              </span>
              <span className="stat">
                <span className="stat-label">Modified:</span>
                <span className="stat-value">{simulationResult.changes.modifiedWeights.length}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard-panel cosmetic-pool-rotation">
      <h3>🎨 Cosmetic Pool Rotation</h3>
      
      {/* Current Pool Display */}
      <div className="current-pool-section">
        <h4>📊 Current Pool</h4>
        {renderCurrentPoolTable()}
      </div>

      {/* Mode Selection */}
      <div className="mode-selection">
        <div className="mode-toggle">
          <button
            onClick={switchToPresetMode}
            disabled={isPending}
            className={`mode-btn ${!isCustomMode ? 'active' : ''}`}
          >
            📋 Preset Mode
          </button>
          <button
            onClick={switchToCustomMode}
            disabled={isPending}
            className={`mode-btn ${isCustomMode ? 'active' : ''}`}
          >
            ⚙️ Custom Mode
          </button>
        </div>
      </div>

      {/* Preset Selection (only in preset mode) */}
      {!isCustomMode && (
        <div className="preset-selection">
          <label htmlFor="presetSelect" className="input-label">
            Replace with preset:
          </label>
          <select
            id="presetSelect"
            value={selectedPreset}
            onChange={(e) => handlePresetChange(e.target.value)}
            className="preset-dropdown"
            disabled={isPending}
          >
            <option value="">Choose a monthly preset...</option>
            {Object.entries(COSMETIC_PRESETS).map(([key, preset]) => (
              <option key={key} value={key}>
                {preset.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Custom Pool Editor (only in custom mode) */}
      {isCustomMode && (
        <CustomPoolEditor
          customPool={customPool}
          newCosmeticId={newCosmeticId}
          setNewCosmeticId={setNewCosmeticId}
          newCosmeticWeight={newCosmeticWeight}
          setNewCosmeticWeight={setNewCosmeticWeight}
          addCosmeticToPool={addCosmeticToPool}
          removeCosmeticFromPool={removeCosmeticFromPool}
          updateCosmeticWeight={updateCosmeticWeight}
          formatCosmeticDisplay={formatCosmeticDisplay}
        />
      )}

      {/* Preview */}
      {previewPool && renderPreviewTable()}

      {/* Action Buttons */}
      {previewPool && (
        <div className="action-buttons">
          <button
            onClick={simulateUpdate}
            disabled={isSimulating || isPending}
            className="btn-secondary"
          >
            {isSimulating ? '🔍 Simulating...' : '🔮 Simulate'}
          </button>
          
          <button
            onClick={handleApplyClick}
            disabled={!hasValidSimulation || isPending}
            className={`btn-primary ${hasValidSimulation ? 'enabled' : 'disabled'}`}
          >
            {isPending ? '⏳ Applying...' : '✅ Apply Changes'}
          </button>
        </div>
      )}

      {/* Simulation Results */}
      {renderSimulationResults()}

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="confirm-modal-overlay">
          <div className="confirm-modal">
            <h3>🔄 Confirm Pool Rotation</h3>
            <div className="confirm-details">
              <p><strong>Preset:</strong> {simulationResult.preset.name}</p>
              <p><strong>Theme:</strong> {simulationResult.preset.theme}</p>
              <p><strong>Changes:</strong></p>
              <ul>
                <li>Adding {simulationResult.changes.addedIds.length} new cosmetics</li>
                <li>Removing {simulationResult.changes.removedIds.length} old cosmetics</li>
                <li>Modifying {simulationResult.changes.modifiedWeights.length} weights</li>
              </ul>
              <div className="warning">
                ⚠️ This will immediately change what cosmetics users can get from fragment sacrifice
              </div>
            </div>
            <div className="confirm-actions">
              <button onClick={() => setShowConfirm(false)} className="btn-secondary">
                Cancel
              </button>
              <button onClick={confirmApply} className="btn-primary">
                Confirm Rotation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Status */}
      {txHash && (
        <div className="transaction-status">
          <p>✅ Pool rotation transaction submitted!</p>
          <a 
            href={`https://sepolia.basescan.org/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="tx-link"
          >
            View on BaseScan →
          </a>
          <div className="post-update-note">
            💡 R2 availability will be re-checked automatically
          </div>
        </div>
      )}

      <style jsx>{`
        .cosmetic-pool-rotation {
          max-width: 800px;
        }

        .current-pool-section {
          margin-bottom: 2rem;
        }

        .current-pool-section h4 {
          margin: 0 0 1rem 0;
          color: #374151;
        }

        .empty-pool {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 2rem;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          text-align: center;
          color: #6b7280;
          font-style: italic;
        }

        .empty-icon {
          font-size: 1.5rem;
        }

        .pool-table {
          margin-bottom: 1rem;
        }

        .cosmetic-table {
          width: 100%;
          border-collapse: collapse;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          overflow: hidden;
        }

        .cosmetic-table th,
        .cosmetic-table td {
          padding: 0.75rem;
          text-align: left;
          border-bottom: 1px solid #e2e8f0;
        }

        .cosmetic-table th {
          background: #f8fafc;
          font-weight: 600;
          color: #374151;
          font-size: 0.875rem;
        }

        .cosmetic-table td {
          font-size: 0.875rem;
        }

        .cosmetic-id {
          font-family: 'JetBrains Mono', monospace;
          font-weight: 600;
          color: #059669;
        }

        .cosmetic-weight {
          font-family: 'JetBrains Mono', monospace;
          color: #374151;
        }

        .cosmetic-probability {
          font-family: 'JetBrains Mono', monospace;
          font-weight: 600;
          color: #7c2d12;
        }

        .cosmetic-status {
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .cosmetic-status.new {
          color: #059669;
        }

        .cosmetic-status.modified {
          color: #d97706;
        }

        .cosmetic-status.unchanged {
          color: #6b7280;
        }

        .cosmetic-table tr.new {
          background: #ecfdf5;
        }

        .cosmetic-table tr.modified {
          background: #fefce8;
        }

        .pool-summary {
          margin-top: 0.5rem;
          font-size: 0.875rem;
          color: #6b7280;
          font-style: italic;
        }

        .preset-selection {
          margin-bottom: 2rem;
        }

        .input-label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: #374151;
        }

        .preset-dropdown {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 0.95rem;
          background: white;
        }

        .preset-dropdown:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
        }

        .preview-section {
          margin-bottom: 2rem;
          padding: 1rem;
          background: #f0f9ff;
          border: 1px solid #bae6fd;
          border-radius: 8px;
        }

        .preview-section h4 {
          margin: 0 0 0.5rem 0;
          color: #0369a1;
        }

        .preset-theme {
          font-size: 1.1rem;
          font-weight: 600;
          color: #0369a1;
          margin-bottom: 0.5rem;
        }

        .preset-description {
          font-size: 0.875rem;
          color: #374151;
          margin-bottom: 1rem;
          font-style: italic;
        }

        .removed-cosmetics {
          margin-top: 0.75rem;
          padding: 0.5rem;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 4px;
          font-size: 0.875rem;
          color: #991b1b;
        }

        .action-buttons {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .btn-secondary, .btn-primary {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-secondary {
          background: #e5e7eb;
          color: #374151;
        }

        .btn-secondary:hover:not(:disabled) {
          background: #d1d5db;
        }

        .btn-primary.enabled {
          background: #059669;
          color: white;
        }

        .btn-primary.enabled:hover {
          background: #047857;
        }

        .btn-primary.disabled {
          background: #e5e7eb;
          color: #9ca3af;
          cursor: not-allowed;
        }

        .simulation-result {
          margin-bottom: 2rem;
          padding: 1rem;
          border-radius: 8px;
          border: 1px solid;
        }

        .simulation-result.success {
          background: #ecfdf5;
          border-color: #d1fae5;
          color: #065f46;
        }

        .simulation-result.error {
          background: #fef2f2;
          border-color: #fecaca;
          color: #991b1b;
        }

        .simulation-result.no-op {
          background: #f0f9ff;
          border-color: #bae6fd;
          color: #0369a1;
        }

        .simulation-result h4 {
          margin: 0 0 0.75rem 0;
        }

        .function-call {
          margin: 0.75rem 0;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.875rem;
        }

        .function-call code {
          background: rgba(0, 0, 0, 0.1);
          padding: 0.5rem;
          border-radius: 4px;
          display: block;
          word-break: break-all;
        }

        .changes-summary {
          margin-top: 0.75rem;
        }

        .change-stats {
          display: flex;
          gap: 1rem;
        }

        .stat {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0.5rem;
          background: rgba(255, 255, 255, 0.5);
          border-radius: 4px;
          min-width: 80px;
        }

        .stat-label {
          font-size: 0.75rem;
          color: #6b7280;
          margin-bottom: 0.25rem;
        }

        .stat-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: #374151;
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
        }

        .confirm-details p {
          margin: 0.5rem 0;
        }

        .confirm-details ul {
          margin: 0.5rem 0;
          padding-left: 1.5rem;
        }

        .warning {
          margin-top: 1rem;
          padding: 0.75rem;
          background: #fef3c7;
          border: 1px solid #f59e0b;
          border-radius: 6px;
          font-size: 0.875rem;
          color: #92400e;
        }

        .confirm-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
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

        .post-update-note {
          margin-top: 0.75rem;
          font-size: 0.875rem;
          color: #6b7280;
          font-style: italic;
        }
      `}</style>
    </div>
  );
};

export default CosmeticPoolRotation;