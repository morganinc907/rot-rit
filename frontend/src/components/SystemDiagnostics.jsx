/**
 * System Diagnostics Component
 * Big "What's wrong?" button with guided fixes
 */
import React, { useState } from 'react';
import { useSystemDiagnostics } from '../hooks/useSystemDiagnostics';

const SystemDiagnostics = () => {
  const {
    isRunning,
    currentCheck,
    results,
    runDiagnostics,
    getOverallStatus,
    DIAGNOSTIC_CHECKS
  } = useSystemDiagnostics();

  const [showDetails, setShowDetails] = useState(false);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'passed': return '✅';
      case 'failed': return '❌';
      case 'error': return '🚨';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      case 'critical': return '🔴';
      case 'healthy': return '🟢';
      default: return '❓';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'passed': 
      case 'healthy': return '#10b981';
      case 'failed': 
      case 'error': 
      case 'critical': return '#dc2626';
      case 'warning': return '#f59e0b';
      case 'info': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const getQuickFixMessage = () => {
    if (!results || !results.summary.firstFailure) {
      return null;
    }

    const failure = results.summary.firstFailure;
    return {
      issue: failure.message,
      fix: failure.fix,
      description: failure.fixDescription
    };
  };

  return (
    <div className="dashboard-panel system-diagnostics">
      <div className="panel-header">
        <h3>🩺 System Diagnostics</h3>
        {results && (
          <div className="diagnostics-summary">
            <span className={`status-badge ${getOverallStatus()}`} style={{ backgroundColor: getStatusColor(getOverallStatus()) }}>
              {getStatusIcon(getOverallStatus())} {getOverallStatus().toUpperCase()}
            </span>
            <span className="summary-text">
              {results.summary.passed}/{results.summary.total} checks passed
            </span>
          </div>
        )}
      </div>

      {/* Big "What's wrong?" Button */}
      <div className="main-diagnostic-button">
        <button
          onClick={runDiagnostics}
          disabled={isRunning}
          className="whats-wrong-button"
        >
          {isRunning ? (
            <>
              🔄 Running diagnostics...
              {currentCheck && (
                <div className="current-check">
                  Checking: {currentCheck}
                </div>
              )}
            </>
          ) : (
            <>
              🩺 What's wrong?
              <div className="button-subtitle">
                Run system diagnostics
              </div>
            </>
          )}
        </button>
      </div>

      {/* Quick Fix Section */}
      {results && getQuickFixMessage() && (
        <div className="quick-fix-section">
          <h4>🚀 Quick Fix</h4>
          <div className="quick-fix-card">
            <div className="issue-description">
              <strong>Issue:</strong> {getQuickFixMessage().issue}
            </div>
            <div className="fix-command">
              <div className="fix-label">
                <strong>Fix:</strong> {getQuickFixMessage().description}
              </div>
              <div className="command-container">
                <code className="command-text">{getQuickFixMessage().fix}</code>
                <button 
                  className="copy-button"
                  onClick={() => copyToClipboard(getQuickFixMessage().fix)}
                  title="Copy command to clipboard"
                >
                  📋 Copy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overall Summary */}
      {results && (
        <div className="results-summary">
          <div className="summary-stats">
            <div className="stat-item passed">
              <span className="stat-number">{results.summary.passed}</span>
              <span className="stat-label">Passed</span>
            </div>
            <div className="stat-item failed">
              <span className="stat-number">{results.summary.failed}</span>
              <span className="stat-label">Failed</span>
            </div>
            <div className="stat-item warnings">
              <span className="stat-number">{results.summary.warnings}</span>
              <span className="stat-label">Warnings</span>
            </div>
            <div className="stat-item errors">
              <span className="stat-number">{results.summary.errors}</span>
              <span className="stat-label">Errors</span>
            </div>
          </div>

          <button
            onClick={() => setShowDetails(!showDetails)}
            className="toggle-details-button"
          >
            {showDetails ? '🔽 Hide Details' : '🔼 Show Details'}
          </button>
        </div>
      )}

      {/* Detailed Results */}
      {results && showDetails && (
        <div className="detailed-results">
          <h4>📋 Detailed Results</h4>
          <div className="checks-list">
            {DIAGNOSTIC_CHECKS.map((check) => {
              const result = results.checks[check.id];
              if (!result) return null;

              return (
                <div key={check.id} className={`check-result ${result.status}`}>
                  <div className="check-header">
                    <div className="check-info">
                      <span className="check-icon">
                        {getStatusIcon(result.status)}
                      </span>
                      <div className="check-details">
                        <div className="check-name">{check.name}</div>
                        <div className="check-description">{check.description}</div>
                      </div>
                    </div>
                    <div className="check-priority">
                      <span className={`priority-badge ${check.priority}`}>
                        {check.priority}
                      </span>
                    </div>
                  </div>

                  <div className="check-message">
                    {result.message}
                  </div>

                  {result.details && (
                    <div className="check-details-text">
                      {result.details}
                    </div>
                  )}

                  {result.fix && (
                    <div className="check-fix">
                      <div className="fix-header">
                        <strong>🔧 {result.fixDescription || 'Fix command'}:</strong>
                      </div>
                      <div className="fix-command-container">
                        <code className="fix-command-text">{result.fix}</code>
                        <button
                          className="copy-fix-button"
                          onClick={() => copyToClipboard(result.fix)}
                          title="Copy fix command to clipboard"
                        >
                          📋
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="check-timestamp">
                    Checked: {result.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Last Run Info */}
      {results && (
        <div className="last-run-info">
          <span>Last diagnostic run: {results.timestamp.toLocaleString()}</span>
        </div>
      )}

      <style jsx>{`
        .system-diagnostics {
          max-width: 800px;
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .diagnostics-summary {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .status-badge {
          padding: 4px 12px;
          border-radius: 16px;
          color: white;
          font-weight: bold;
          font-size: 12px;
        }

        .summary-text {
          font-size: 14px;
          color: #6b7280;
        }

        .main-diagnostic-button {
          display: flex;
          justify-content: center;
          margin: 20px 0;
        }

        .whats-wrong-button {
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          color: white;
          border: none;
          padding: 20px 40px;
          border-radius: 12px;
          font-size: 18px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.2s ease;
          min-height: 80px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        .whats-wrong-button:hover:not(:disabled) {
          background: linear-gradient(135deg, #2563eb, #1e40af);
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
        }

        .whats-wrong-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .button-subtitle {
          font-size: 12px;
          font-weight: normal;
          opacity: 0.9;
        }

        .current-check {
          font-size: 12px;
          font-weight: normal;
          opacity: 0.9;
          margin-top: 4px;
        }

        .quick-fix-section {
          background: #fef3c7;
          border: 1px solid #f59e0b;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }

        .quick-fix-section h4 {
          margin: 0 0 15px 0;
          color: #92400e;
        }

        .quick-fix-card {
          background: white;
          border-radius: 6px;
          padding: 15px;
        }

        .issue-description {
          margin-bottom: 15px;
          padding: 10px;
          background: #fee2e2;
          border-radius: 4px;
          color: #991b1b;
        }

        .fix-command {
          margin-top: 10px;
        }

        .fix-label {
          margin-bottom: 8px;
          color: #059669;
        }

        .command-container, .fix-command-container {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #f3f4f6;
          padding: 8px 12px;
          border-radius: 4px;
          border: 1px solid #d1d5db;
        }

        .command-text, .fix-command-text {
          font-family: 'Fira Code', monospace;
          font-size: 12px;
          flex: 1;
          background: transparent;
          border: none;
          color: #1f2937;
          word-break: break-all;
        }

        .copy-button, .copy-fix-button {
          background: #10b981;
          color: white;
          border: none;
          padding: 4px 8px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 10px;
          white-space: nowrap;
        }

        .copy-button:hover, .copy-fix-button:hover {
          background: #059669;
        }

        .results-summary {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }

        .summary-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 15px;
          margin-bottom: 15px;
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 12px;
          border-radius: 6px;
          background: white;
          border: 1px solid #e5e7eb;
        }

        .stat-number {
          font-size: 24px;
          font-weight: bold;
        }

        .stat-label {
          font-size: 12px;
          text-transform: uppercase;
          font-weight: 500;
          margin-top: 4px;
        }

        .stat-item.passed .stat-number { color: #10b981; }
        .stat-item.failed .stat-number { color: #dc2626; }
        .stat-item.warnings .stat-number { color: #f59e0b; }
        .stat-item.errors .stat-number { color: #dc2626; }

        .toggle-details-button {
          background: #6b7280;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          width: 100%;
        }

        .toggle-details-button:hover {
          background: #4b5563;
        }

        .detailed-results {
          margin-top: 20px;
        }

        .detailed-results h4 {
          margin: 0 0 15px 0;
        }

        .checks-list {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .check-result {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 15px;
          background: white;
        }

        .check-result.passed {
          border-left: 4px solid #10b981;
          background: #f0fdf4;
        }

        .check-result.failed, .check-result.error {
          border-left: 4px solid #dc2626;
          background: #fef2f2;
        }

        .check-result.warning {
          border-left: 4px solid #f59e0b;
          background: #fffbeb;
        }

        .check-result.info {
          border-left: 4px solid #3b82f6;
          background: #eff6ff;
        }

        .check-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 10px;
        }

        .check-info {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          flex: 1;
        }

        .check-icon {
          font-size: 18px;
          margin-top: 2px;
        }

        .check-name {
          font-weight: bold;
          color: #1f2937;
        }

        .check-description {
          font-size: 12px;
          color: #6b7280;
          margin-top: 2px;
        }

        .priority-badge {
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 10px;
          text-transform: uppercase;
          font-weight: bold;
          color: white;
        }

        .priority-badge.critical {
          background: #dc2626;
        }

        .priority-badge.high {
          background: #f59e0b;
        }

        .priority-badge.medium {
          background: #3b82f6;
        }

        .check-message {
          font-size: 14px;
          color: #1f2937;
          margin-bottom: 8px;
        }

        .check-details-text {
          font-size: 12px;
          color: #059669;
          font-family: monospace;
          background: #f0f9ff;
          padding: 6px 10px;
          border-radius: 4px;
          margin-bottom: 8px;
        }

        .check-fix {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 6px;
          padding: 12px;
          margin-top: 10px;
        }

        .fix-header {
          color: #059669;
          margin-bottom: 8px;
          font-size: 14px;
        }

        .check-timestamp {
          font-size: 11px;
          color: #9ca3af;
          margin-top: 8px;
          text-align: right;
        }

        .last-run-info {
          text-align: center;
          color: #6b7280;
          font-size: 12px;
          margin-top: 20px;
          padding-top: 15px;
          border-top: 1px solid #e5e7eb;
        }
      `}</style>
    </div>
  );
};

export default SystemDiagnostics;