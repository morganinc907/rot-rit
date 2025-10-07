import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './RaccoonSelectorPanel.css';

export default function RaccoonSelectorPanel({
  isOpen,
  onClose,
  raccoons = [],
  selectedRaccoonId,
  onSelect,
  loading = false
}) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="raccoon-selector-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="raccoon-selector-panel"
          initial={{ x: -300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -300, opacity: 0 }}
          transition={{ type: 'spring', damping: 25 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="panel-header">
            <h2>Select Raccoon</h2>
            <button className="close-button" onClick={onClose}>
              ✕
            </button>
          </div>

          {/* Raccoon List */}
          <div className="raccoon-list">
            {loading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading raccoons...</p>
              </div>
            ) : raccoons.length === 0 ? (
              <div className="empty-state">
                <p>No raccoons found</p>
              </div>
            ) : (
              raccoons.map((raccoon) => (
                <motion.div
                  key={raccoon.id}
                  className={`raccoon-card ${selectedRaccoonId === raccoon.id ? 'selected' : ''}`}
                  onClick={() => onSelect(raccoon.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="raccoon-image-container">
                    <img
                      src={raccoon.image || raccoon.imageUrl}
                      alt={`Raccoon #${raccoon.id}`}
                      className="raccoon-image"
                      onError={(e) => {
                        e.target.src = '/placeholder-raccoon.png';
                      }}
                    />
                  </div>
                  <div className="raccoon-info">
                    <div className="raccoon-id">Raccoon #{raccoon.id}</div>
                    {raccoon.name && (
                      <div className="raccoon-name">{raccoon.name}</div>
                    )}
                  </div>
                  {selectedRaccoonId === raccoon.id && (
                    <div className="selected-indicator">✓</div>
                  )}
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
