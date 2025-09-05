import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SacrificePit({ items, selectedItems, onItemSelect, onSacrifice, disabled }) {
  const [draggedOver, setDraggedOver] = useState(false);

  // Group items by type
  const raccoons = items.filter(item => item.type === 'raccoon');
  const demons = items.filter(item => item.type === 'demon');
  const relics = items.filter(item => item.type === 'relic');

  const isSelected = (item) => {
    return selectedItems.some(selected => 
      selected.id === item.id && selected.type === item.type
    );
  };

  const getItemValue = (item) => {
    // Estimate sacrifice value based on type and rarity
    if (item.type === 'raccoon') {
      return item.tier * 0.005; // 0.005-0.025 ETH based on tier
    }
    if (item.type === 'demon') {
      return item.tier === 3 ? 0.1 : item.tier === 2 ? 0.05 : 0.02;
    }
    if (item.type === 'relic') {
      const values = { common: 0.001, uncommon: 0.005, rare: 0.01, legendary: 0.05 };
      return values[item.rarity] || 0.001;
    }
    return 0;
  };

  const totalValue = selectedItems.reduce((sum, item) => sum + getItemValue(item), 0);

  return (
    <div className="sacrifice-pit-container">
      <div className="sacrifice-header">
        <h2>🔥 SACRIFICE PIT</h2>
        <p>Feed your items to the Maw for ETH refunds</p>
      </div>

      {/* Item Categories */}
      <div className="item-categories">
        {/* Raccoons */}
        <div className="item-category">
          <h3>🦝 Raccoons ({raccoons.length})</h3>
          <div className="items-grid">
            {raccoons.map(item => (
              <motion.div
                key={`raccoon-${item.id}`}
                className={`sacrifice-item ${isSelected(item) ? 'selected' : ''}`}
                onClick={() => onItemSelect(item)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <img src={item.image} alt={`Raccoon #${item.id}`} />
                <div className="item-info">
                  <span className="item-id">#{item.id}</span>
                  <span className={`item-state ${item.state?.toLowerCase()}`}>
                    {item.state}
                  </span>
                  <span className="item-value">~{getItemValue(item).toFixed(3)} ETH</span>
                </div>
                {isSelected(item) && (
                  <div className="selected-overlay">
                    <span>🔥</span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Demons */}
        {demons.length > 0 && (
          <div className="item-category">
            <h3>👹 Demons ({demons.length})</h3>
            <div className="items-grid">
              {demons.map(item => (
                <motion.div
                  key={`demon-${item.id}`}
                  className={`sacrifice-item ${isSelected(item) ? 'selected' : ''}`}
                  onClick={() => onItemSelect(item)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <img src={item.image} alt={`Demon #${item.id}`} />
                  <div className="item-info">
                    <span className="item-id">#{item.id}</span>
                    <span className={`item-tier tier-${item.tier}`}>
                      {item.tier === 3 ? 'Mythic' : item.tier === 2 ? 'Rare' : 'Common'}
                    </span>
                    <span className="item-value">~{getItemValue(item).toFixed(3)} ETH</span>
                  </div>
                  {isSelected(item) && (
                    <div className="selected-overlay">
                      <span>🔥</span>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Relics */}
        {relics.length > 0 && (
          <div className="item-category">
            <h3>💎 Relics ({relics.length})</h3>
            <div className="items-grid">
              {relics.map(item => (
                <motion.div
                  key={`relic-${item.id}`}
                  className={`sacrifice-item relic ${isSelected(item) ? 'selected' : ''}`}
                  onClick={() => onItemSelect(item)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <img src={item.image} alt={item.name} />
                  <div className="item-info">
                    <span className="item-name">{item.name}</span>
                    <span className={`item-rarity ${item.rarity}`}>
                      {item.rarity}
                    </span>
                    {item.quantity > 1 && (
                      <span className="item-quantity">x{item.quantity}</span>
                    )}
                    <span className="item-value">~{getItemValue(item).toFixed(4)} ETH</span>
                  </div>
                  {isSelected(item) && (
                    <div className="selected-overlay">
                      <span>🔥</span>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sacrifice Summary */}
      <div className="sacrifice-summary">
        <div className="summary-stats">
          <div className="stat">
            <span className="stat-label">Selected:</span>
            <span className="stat-value">{selectedItems.length} items</span>
          </div>
          <div className="stat">
            <span className="stat-label">Est. Value:</span>
            <span className="stat-value">{totalValue.toFixed(4)} ETH</span>
          </div>
        </div>

        <motion.button
          className="sacrifice-button"
          onClick={onSacrifice}
          disabled={disabled || selectedItems.length === 0}
          whileHover={!disabled && selectedItems.length > 0 ? { scale: 1.05 } : {}}
          whileTap={!disabled && selectedItems.length > 0 ? { scale: 0.95 } : {}}
        >
          <span className="sacrifice-icon">🔥</span>
          FEED THE MAW
          <span className="sacrifice-icon">🔥</span>
        </motion.button>

        {selectedItems.length > 0 && (
          <div className="sacrifice-warning">
            ⚠️ Items will be permanently burned!
          </div>
        )}
      </div>

      <style jsx>{`
        .sacrifice-pit-container {
          height: 100%;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .sacrifice-header {
          text-align: center;
          margin-bottom: 20px;
          border-bottom: 2px solid #8b0000;
          padding-bottom: 16px;
        }

        .sacrifice-header h2 {
          font-size: 18px;
          color: #ff6b6b;
          margin: 0 0 8px 0;
          text-shadow: 0 0 10px rgba(255, 107, 107, 0.5);
        }

        .sacrifice-header p {
          font-size: 12px;
          color: #8b4513;
          margin: 0;
        }

        .item-categories {
          flex: 1;
          overflow-y: auto;
          padding-right: 8px;
        }

        .item-categories::-webkit-scrollbar {
          width: 6px;
        }

        .item-categories::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.3);
        }

        .item-categories::-webkit-scrollbar-thumb {
          background: #8b0000;
          border-radius: 3px;
        }

        .item-category {
          margin-bottom: 20px;
        }

        .item-category h3 {
          font-size: 14px;
          color: #d4c5db;
          margin: 0 0 12px 0;
          border-left: 3px solid #8b0000;
          padding-left: 8px;
        }

        .items-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .sacrifice-item {
          background: rgba(0, 0, 0, 0.5);
          border: 2px solid #4a1f1f;
          border-radius: 8px;
          padding: 8px;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
          overflow: hidden;
        }

        .sacrifice-item:hover {
          border-color: #8b0000;
          background: rgba(139, 0, 0, 0.1);
        }

        .sacrifice-item.selected {
          border-color: #ff0000;
          background: rgba(255, 0, 0, 0.2);
          box-shadow: 0 0 10px rgba(255, 0, 0, 0.5);
        }

        .sacrifice-item img {
          width: 100%;
          height: 60px;
          object-fit: cover;
          border-radius: 4px;
          margin-bottom: 6px;
        }

        .item-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
          font-size: 10px;
        }

        .item-id, .item-name {
          font-weight: bold;
          color: #fff;
        }

        .item-state {
          font-size: 9px;
          padding: 2px 4px;
          border-radius: 3px;
          text-transform: uppercase;
        }

        .item-state.normal { background: rgba(0, 255, 0, 0.2); color: #00ff00; }
        .item-state.cult { background: rgba(255, 0, 255, 0.2); color: #ff00ff; }
        .item-state.dead { background: rgba(255, 0, 0, 0.2); color: #ff0000; }

        .item-tier {
          font-size: 9px;
          padding: 2px 4px;
          border-radius: 3px;
        }

        .item-tier.tier-1 { background: rgba(128, 128, 128, 0.2); color: #808080; }
        .item-tier.tier-2 { background: rgba(0, 128, 255, 0.2); color: #0080ff; }
        .item-tier.tier-3 { background: rgba(255, 0, 255, 0.2); color: #ff00ff; }

        .item-rarity {
          font-size: 9px;
          padding: 2px 4px;
          border-radius: 3px;
        }

        .item-rarity.common { background: rgba(128, 128, 128, 0.2); color: #808080; }
        .item-rarity.uncommon { background: rgba(0, 255, 0, 0.2); color: #00ff00; }
        .item-rarity.rare { background: rgba(0, 128, 255, 0.2); color: #0080ff; }
        .item-rarity.legendary { background: rgba(255, 140, 0, 0.2); color: #ff8c00; }

        .item-value {
          color: #ffd700;
          font-weight: bold;
        }

        .item-quantity {
          position: absolute;
          top: 4px;
          right: 4px;
          background: rgba(0, 0, 0, 0.8);
          color: #ffd700;
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 9px;
          font-weight: bold;
        }

        .selected-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255, 0, 0, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          animation: sacrifice-glow 1s ease-in-out infinite;
        }

        .sacrifice-summary {
          border-top: 2px solid #8b0000;
          padding-top: 16px;
          margin-top: 20px;
        }

        .summary-stats {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .stat {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .stat-label {
          font-size: 10px;
          color: #8b4513;
          margin-bottom: 2px;
        }

        .stat-value {
          font-size: 12px;
          color: #ffd700;
          font-weight: bold;
        }

        .sacrifice-button {
          width: 100%;
          background: linear-gradient(135deg, #8b0000 0%, #ff0000 100%);
          border: 2px solid #ff0000;
          color: #fff;
          padding: 16px;
          border-radius: 8px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s;
          text-transform: uppercase;
          letter-spacing: 1px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .sacrifice-button:hover:not(:disabled) {
          background: linear-gradient(135deg, #ff0000 0%, #ff6b6b 100%);
          box-shadow: 0 0 20px rgba(255, 0, 0, 0.5);
        }

        .sacrifice-button:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .sacrifice-icon {
          animation: flicker 2s ease-in-out infinite;
        }

        .sacrifice-warning {
          text-align: center;
          color: #ff6b6b;
          font-size: 11px;
          margin-top: 8px;
          background: rgba(255, 0, 0, 0.1);
          padding: 6px;
          border-radius: 4px;
          border: 1px solid rgba(255, 0, 0, 0.3);
        }

        @keyframes sacrifice-glow {
          0%, 100% { background: rgba(255, 0, 0, 0.3); }
          50% { background: rgba(255, 0, 0, 0.6); }
        }

        @keyframes flicker {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}