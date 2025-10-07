/**
 * Relics Pool Rotation Component
 * Manages relics reward pool with presets and custom editing
 */
import React, { useState } from 'react';
import { useRelicsPoolManager } from '../hooks/useRelicsPoolManager';
import { CustomRelicsEditor } from './CustomRelicsEditor';

const RelicsPoolRotation = () => {
  const {
    currentPool,
    selectedPreset,
    setSelectedPreset,
    previewPool,
    RELICS_PRESETS,
    getPresetData,
    simulateUpdate,
    applyUpdate,
    isSimulating,
    simulationResult,
    isPending,
    txHash,
    formatRelicDisplay,
    hasValidSimulation,
    needsSimulation,
    hasCurrentPool,
    totalRelics,
    // Custom pool management
    isCustomMode,
    customPool,
    newRelicId,
    setNewRelicId,
    newRelicProbability,
    setNewRelicProbability,
    switchToCustomMode,
    switchToPresetMode,
    addRelicToPool,
    removeRelicFromPool,
    updateRelicProbability,
    getRelicName
  } = useRelicsPoolManager();

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
  };

  const renderCurrentPoolTable = () => {
    if (!hasCurrentPool) {
      return (
        <div className="no-pool-message">
          <p>⚠️ No relics reward pool configured</p>
        </div>
      );
    }

    const displayData = formatRelicDisplay(currentPool);

    return (
      <div className="current-pool-table">
        <table className="relic-table">
          <thead>
            <tr>
              <th>Relic ID</th>
              <th>Probability Weight</th>
              <th>Drop Rate</th>
            </tr>
          </thead>
          <tbody>
            {displayData.map((relic, index) => (
              <tr key={index}>
                <td className="relic-id">
                  <div className="relic-display">
                    <span className="relic-number">#{relic.tokenId}</span>
                    <span className="relic-name">{relic.name}</span>
                  </div>
                </td>
                <td className="relic-probability">{relic.probability}</td>
                <td className="relic-percentage">{relic.percentage}%</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="pool-summary">
          <span>Total: {totalRelics} relics, {currentPool.totalWeight} weight</span>
        </div>
      </div>
    );
  };

  const renderPreviewTable = () => {
    if (!previewPool) return null;

    const displayData = formatRelicDisplay(previewPool);

    return (
      <div className="preview-section">
        <h4>📋 Preview: {previewPool.preset.name}</h4>
        {previewPool.preset.theme && (
          <div className="preset-theme">{previewPool.preset.theme}</div>
        )}
        <div className="preset-description">{previewPool.preset.description}</div>
        
        <div className="pool-table">
          <table className="relic-table">
            <thead>
              <tr>
                <th>Relic ID</th>
                <th>Probability Weight</th>
                <th>Drop Rate</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {displayData.map((relic, index) => {
                const isNew = previewPool.changes.addedIds.includes(relic.tokenId);
                const isModified = previewPool.changes.modifiedProbabilities.includes(relic.tokenId);
                
                return (
                  <tr key={index} className={isNew ? 'new-relic' : isModified ? 'modified-relic' : ''}>
                    <td className="relic-id">
                      <div className="relic-display">
                        <span className="relic-number">#{relic.tokenId}</span>
                        <span className="relic-name">{relic.name}</span>
                      </div>
                    </td>
                    <td className="relic-probability">{relic.probability}</td>
                    <td className="relic-percentage">{relic.percentage}%</td>
                    <td className="relic-status">
                      {isNew ? '✨ NEW' : isModified ? '📝 MODIFIED' : '✅ KEPT'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Show removed relics */}
          {previewPool.changes.removedIds.length > 0 && (
            <div className="removed-relics">
              <h5>🗑️ Relics to be Removed</h5>
              <div className="removed-list">
                {previewPool.changes.removedIds.map((tokenId) => (
                  <span key={tokenId} className="removed-relic">#{tokenId}</span>
                ))}
              </div>
            </div>
          )}
          
          <div className="pool-summary">
            <span>Total: {previewPool.tokenIds.length} relics, {previewPool.totalWeight} weight</span>
          </div>
        </div>
      </div>
    );
  };

  const renderSimulationResults = () => {
    if (!simulationResult) return null;

    if (simulationResult.isNoOp) {
      return (
        <div className="simulation-result no-op">
          <p>ℹ️ {simulationResult.message}</p>
        </div>
      );
    }

    if (!simulationResult.isValid) {
      return (
        <div className="simulation-result error">
          <p>❌ Simulation failed: {simulationResult.error}</p>
        </div>
      );
    }

    return (
      <div className="simulation-result success">
        <div className="simulation-summary">
          <h4>🔍 Simulation Results</h4>
          <p>✅ {simulationResult.message}</p>
          
          <div className="changes-summary">
            <span className="change-item">
              <span className="change-label">➕ New relics:</span>
              <span className="stat-value">{simulationResult.changes.addedIds.length}</span>
            </span>
            <span className="change-item">
              <span className="change-label">➖ Removed relics:</span>
              <span className="stat-value">{simulationResult.changes.removedIds.length}</span>
            </span>
            <span className="change-item">
              <span className="change-label">📝 Modified probabilities:</span>
              <span className="stat-value">{simulationResult.changes.modifiedProbabilities.length}</span>
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard-panel relics-pool-rotation">
      <h3>💎 Relics Pool Rotation</h3>
      
      {/* Current Pool Display */}
      <div className="current-pool-section">
        <h4>📊 Current Reward Pool</h4>
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
            <option value="">Choose a relics preset...</option>
            {Object.entries(RELICS_PRESETS).map(([key, preset]) => (
              <option key={key} value={key}>
                {preset.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Custom Pool Editor (only in custom mode) */}
      {isCustomMode && (
        <CustomRelicsEditor
          customPool={customPool}
          newRelicId={newRelicId}
          setNewRelicId={setNewRelicId}
          newRelicProbability={newRelicProbability}
          setNewRelicProbability={setNewRelicProbability}
          addRelicToPool={addRelicToPool}
          removeRelicFromPool={removeRelicFromPool}
          updateRelicProbability={updateRelicProbability}
          formatRelicDisplay={formatRelicDisplay}
          getRelicName={getRelicName}
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
            {isSimulating ? '🔄 Simulating...' : '🧪 Simulate'}
          </button>
          
          {hasValidSimulation && (
            <button
              onClick={handleApplyClick}
              disabled={isPending}
              className="btn-primary"
            >
              {isPending ? '⏳ Processing...' : '🚀 Apply Changes'}
            </button>
          )}
        </div>
      )}

      {/* Simulation Results */}
      {renderSimulationResults()}

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="confirmation-dialog">
          <div className="dialog-content">
            <h4>🔄 Confirm Relics Pool Update</h4>
            <p>Are you sure you want to update the relics reward pool?</p>
            <p><strong>{simulationResult?.preset?.name}</strong></p>
            <div className="dialog-buttons">
              <button onClick={() => setShowConfirm(false)} className="btn-secondary">
                Cancel
              </button>
              <button onClick={confirmApply} className="btn-primary">
                Confirm Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Hash */}
      {txHash && (
        <div className="transaction-info">
          <p>📋 Transaction: {txHash}</p>
        </div>
      )}
    </div>
  );
};

export default RelicsPoolRotation;