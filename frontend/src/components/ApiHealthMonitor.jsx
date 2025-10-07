/**
 * API & R2 Health Monitor Component
 * Displays API health status, renderer version, and R2 asset availability
 */
import React from 'react';
import { useApiHealth } from '../hooks/useApiHealth';

const ApiHealthMonitor = () => {
  const {
    healthData,
    rendererData,
    r2ProbeResults,
    isChecking,
    lastChecked,
    overallStatus,
    runHealthChecks,
    getFailedAssets,
    getSummaryStats,
    API_BASE_URL
  } = useApiHealth();

  const summaryStats = getSummaryStats();
  const failedAssets = getFailedAssets();

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy': return '✅';
      case 'error': return '❌';
      case 'checking': return '🔄';
      default: return '❓';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return '#28a745';
      case 'error': return '#dc3545';
      case 'checking': return '#6c757d';
      default: return '#6c757d';
    }
  };

  const openUrl = (url) => {
    window.open(url, '_blank');
  };

  const formatTime = (date) => {
    if (!date) return 'Never';
    return date.toLocaleTimeString();
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="dashboard-panel api-health-monitor">
      <div className="panel-header">
        <h3>☁️ R2 Storage Health Monitor</h3>
        <div className="header-actions">
          <button
            onClick={runHealthChecks}
            disabled={isChecking}
            className="btn-secondary"
            title="Refresh health checks"
          >
            {isChecking ? '🔄 Checking...' : '🔄 Refresh'}
          </button>
        </div>
      </div>

      {/* Overall Status Summary */}
      <div className="health-summary">
        <div className="overall-status">
          <div className="status-badge" style={{ backgroundColor: getStatusColor(overallStatus) }}>
            {getStatusIcon(overallStatus)} {overallStatus.toUpperCase()}
          </div>
          <div className="last-checked">
            Last checked: {formatTime(lastChecked)}
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-label">R2 Connectivity:</span>
            <span className={`stat-value ${summaryStats.apiHealthy ? 'healthy' : 'error'}`}>
              {summaryStats.apiHealthy ? '✅ OK' : '❌ ERROR'}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Storage Access:</span>
            <span className={`stat-value ${summaryStats.rendererHealthy ? 'healthy' : 'error'}`}>
              {summaryStats.rendererHealthy ? '✅ Direct' : '❌ ERROR'}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Asset Success Rate:</span>
            <span className={`stat-value ${summaryStats.successRate >= 90 ? 'healthy' : 'error'}`}>
              {summaryStats.successRate}% ({summaryStats.totalProbes - summaryStats.failedProbes}/{summaryStats.totalProbes})
            </span>
          </div>
        </div>
      </div>

      {/* R2 Connectivity Details */}
      <div className="health-section">
        <h4>📡 R2 Connectivity</h4>
        <div className="health-details">
          {healthData ? (
            <div className="api-status">
              <div className="endpoint-status">
                <span className="endpoint-name">
                  {getStatusIcon(healthData.status)} Base Connectivity
                </span>
                <span className="status-code">
                  {healthData.statusCode || 'No Response'}
                </span>
                <button 
                  className="url-button"
                  onClick={() => openUrl(healthData.url)}
                  title="Open endpoint in new tab"
                >
                  🔗 Open
                </button>
              </div>
              {healthData.error && (
                <div className="error-message">
                  Error: {healthData.error}
                </div>
              )}
              {healthData.data && (
                <div className="response-data">
                  <details>
                    <summary>Response Data</summary>
                    <pre>{JSON.stringify(healthData.data, null, 2)}</pre>
                  </details>
                </div>
              )}
            </div>
          ) : (
            <div className="loading-message">Loading API health...</div>
          )}
        </div>
      </div>

      {/* Storage Access Status */}
      <div className="health-section">
        <h4>☁️ Storage Access Status</h4>
        <div className="health-details">
          {rendererData ? (
            <div className="renderer-status">
              <div className="endpoint-status">
                <span className="endpoint-name">
                  {getStatusIcon(rendererData.status)} Storage Info
                </span>
                <span className="status-code">
                  {rendererData.statusCode || 'No Response'}
                </span>
                <button 
                  className="url-button"
                  onClick={() => openUrl(rendererData.url)}
                  title="Open health endpoint in new tab"
                >
                  🔗 Open
                </button>
              </div>
              {rendererData.error && (
                <div className="error-message">
                  Error: {rendererData.error}
                </div>
              )}
              {rendererData.data && (
                <div className="renderer-info">
                  <div className="version-info">
                    Status: {rendererData.data.version || 'Unknown'}
                  </div>
                  <div className="renderer-address">
                    Renderer: {rendererData.data.rendererAddress || 'Not configured'}
                  </div>
                  {rendererData.data.features && rendererData.data.features.length > 0 && (
                    <div className="features-info">
                      Features: {rendererData.data.features.join(', ')}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="loading-message">Loading renderer status...</div>
          )}
        </div>
      </div>

      {/* Cosmetic Asset Health */}
      <div className="health-section">
        <h4>🎨 Cosmetic Asset Health</h4>
        <div className="r2-probes">
          {r2ProbeResults.length > 0 ? (
            <>
              <div className="probes-grid">
                {r2ProbeResults.map((result, index) => (
                  <div key={index} className={`probe-result ${result.status}`}>
                    <div className="probe-header">
                      <span className="probe-status">
                        {getStatusIcon(result.status)} {result.asset}
                      </span>
                      <span className="probe-code">
                        {result.statusCode || 'ERR'}
                      </span>
                    </div>
                    
                    <div className="probe-actions">
                      <button 
                        className="url-button"
                        onClick={() => openUrl(result.url)}
                        title="Open asset URL in new tab"
                      >
                        🔗 Open
                      </button>
                      <button
                        className="copy-button"
                        onClick={() => copyToClipboard(result.url)}
                        title="Copy URL to clipboard"
                      >
                        📋 Copy
                      </button>
                    </div>

                    {result.contentType && (
                      <div className="probe-meta">
                        Type: {result.contentType}
                        {result.contentLength && ` (${result.contentLength} bytes)`}
                      </div>
                    )}

                    {result.error && (
                      <div className="error-message">
                        {result.error}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Failed Assets Summary */}
              {failedAssets.length > 0 && (
                <div className="failed-assets">
                  <h5>❌ Failed Assets ({failedAssets.length})</h5>
                  <div className="failed-list">
                    {failedAssets.map((asset, index) => (
                      <div key={index} className="failed-asset">
                        <span className="asset-name">{asset.asset}</span>
                        <button
                          className="url-button error"
                          onClick={() => openUrl(asset.url)}
                          title="Open failed URL in new tab"
                        >
                          🚨 Debug
                        </button>
                        <span className="error-reason">
                          {asset.error || `HTTP ${asset.statusCode}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="loading-message">Loading R2 probes...</div>
          )}
        </div>
      </div>

      {/* Storage Configuration Info */}
      <div className="health-section">
        <h4>🔧 Configuration</h4>
        <div className="config-info">
          <div className="config-item">
            <span className="config-label">R2 Storage URL:</span>
            <span className="config-value">
              {API_BASE_URL}
              <button
                className="copy-button"
                onClick={() => copyToClipboard(API_BASE_URL)}
                title="Copy storage URL to clipboard"
              >
                📋
              </button>
            </span>
          </div>
          <div className="config-item">
            <span className="config-label">Assets Monitored:</span>
            <span className="config-value">{r2ProbeResults.length} cosmetics from current pool</span>
          </div>
          <div className="config-item">
            <span className="config-label">Access Method:</span>
            <span className="config-value">Direct CORS (no proxy)</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .api-health-monitor {
          max-width: 1200px;
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .health-summary {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
        }

        .overall-status {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }

        .status-badge {
          padding: 8px 16px;
          border-radius: 20px;
          color: white;
          font-weight: bold;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
        }

        .stat-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .stat-value.healthy {
          color: #28a745;
          font-weight: bold;
        }

        .stat-value.error {
          color: #dc3545;
          font-weight: bold;
        }

        .health-section {
          background: white;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
        }

        .health-section h4 {
          margin-top: 0;
          margin-bottom: 15px;
          color: #495057;
        }

        .endpoint-status {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 0;
          border-bottom: 1px solid #eee;
        }

        .endpoint-name {
          font-family: monospace;
          font-weight: bold;
        }

        .status-code {
          background: #f8f9fa;
          padding: 4px 8px;
          border-radius: 4px;
          font-family: monospace;
        }

        .probes-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 15px;
        }

        .probe-result {
          border: 1px solid #dee2e6;
          border-radius: 6px;
          padding: 15px;
          background: white;
        }

        .probe-result.error {
          border-color: #dc3545;
          background: #fff5f5;
        }

        .probe-result.available {
          border-color: #28a745;
          background: #f8fff8;
        }

        .probe-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .probe-status {
          font-family: monospace;
          font-size: 14px;
        }

        .probe-code {
          background: #f8f9fa;
          padding: 2px 6px;
          border-radius: 3px;
          font-family: monospace;
          font-size: 12px;
        }

        .probe-actions {
          display: flex;
          gap: 8px;
          margin-bottom: 10px;
        }

        .url-button, .copy-button {
          padding: 4px 8px;
          border: 1px solid #dee2e6;
          background: white;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }

        .url-button:hover, .copy-button:hover {
          background: #f8f9fa;
        }

        .url-button.error {
          border-color: #dc3545;
          color: #dc3545;
        }

        .probe-meta {
          font-size: 12px;
          color: #6c757d;
          font-family: monospace;
        }

        .error-message {
          color: #dc3545;
          font-size: 12px;
          margin-top: 5px;
          padding: 8px;
          background: #fff5f5;
          border-radius: 4px;
        }

        .failed-assets {
          margin-top: 20px;
          padding: 15px;
          background: #fff5f5;
          border: 1px solid #dc3545;
          border-radius: 6px;
        }

        .failed-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .failed-asset {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px;
          background: white;
          border-radius: 4px;
        }

        .asset-name {
          font-family: monospace;
          font-weight: bold;
          flex: 1;
        }

        .error-reason {
          color: #dc3545;
          font-size: 12px;
        }

        .config-info {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .config-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
        }

        .config-label {
          font-weight: bold;
        }

        .config-value {
          font-family: monospace;
          background: #f8f9fa;
          padding: 4px 8px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .loading-message {
          text-align: center;
          color: #6c757d;
          font-style: italic;
          padding: 20px;
        }

        .response-data pre {
          background: #f8f9fa;
          padding: 10px;
          border-radius: 4px;
          font-size: 12px;
          overflow-x: auto;
          max-height: 200px;
        }

        .version-info, .status-info, .renderer-address, .features-info {
          font-family: monospace;
          background: #f8f9fa;
          padding: 4px 8px;
          border-radius: 4px;
          margin-top: 5px;
          font-size: 12px;
        }
      `}</style>
    </div>
  );
};

export default ApiHealthMonitor;