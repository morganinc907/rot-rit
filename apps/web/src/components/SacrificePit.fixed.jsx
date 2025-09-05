import { useState } from 'react';
import { motion } from 'framer-motion';
import { formatItemsForSacrifice, validateSacrificeItems, estimateTotalSacrificeValue } from '../utils/itemFormatter';

export default function SacrificePit({ 
  raccoons = [], 
  demons = [], 
  relics = [], 
  selectedItems, 
  setSelectedItems,
  onSacrifice,
  disabled = false 
}) {
  const [hoveredItem, setHoveredItem] = useState(null);

  const isSelected = (item) => {
    return selectedItems.some(selected => 
      selected.type === item.type && selected.id === item.id
    );
  };

  const handleItemClick = (item) => {
    if (isSelected(item)) {
      // Remove item
      setSelectedItems(selectedItems.filter(s => 
        !(s.type === item.type && s.id === item.id)
      ));
    } else {
      // Add item
      const newItem = {
        ...item,
        amount: item.type === 'relic' ? 1 : undefined // Start with 1 for relics
      };
      setSelectedItems([...selectedItems, newItem]);
    }
  };

  const updateRelicAmount = (item, newAmount) => {
    if (newAmount <= 0 || newAmount > item.quantity) return;
    
    setSelectedItems(selectedItems.map(selected => 
      (selected.type === item.type && selected.id === item.id) 
        ? { ...selected, amount: newAmount }
        : selected
    ));
  };

  const handleSacrifice = async () => {
    try {
      validateSacrificeItems(selectedItems);
      const formattedItems = formatItemsForSacrifice(selectedItems);
      await onSacrifice(formattedItems);
    } catch (error) {
      console.error('Sacrifice validation failed:', error);
      // Error handling would be done in parent component
    }
  };

  const totalValue = estimateTotalSacrificeValue(selectedItems);

  return (
    <div className="sacrifice-pit">
      <h3>🔥 Select Items to Sacrifice</h3>
      
      {/* Raccoons */}
      {raccoons.length > 0 && (
        <div className="item-section">
          <h4>🦝 Raccoons ({raccoons.length})</h4>
          <div className="items-grid">
            {raccoons.map(raccoon => (
              <div 
                key={`raccoon-${raccoon.id}`}
                className={`item-card ${isSelected(raccoon) ? 'selected' : ''}`}
                onClick={() => handleItemClick(raccoon)}
                onMouseEnter={() => setHoveredItem(raccoon)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <img src={raccoon.image} alt={`Raccoon #${raccoon.id}`} />
                <div className="item-info">
                  <span>#{raccoon.id}</span>
                  <span className={`state ${raccoon.state?.toLowerCase()}`}>
                    {raccoon.state}
                  </span>
                  <span className="tier">T{raccoon.tier || 1}</span>
                </div>
                {isSelected(raccoon) && <div className="selected-overlay">🔥</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Demons */}
      {demons.length > 0 && (
        <div className="item-section">
          <h4>👹 Demons ({demons.length})</h4>
          <div className="items-grid">
            {demons.map(demon => (
              <div 
                key={`demon-${demon.id}`}
                className={`item-card ${isSelected(demon) ? 'selected' : ''}`}
                onClick={() => handleItemClick(demon)}
                onMouseEnter={() => setHoveredItem(demon)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <img src={demon.image} alt={`Demon #${demon.id}`} />
                <div className="item-info">
                  <span>#{demon.id}</span>
                  <span className={`tier tier-${demon.tier}`}>
                    {demon.tier === 3 ? 'Mythic' : demon.tier === 2 ? 'Rare' : 'Common'}
                  </span>
                </div>
                {isSelected(demon) && <div className="selected-overlay">🔥</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Relics */}
      {relics.length > 0 && (
        <div className="item-section">
          <h4>💎 Relics ({relics.length})</h4>
          <div className="items-grid">
            {relics.map(relic => {
              const selectedRelic = selectedItems.find(s => s.type === 'relic' && s.id === relic.id);
              return (
                <div 
                  key={`relic-${relic.id}`}
                  className={`item-card relic ${isSelected(relic) ? 'selected' : ''}`}
                  onClick={() => handleItemClick(relic)}
                  onMouseEnter={() => setHoveredItem(relic)}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  <img src={relic.image} alt={relic.name} />
                  <div className="item-info">
                    <span className="name">{relic.name}</span>
                    <span className={`rarity ${relic.rarity}`}>{relic.rarity}</span>
                    <span className="owned">Owned: {relic.quantity}</span>
                  </div>
                  
                  {selectedRelic && (
                    <div className="relic-amount-control">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          updateRelicAmount(relic, selectedRelic.amount - 1);
                        }}
                        disabled={selectedRelic.amount <= 1}
                      >
                        -
                      </button>
                      <span>{selectedRelic.amount}</span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          updateRelicAmount(relic, selectedRelic.amount + 1);
                        }}
                        disabled={selectedRelic.amount >= relic.quantity}
                      >
                        +
                      </button>
                    </div>
                  )}
                  
                  {isSelected(relic) && <div className="selected-overlay">🔥</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sacrifice Summary */}
      <div className="sacrifice-summary">
        <div className="summary-info">
          <span>Selected: {selectedItems.length} items</span>
          <span>Est. Value: ~{totalValue.toFixed(4)} ETH</span>
        </div>
        
        <button 
          className="sacrifice-btn"
          onClick={handleSacrifice}
          disabled={disabled || selectedItems.length === 0}
        >
          🔥 FEED THE MAW 🔥
        </button>

        {selectedItems.length > 0 && (
          <div className="warning">
            ⚠️ Items will be permanently burned!
          </div>
        )}
      </div>

      <style jsx>{`
        .sacrifice-pit {
          background: rgba(26, 11, 11, 0.95);
          border: 2px solid #8b0000;
          border-radius: 12px;
          padding: 20px;
          max-height: 600px;
          overflow-y: auto;
        }

        .sacrifice-pit h3 {
          color: #ff6b6b;
          text-align: center;
          margin-bottom: 20px;
        }

        .item-section {
          margin-bottom: 24px;
        }

        .item-section h4 {
          color: #d4c5db;
          margin-bottom: 12px;
          border-left: 3px solid #8b0000;
          padding-left: 8px;
        }

        .items-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 12px;
        }

        .item-card {
          background: rgba(0, 0, 0, 0.6);
          border: 2px solid #4a1f1f;
          border-radius: 8px;
          padding: 8px;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
          text-align: center;
        }

        .item-card:hover {
          border-color: #8b0000;
          transform: translateY(-2px);
        }

        .item-card.selected {
          border-color: #ff0000;
          background: rgba(255, 0, 0, 0.2);
          box-shadow: 0 0 15px rgba(255, 0, 0, 0.3);
        }

        .item-card img {
          width: 100%;
          height: 80px;
          object-fit: cover;
          border-radius: 4px;
          margin-bottom: 8px;
        }

        .item-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 12px;
        }

        .item-info .name {
          font-weight: bold;
          color: #fff;
        }

        .state.normal { color: #00ff00; }
        .state.cult { color: #ff00ff; }
        .state.dead { color: #ff0000; }

        .tier { color: #ffd700; font-weight: bold; }
        .rarity.common { color: #808080; }
        .rarity.uncommon { color: #00ff00; }
        .rarity.rare { color: #0080ff; }
        .rarity.legendary { color: #ff8c00; }

        .relic-amount-control {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 8px;
          background: rgba(0, 0, 0, 0.7);
          padding: 4px;
          border-radius: 4px;
        }

        .relic-amount-control button {
          width: 24px;
          height: 24px;
          border: 1px solid #8b0000;
          background: rgba(139, 0, 0, 0.3);
          color: #fff;
          cursor: pointer;
          border-radius: 2px;
        }

        .relic-amount-control button:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .selected-overlay {
          position: absolute;
          top: 4px;
          right: 4px;
          background: rgba(255, 0, 0, 0.9);
          color: #fff;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 14px;
          animation: pulse 1s ease-in-out infinite;
        }

        .sacrifice-summary {
          border-top: 2px solid #8b0000;
          padding-top: 16px;
          margin-top: 20px;
        }

        .summary-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
          color: #ffd700;
          font-size: 14px;
        }

        .sacrifice-btn {
          width: 100%;
          background: linear-gradient(135deg, #8b0000 0%, #ff0000 100%);
          border: 2px solid #ff0000;
          color: #fff;
          padding: 16px;
          border-radius: 8px;
          font-weight: bold;
          cursor: pointer;
          text-transform: uppercase;
          letter-spacing: 1px;
          transition: all 0.3s;
        }

        .sacrifice-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #ff0000 0%, #ff6b6b 100%);
          box-shadow: 0 0 20px rgba(255, 0, 0, 0.5);
        }

        .sacrifice-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .warning {
          text-align: center;
          color: #ff6b6b;
          font-size: 12px;
          margin-top: 8px;
          background: rgba(255, 0, 0, 0.1);
          padding: 8px;
          border-radius: 4px;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}