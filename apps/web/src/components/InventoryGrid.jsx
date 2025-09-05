import { motion } from 'framer-motion';
import { useState } from 'react';

export default function InventoryGrid({ items, type, onSelect, selected, onHover }) {
  const GRID_SIZE = 48; // 8x6 grid
  
  // Create empty grid
  const grid = Array(GRID_SIZE).fill(null);
  
  // Fill grid with items
  items?.forEach((item, index) => {
    if (index < GRID_SIZE) {
      grid[index] = item;
    }
  });

  const isSelected = (item) => {
    if (!selected || !item) return false;
    if (Array.isArray(selected)) {
      return selected.some(s => s.id === item.id);
    }
    return selected.id === item.id;
  };

  const getRarityClass = (item) => {
    if (!item) return '';
    if (type === 'raccoon') {
      return `tier-${item.tier || 1}`;
    }
    if (type === 'demon') {
      return item.tier === 3 ? 'mythic' : item.tier === 2 ? 'rare' : 'common';
    }
    if (type === 'relic') {
      return item.rarity?.toLowerCase() || 'common';
    }
    return '';
  };

  return (
    <motion.div 
      className="inventory-grid"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {grid.map((item, index) => (
        <motion.div
          key={index}
          className={`inventory-slot ${item ? '' : 'empty'} ${isSelected(item) ? 'selected' : ''} ${getRarityClass(item)}`}
          onClick={() => item && onSelect && onSelect(item)}
          onMouseEnter={() => item && onHover && onHover(item)}
          onMouseLeave={() => onHover && onHover(null)}
          whileHover={item ? { scale: 1.05 } : {}}
          whileTap={item ? { scale: 0.95 } : {}}
        >
          {item && (
            <div className="inventory-item">
              {/* Item Image */}
              <img 
                src={item.image || `/api/placeholder/${type}/${item.id}`} 
                alt={item.name || `${type} #${item.id}`}
                loading="lazy"
              />
              
              {/* State Indicator (Raccoons) */}
              {type === 'raccoon' && item.state && (
                <div className={`state-indicator ${item.state.toLowerCase()}`} />
              )}
              
              {/* Tier/Rarity Badge */}
              <div className={`item-badge ${getRarityClass(item)}`}>
                {type === 'raccoon' && `T${item.tier || 1}`}
                {type === 'demon' && (item.tier === 3 ? 'M' : item.tier === 2 ? 'R' : 'C')}
                {type === 'relic' && item.rarity?.[0]?.toUpperCase()}
              </div>
              
              {/* Quantity (Relics) */}
              {type === 'relic' && item.quantity > 1 && (
                <div className="item-quantity">x{item.quantity}</div>
              )}
              
              {/* Possessed Indicator */}
              {type === 'raccoon' && item.possessed && (
                <div className="possessed-overlay">
                  <span>👹</span>
                </div>
              )}
            </div>
          )}
        </motion.div>
      ))}
    </motion.div>
  );
}