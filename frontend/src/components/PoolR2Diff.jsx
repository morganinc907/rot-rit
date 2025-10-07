/**
 * Pool ↔ R2 Diff Component
 * Critical tool to identify missing cosmetic assets that will break user experience
 */
import React, { useState, useEffect } from 'react';
import { usePoolR2Diff } from '../hooks/usePoolR2Diff';

const PoolR2Diff = () => {
  const {
    isAnalyzing,
    diffResults,
    lastAnalyzed,
    loadingPool,
    runPoolR2Analysis,
    getAnalysisSummary,
    generateUploadChecklist,
    exportMissingAssetsCsv,
    getSlotName
  } = usePoolR2Diff();

  const [showDetails, setShowDetails] = useState(false);
  const [showUploadChecklist, setShowUploadChecklist] = useState(false);

  const summary = getAnalysisSummary();
  const uploadChecklist = generateUploadChecklist();

  // Auto-run analysis on mount
  useEffect(() => {
    if (!diffResults && !isAnalyzing && !loadingPool) {
      runPoolR2Analysis();
    }
  }, [loadingPool, diffResults, isAnalyzing, runPoolR2Analysis]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy': return '✅';
      case 'warning': return '⚠️';
      case 'critical': return '🚨';
      case 'error': return '❌';
      default: return '❓';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return '#10b981';
      case 'warning': return '#f59e0b';
      case 'critical': return '#dc2626';
      case 'error': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const downloadCsv = () => {
    const csv = exportMissingAssetsCsv();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `missing-cosmetic-assets-${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const openAssetUrl = (url) => {
    window.open(url, '_blank');
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="dashboard-panel pool-r2-diff">
      <div className="panel-header">
        <h3>🔍 Pool ↔ R2 Asset Coverage</h3>
        <div className="header-subtitle">
          Critical: Identifies missing cosmetic assets that will break user experience
        </div>
      </div>

      {/* Main Status Card */}
      <div className={`status-card ${summary.status}`}>
        <div className="status-header">
          <div className="status-indicator">
            <span className="status-icon">{getStatusIcon(summary.status)}</span>
            <div className="status-info">
              <div className="status-title">
                {summary.status.toUpperCase()} - {summary.healthPercent}% Coverage
              </div>
              <div className="status-message">{summary.message}</div>
            </div>
          </div>
          <div className="status-actions">
            <button
              onClick={runPoolR2Analysis}
              disabled={isAnalyzing || loadingPool}
              className="btn-primary"
            >
              {isAnalyzing ? '🔄 Analyzing...' : '🔍 Re-analyze'}
            </button>
          </div>
        </div>

        {summary.missingAssets > 0 && (
          <div className="missing-summary">
            <div className="missing-count">
              🚨 {summary.missingAssets} missing asset files will cause broken images
            </div>
            <div className="missing-actions">
              <button
                onClick={() => setShowUploadChecklist(!showUploadChecklist)}
                className="btn-warning"
              >
                📋 Upload Checklist ({uploadChecklist?.length || 0})
              </button>
              {uploadChecklist && uploadChecklist.length > 0 && (
                <button
                  onClick={downloadCsv}
                  className="btn-secondary"
                >
                  📥 Download CSV
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Upload Checklist */}
      {showUploadChecklist && uploadChecklist && uploadChecklist.length > 0 && (
        <div className="upload-checklist">
          <h4>📋 Missing Asset Upload Checklist</h4>
          <div className="checklist-instructions">
            These files are missing from R2 and will cause broken images. Upload to R2 with exact filenames:
          </div>
          <div className="checklist-grid">
            {uploadChecklist.map((item, index) => (
              <div key={index} className={`checklist-item priority-${item.priority.toLowerCase()}`}>
                <div className="checklist-header">
                  <div className="checklist-info">
                    <div className="checklist-filename">{item.expectedFileName}</div>
                    <div className="checklist-details">
                      ID {item.cosmeticId} • {item.slot} • Type {item.type}
                    </div>
                  </div>
                  <div className="priority-badge">{item.priority}</div>
                </div>
                <div className="checklist-actions">
                  <button
                    className="open-url-button"
                    onClick={() => openAssetUrl(item.directUrl)}
                    title="Open missing asset URL (will show 404)"
                  >
                    🔗 Open URL
                  </button>
                  <button
                    className="copy-button"
                    onClick={() => copyToClipboard(item.expectedFileName)}
                    title="Copy filename"
                  >
                    📋 Copy
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detailed Results */}
      {diffResults && !diffResults.error && (
        <div className="detailed-results">
          <div className="results-header">
            <h4>📊 Detailed Coverage Analysis</h4>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="toggle-button"
            >
              {showDetails ? '🔽 Hide Details' : '🔼 Show Details'}
            </button>
          </div>

          {showDetails && (
            <div className="results-breakdown">
              {/* Critical Issues */}
              {diffResults.critical.length > 0 && (
                <div className="result-section critical">
                  <h5>🚨 Critical - No Assets Available ({diffResults.critical.length})</h5>
                  <div className="asset-grid">
                    {diffResults.critical.map(coverage => (
                      <div key={coverage.id} className="asset-item critical">
                        <div className="asset-header">
                          <span className="asset-id">Cosmetic {coverage.id}</span>
                          <span className="asset-coverage">0/{coverage.totalCount} assets</span>
                        </div>
                        <div className="asset-probes">
                          {coverage.probes.map(probe => (
                            <div key={probe.type} className="probe-item failed">
                              <span>Type {probe.type}</span>
                              <button
                                className="probe-url"
                                onClick={() => openAssetUrl(probe.url)}
                                title="Open failed URL"
                              >
                                🚨 Missing
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warnings */}
              {diffResults.warnings.length > 0 && (
                <div className="result-section warning">
                  <h5>⚠️ Partial Coverage - Some Assets Missing ({diffResults.warnings.length})</h5>
                  <div className="asset-grid">
                    {diffResults.warnings.map(coverage => (
                      <div key={coverage.id} className="asset-item warning">
                        <div className="asset-header">
                          <span className="asset-id">Cosmetic {coverage.id}</span>
                          <span className="asset-coverage">
                            {coverage.availableCount}/{coverage.totalCount} assets ({coverage.coveragePercent}%)
                          </span>
                        </div>
                        <div className="asset-probes">
                          {coverage.probes.map(probe => (
                            <div key={probe.type} className={`probe-item ${probe.available ? 'passed' : 'failed'}`}>
                              <span>{getSlotName(probe.type)}</span>
                              <button
                                className="probe-url"
                                onClick={() => openAssetUrl(probe.url)}
                                title={probe.available ? 'Open working URL' : 'Open failed URL'}
                              >
                                {probe.available ? '✅ OK' : '❌ Missing'}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Healthy Items */}
              {diffResults.healthy.length > 0 && (
                <div className="result-section healthy">
                  <h5>✅ Fully Available ({diffResults.healthy.length})</h5>
                  <div className="healthy-list">
                    {diffResults.healthy.map(coverage => (
                      <div key={coverage.id} className="healthy-item">
                        <span>Cosmetic {coverage.id}</span>
                        <span className="healthy-badge">
                          {coverage.availableCount}/{coverage.totalCount} ✅
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Last Analyzed */}
      {lastAnalyzed && (
        <div className="analysis-timestamp">
          Last analyzed: {lastAnalyzed.toLocaleString()}
        </div>
      )}

      <style jsx>{`
        .pool-r2-diff {
          max-width: 1200px;
        }

        .panel-header {
          margin-bottom: 20px;
        }

        .header-subtitle {
          color: #dc2626;
          font-size: 14px;
          font-weight: 600;
          margin-top: 4px;
        }

        .status-card {
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
          border-left: 4px solid;
        }

        .status-card.healthy {
          background: #f0fdf4;
          border-color: #10b981;
        }

        .status-card.warning {
          background: #fffbeb;
          border-color: #f59e0b;
        }

        .status-card.critical {
          background: #fef2f2;
          border-color: #dc2626;
        }

        .status-card.error {
          background: #fef2f2;
          border-color: #dc2626;
        }

        .status-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .status-indicator {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .status-icon {
          font-size: 24px;
        }

        .status-title {
          font-weight: bold;
          font-size: 16px;
          color: #111827;
        }

        .status-message {
          font-size: 14px;
          color: #6b7280;
          margin-top: 2px;
        }

        .btn-primary, .btn-warning, .btn-secondary {
          padding: 8px 16px;
          border: none;
          border-radius: 6px;
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

        .btn-warning {
          background: #f59e0b;
          color: white;
        }

        .btn-warning:hover {
          background: #d97706;
        }

        .btn-secondary {
          background: #6b7280;
          color: white;
        }

        .btn-secondary:hover {
          background: #4b5563;
        }

        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .missing-summary {
          border-top: 1px solid #e5e7eb;
          padding-top: 16px;
          margin-top: 16px;
        }

        .missing-count {
          font-weight: 600;
          color: #dc2626;
          margin-bottom: 12px;
        }

        .missing-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .upload-checklist {
          background: #fefce8;
          border: 1px solid #eab308;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
        }

        .upload-checklist h4 {
          margin: 0 0 12px 0;
          color: #92400e;
        }

        .checklist-instructions {
          color: #92400e;
          margin-bottom: 16px;
          font-size: 14px;
        }

        .checklist-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 12px;
        }

        .checklist-item {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 12px;
        }

        .checklist-item.priority-high {
          border-color: #dc2626;
          background: #fef2f2;
        }

        .checklist-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .checklist-filename {
          font-family: 'Fira Code', monospace;
          font-weight: 600;
          color: #111827;
        }

        .checklist-details {
          font-size: 12px;
          color: #6b7280;
        }

        .priority-badge {
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 10px;
          font-weight: bold;
          color: white;
          background: #dc2626;
        }

        .checklist-actions {
          display: flex;
          gap: 6px;
        }

        .open-url-button, .copy-button {
          padding: 4px 8px;
          border: 1px solid #d1d5db;
          background: white;
          border-radius: 4px;
          cursor: pointer;
          font-size: 11px;
        }

        .open-url-button:hover, .copy-button:hover {
          background: #f3f4f6;
        }

        .detailed-results {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
        }

        .results-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .results-header h4 {
          margin: 0;
          color: #374151;
        }

        .toggle-button {
          background: #6b7280;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }

        .toggle-button:hover {
          background: #4b5563;
        }

        .result-section {
          margin-bottom: 24px;
        }

        .result-section h5 {
          margin: 0 0 12px 0;
          padding: 8px 12px;
          border-radius: 4px;
          font-size: 14px;
        }

        .result-section.critical h5 {
          background: #fef2f2;
          color: #dc2626;
        }

        .result-section.warning h5 {
          background: #fffbeb;
          color: #d97706;
        }

        .result-section.healthy h5 {
          background: #f0fdf4;
          color: #059669;
        }

        .asset-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 12px;
        }

        .asset-item {
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 12px;
          background: white;
        }

        .asset-item.critical {
          border-color: #dc2626;
          background: #fef2f2;
        }

        .asset-item.warning {
          border-color: #f59e0b;
          background: #fffbeb;
        }

        .asset-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .asset-id {
          font-weight: 600;
          color: #111827;
        }

        .asset-coverage {
          font-size: 12px;
          color: #6b7280;
        }

        .asset-probes {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }

        .probe-item {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 11px;
        }

        .probe-item.passed {
          background: #f0fdf4;
          color: #059669;
        }

        .probe-item.failed {
          background: #fef2f2;
          color: #dc2626;
        }

        .probe-url {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 10px;
          text-decoration: underline;
        }

        .healthy-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .healthy-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          background: #f0fdf4;
          border-radius: 4px;
          font-size: 12px;
        }

        .healthy-badge {
          color: #059669;
          font-weight: 600;
        }

        .analysis-timestamp {
          text-align: center;
          color: #6b7280;
          font-size: 12px;
          margin-top: 20px;
          padding-top: 12px;
          border-top: 1px solid #e5e7eb;
        }

        @media (max-width: 768px) {
          .status-header, .results-header {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
          }

          .checklist-grid, .asset-grid {
            grid-template-columns: 1fr;
          }

          .missing-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default PoolR2Diff;