/**
 * Cosmetic Upload Manager Component
 * Bulk cosmetic management tool for non-devs to upload and verify assets
 */
import React, { useState, useRef } from 'react';
import { usePoolR2Diff } from '../hooks/usePoolR2Diff';

const CosmeticUploadManager = () => {
  const { runPoolR2Analysis } = usePoolR2Diff();
  
  const [uploadList, setUploadList] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [bulkResults, setBulkResults] = useState(null);
  const fileInputRef = useRef(null);

  // Handle file drop
  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  };

  // Handle file input
  const handleFileInput = (e) => {
    const files = Array.from(e.target.files);
    processFiles(files);
  };

  // Process uploaded files
  const processFiles = (files) => {
    const newUploads = files.map(file => {
      // Parse cosmetic ID from filename (cosmetic_123.png)
      const match = file.name.match(/cosmetic[_-](\d+)\.png$/i);
      const cosmeticId = match ? parseInt(match[1]) : null;
      
      return {
        id: Date.now() + Math.random(),
        file,
        filename: file.name,
        cosmeticId,
        size: file.size,
        status: cosmeticId ? 'ready' : 'invalid',
        previewUrl: URL.createObjectURL(file),
        error: cosmeticId ? null : 'Invalid filename format. Use: cosmetic_[ID].png'
      };
    });
    
    setUploadList(prev => [...prev, ...newUploads]);
  };

  // Parse CSV/JSON checklist
  const handleChecklistImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        let checklist = [];
        
        if (file.name.endsWith('.csv')) {
          // Parse CSV
          const lines = event.target.result.split('\n');
          const headers = lines[0].split(',');
          
          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            if (values.length >= 2) {
              checklist.push({
                cosmeticId: parseInt(values[1]),
                filename: values[4]?.replace(/"/g, ''),
                priority: values[0],
                slot: values[3]
              });
            }
          }
        } else if (file.name.endsWith('.json')) {
          // Parse JSON
          checklist = JSON.parse(event.target.result);
        }

        // Create upload templates from checklist
        const templates = checklist.map(item => ({
          id: Date.now() + Math.random(),
          file: null,
          filename: item.filename || `cosmetic_${item.cosmeticId}.png`,
          cosmeticId: item.cosmeticId,
          priority: item.priority,
          slot: item.slot,
          status: 'template',
          previewUrl: null,
          error: null
        }));

        setUploadList(prev => [...prev, ...templates]);
      } catch (error) {
        console.error('Failed to parse checklist:', error);
        alert('Failed to parse checklist file. Please check the format.');
      }
    };
    
    reader.readAsText(file);
  };

  // Mock upload function (in reality this would upload to R2)
  const uploadToR2 = async (upload) => {
    setUploadProgress(prev => ({ ...prev, [upload.id]: 0 }));
    
    // Simulate upload progress
    for (let i = 0; i <= 100; i += 20) {
      setUploadProgress(prev => ({ ...prev, [upload.id]: i }));
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // Simulate success/failure
    const success = Math.random() > 0.1; // 90% success rate
    
    return {
      success,
      url: success ? `https://pub-ae22a1f0428b4cc2b23b9aefcf8e2e22.r2.dev/cosmetics/cosmetic_${upload.cosmeticId}.png` : null,
      error: success ? null : 'Upload failed - network error'
    };
  };

  // Bulk upload all ready files
  const handleBulkUpload = async () => {
    const readyUploads = uploadList.filter(u => u.status === 'ready' && u.file);
    if (readyUploads.length === 0) {
      alert('No files ready for upload');
      return;
    }

    setBulkResults({ inProgress: true, results: [] });
    const results = [];

    for (const upload of readyUploads) {
      try {
        const result = await uploadToR2(upload);
        
        // Update upload status
        setUploadList(prev => prev.map(u => 
          u.id === upload.id 
            ? { ...u, status: result.success ? 'uploaded' : 'failed', error: result.error }
            : u
        ));

        results.push({
          filename: upload.filename,
          cosmeticId: upload.cosmeticId,
          success: result.success,
          url: result.url,
          error: result.error
        });

        setUploadProgress(prev => ({ ...prev, [upload.id]: undefined }));
      } catch (error) {
        results.push({
          filename: upload.filename,
          cosmeticId: upload.cosmeticId,
          success: false,
          error: error.message
        });
      }
    }

    setBulkResults({ inProgress: false, results });
    
    // Re-analyze after upload
    setTimeout(() => {
      runPoolR2Analysis();
    }, 1000);
  };

  // Remove upload from list
  const removeUpload = (id) => {
    setUploadList(prev => prev.filter(u => u.id !== id));
  };

  // Clear all uploads
  const clearAll = () => {
    setUploadList([]);
    setBulkResults(null);
    setUploadProgress({});
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ready': return '✅';
      case 'invalid': return '❌';
      case 'template': return '📋';
      case 'uploaded': return '🎉';
      case 'failed': return '🚨';
      default: return '❓';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ready': return '#10b981';
      case 'invalid': return '#dc2626';
      case 'template': return '#3b82f6';
      case 'uploaded': return '#059669';
      case 'failed': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const readyCount = uploadList.filter(u => u.status === 'ready' && u.file).length;
  const templateCount = uploadList.filter(u => u.status === 'template').length;

  return (
    <div className="dashboard-panel cosmetic-upload-manager">
      <div className="panel-header">
        <h3>📂 Cosmetic Upload Manager</h3>
        <div className="header-subtitle">
          Bulk upload cosmetic assets and verify R2 coverage
        </div>
      </div>

      {/* Upload Zone */}
      <div 
        className={`upload-zone ${dragActive ? 'drag-active' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="upload-icon">📁</div>
        <div className="upload-text">
          <div className="upload-title">Drop cosmetic PNG files here</div>
          <div className="upload-subtitle">
            Or click to browse • Files must be named: cosmetic_[ID].png
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".png"
          style={{ display: 'none' }}
          onChange={handleFileInput}
        />
      </div>

      {/* Import Checklist */}
      <div className="import-section">
        <h4>📋 Import Upload Checklist</h4>
        <div className="import-actions">
          <label className="file-input-label">
            📥 Import CSV Checklist
            <input
              type="file"
              accept=".csv"
              onChange={handleChecklistImport}
              style={{ display: 'none' }}
            />
          </label>
          <label className="file-input-label">
            📥 Import JSON Checklist
            <input
              type="file"
              accept=".json"
              onChange={handleChecklistImport}
              style={{ display: 'none' }}
            />
          </label>
        </div>
        <div className="import-instructions">
          Import missing asset checklists from Pool ↔ R2 Diff analysis or external sources
        </div>
      </div>

      {/* Upload List */}
      {uploadList.length > 0 && (
        <div className="upload-list-section">
          <div className="list-header">
            <h4>📋 Upload Queue ({uploadList.length})</h4>
            <div className="list-actions">
              {readyCount > 0 && (
                <button
                  onClick={handleBulkUpload}
                  disabled={bulkResults?.inProgress}
                  className="btn-primary"
                >
                  {bulkResults?.inProgress ? '🔄 Uploading...' : `🚀 Upload ${readyCount} Files`}
                </button>
              )}
              <button onClick={clearAll} className="btn-secondary">
                🗑️ Clear All
              </button>
            </div>
          </div>

          {templateCount > 0 && (
            <div className="template-notice">
              📋 {templateCount} checklist templates - drag matching PNG files to fulfill
            </div>
          )}

          <div className="upload-grid">
            {uploadList.map(upload => (
              <div key={upload.id} className={`upload-item status-${upload.status}`}>
                <div className="upload-header">
                  <div className="upload-info">
                    <div className="upload-filename">{upload.filename}</div>
                    <div className="upload-details">
                      {upload.cosmeticId ? `ID: ${upload.cosmeticId}` : 'Invalid ID'}
                      {upload.file && ` • ${formatFileSize(upload.file.size)}`}
                      {upload.priority && ` • ${upload.priority} Priority`}
                      {upload.slot && ` • ${upload.slot}`}
                    </div>
                  </div>
                  <div className="upload-status">
                    <span className="status-icon">{getStatusIcon(upload.status)}</span>
                    <button
                      onClick={() => removeUpload(upload.id)}
                      className="remove-button"
                      title="Remove from queue"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {upload.previewUrl && (
                  <div className="upload-preview">
                    <img src={upload.previewUrl} alt="Preview" className="preview-image" />
                  </div>
                )}

                {uploadProgress[upload.id] !== undefined && (
                  <div className="upload-progress">
                    <div 
                      className="progress-bar"
                      style={{ width: `${uploadProgress[upload.id]}%` }}
                    />
                    <div className="progress-text">{uploadProgress[upload.id]}%</div>
                  </div>
                )}

                {upload.error && (
                  <div className="upload-error">
                    {upload.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bulk Results */}
      {bulkResults && !bulkResults.inProgress && (
        <div className="bulk-results">
          <h4>📊 Upload Results</h4>
          <div className="results-summary">
            ✅ {bulkResults.results.filter(r => r.success).length} successful
            ❌ {bulkResults.results.filter(r => !r.success).length} failed
          </div>
          <div className="results-list">
            {bulkResults.results.map((result, index) => (
              <div key={index} className={`result-item ${result.success ? 'success' : 'failed'}`}>
                <div className="result-filename">{result.filename}</div>
                <div className="result-status">
                  {result.success ? '✅ Uploaded' : `❌ ${result.error}`}
                </div>
                {result.url && (
                  <button
                    onClick={() => window.open(result.url, '_blank')}
                    className="result-url"
                  >
                    🔗 View
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        .cosmetic-upload-manager {
          max-width: 1000px;
        }

        .panel-header {
          margin-bottom: 20px;
        }

        .header-subtitle {
          color: #6b7280;
          font-size: 14px;
          margin-top: 4px;
        }

        .upload-zone {
          border: 2px dashed #d1d5db;
          border-radius: 8px;
          padding: 40px 20px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
          margin-bottom: 20px;
        }

        .upload-zone:hover, .upload-zone.drag-active {
          border-color: #3b82f6;
          background: #eff6ff;
        }

        .upload-icon {
          font-size: 48px;
          margin-bottom: 12px;
        }

        .upload-title {
          font-size: 16px;
          font-weight: 600;
          color: #111827;
          margin-bottom: 4px;
        }

        .upload-subtitle {
          font-size: 14px;
          color: #6b7280;
        }

        .import-section {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 20px;
        }

        .import-section h4 {
          margin: 0 0 12px 0;
          color: #374151;
        }

        .import-actions {
          display: flex;
          gap: 12px;
          margin-bottom: 8px;
        }

        .file-input-label {
          background: #3b82f6;
          color: white;
          padding: 8px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
        }

        .file-input-label:hover {
          background: #2563eb;
        }

        .import-instructions {
          font-size: 12px;
          color: #6b7280;
        }

        .upload-list-section {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
        }

        .list-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .list-header h4 {
          margin: 0;
          color: #374151;
        }

        .list-actions {
          display: flex;
          gap: 8px;
        }

        .btn-primary, .btn-secondary {
          padding: 8px 12px;
          border: none;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
        }

        .btn-primary {
          background: #10b981;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #059669;
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

        .template-notice {
          background: #fefce8;
          border: 1px solid #eab308;
          border-radius: 6px;
          padding: 8px 12px;
          font-size: 12px;
          color: #92400e;
          margin-bottom: 12px;
        }

        .upload-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 12px;
        }

        .upload-item {
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 12px;
          background: white;
        }

        .upload-item.status-ready {
          border-color: #10b981;
          background: #f0fdf4;
        }

        .upload-item.status-invalid {
          border-color: #dc2626;
          background: #fef2f2;
        }

        .upload-item.status-template {
          border-color: #3b82f6;
          background: #eff6ff;
        }

        .upload-item.status-uploaded {
          border-color: #059669;
          background: #ecfdf5;
        }

        .upload-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8px;
        }

        .upload-filename {
          font-family: 'Fira Code', monospace;
          font-weight: 600;
          font-size: 12px;
          color: #111827;
        }

        .upload-details {
          font-size: 11px;
          color: #6b7280;
          margin-top: 2px;
        }

        .upload-status {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .status-icon {
          font-size: 16px;
        }

        .remove-button {
          background: none;
          border: none;
          color: #9ca3af;
          cursor: pointer;
          font-size: 12px;
          padding: 2px 4px;
        }

        .remove-button:hover {
          color: #dc2626;
        }

        .upload-preview {
          margin: 8px 0;
        }

        .preview-image {
          max-width: 80px;
          max-height: 80px;
          border-radius: 4px;
          border: 1px solid #e5e7eb;
        }

        .upload-progress {
          position: relative;
          height: 4px;
          background: #f3f4f6;
          border-radius: 2px;
          margin: 8px 0;
        }

        .progress-bar {
          height: 100%;
          background: #10b981;
          border-radius: 2px;
          transition: width 0.2s;
        }

        .progress-text {
          position: absolute;
          top: -20px;
          right: 0;
          font-size: 10px;
          color: #6b7280;
        }

        .upload-error {
          color: #dc2626;
          font-size: 11px;
          background: #fef2f2;
          padding: 4px 8px;
          border-radius: 4px;
          margin-top: 4px;
        }

        .bulk-results {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 8px;
          padding: 16px;
        }

        .bulk-results h4 {
          margin: 0 0 8px 0;
          color: #059669;
        }

        .results-summary {
          font-weight: 600;
          margin-bottom: 12px;
          color: #059669;
        }

        .results-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .result-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 6px 8px;
          border-radius: 4px;
          font-size: 12px;
        }

        .result-item.success {
          background: #dcfce7;
          color: #059669;
        }

        .result-item.failed {
          background: #fef2f2;
          color: #dc2626;
        }

        .result-filename {
          font-family: 'Fira Code', monospace;
          font-weight: 600;
        }

        .result-url {
          background: none;
          border: none;
          color: #3b82f6;
          cursor: pointer;
          font-size: 10px;
          text-decoration: underline;
        }

        @media (max-width: 768px) {
          .list-header {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
          }

          .upload-grid {
            grid-template-columns: 1fr;
          }

          .import-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default CosmeticUploadManager;