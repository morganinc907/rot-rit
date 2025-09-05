import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CosmeticPreview from './CosmeticPreview';

const RARITY_CONFIG = {
  1: { name: "Common", color: "text-gray-400", border: "border-gray-400/50", glow: "" },
  2: { name: "Uncommon", color: "text-green-400", border: "border-green-400/50", glow: "shadow-green-400/20" },
  3: { name: "Rare", color: "text-blue-400", border: "border-blue-400/50", glow: "shadow-blue-400/30" },
  4: { name: "Legendary", color: "text-purple-400", border: "border-purple-400/50", glow: "shadow-purple-400/40" },
  5: { name: "Mythic", color: "text-yellow-300", border: "border-yellow-300/50", glow: "shadow-yellow-300/50" },
};

/**
 * OutfitPreviewCard - AAA-level outfit preview component
 * Provides instant visual previews and smooth interactions for saved outfits
 */
export default function OutfitPreviewCard({
  outfit,
  raccoon,
  onPreview,
  onEquip,
  onSave,
  onDelete,
  isPreviewing,
  canEquip = true,
  size = 'md',
  className = '',
}) {
  const [showActions, setShowActions] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Calculate outfit rarity (highest rarity cosmetic in outfit)
  const outfitRarity = outfit.cosmetics 
    ? Math.max(...Object.values(outfit.cosmetics).filter(Boolean).map(c => c?.rarity || 1))
    : 1;
  
  const rarityConfig = RARITY_CONFIG[outfitRarity] || RARITY_CONFIG[1];

  // Count equipped cosmetics
  const cosmeticCount = outfit.cosmetics 
    ? Object.values(outfit.cosmetics).filter(Boolean).length
    : 0;

  const handleMouseEnter = () => {
    setIsHovered(true);
    onPreview?.(outfit);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    onPreview?.(null);
  };

  const handleClick = () => {
    // Desktop: Click to equip
    // Mobile: First tap previews, second tap equips
    if (isPreviewing) {
      onEquip?.(outfit);
    } else {
      onPreview?.(outfit);
    }
  };

  const sizeConfig = {
    sm: { card: 'w-24 h-32', preview: 'w-16 h-16', text: 'text-xs', padding: 'p-2' },
    md: { card: 'w-32 h-40', preview: 'w-20 h-20', text: 'text-sm', padding: 'p-3' },
    lg: { card: 'w-40 h-48', preview: 'w-24 h-24', text: 'text-base', padding: 'p-4' },
  };

  const currentSize = sizeConfig[size] || sizeConfig.md;

  return (
    <motion.div
      className={`relative ${currentSize.card} ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Main Card */}
      <motion.div
        onClick={handleClick}
        className={`relative w-full h-full ${currentSize.padding} rounded-2xl border-2 cursor-pointer transition-all duration-300 overflow-hidden ${
          isPreviewing
            ? 'border-cyan-400 bg-cyan-400/10 shadow-lg shadow-cyan-400/30'
            : isHovered
              ? `${rarityConfig.border} bg-white/5`
              : 'border-white/20 bg-black/40'
        } ${rarityConfig.glow && isPreviewing ? rarityConfig.glow : ''}`}
        animate={{
          borderColor: isPreviewing ? '#00FFCC' : isHovered ? '#ffffff40' : '#ffffff20',
        }}
      >
        {/* Outfit Preview Thumbnail */}
        <div className="relative w-full flex-1 mb-2 flex items-center justify-center">
          {outfit.thumbnail ? (
            <img
              src={outfit.thumbnail}
              alt={outfit.name}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : raccoon && outfit.cosmetics ? (
            <div className={`${currentSize.preview} mx-auto`}>
              <CosmeticPreview
                raccoon={raccoon}
                cosmetics={outfit.cosmetics}
                size="sm"
                showGlow={false}
                className="w-full h-full"
              />
            </div>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg flex items-center justify-center">
              <span className="text-2xl opacity-50">👗</span>
            </div>
          )}

          {/* Preview Badge */}
          <AnimatePresence>
            {isPreviewing && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: -10 }}
                className="absolute -top-1 -right-1 px-2 py-1 bg-cyan-400 text-black text-xs font-bold rounded-full shadow-lg"
              >
                PREVIEW
              </motion.div>
            )}
          </AnimatePresence>

          {/* Rarity Indicator */}
          {outfitRarity > 2 && (
            <div className={`absolute top-1 left-1 w-3 h-3 rounded-full ${rarityConfig.border} border ${RARITY_CONFIG[outfitRarity].color.replace('text-', 'bg-')}/30`} />
          )}
        </div>

        {/* Outfit Info */}
        <div className="text-center">
          <div className={`${currentSize.text} font-semibold text-white truncate mb-1`}>
            {outfit.name || 'Untitled Outfit'}
          </div>
          <div className="text-xs text-gray-400">
            {cosmeticCount} cosmetic{cosmeticCount !== 1 ? 's' : ''}
          </div>
          {outfitRarity > 2 && (
            <div className={`text-xs ${rarityConfig.color} font-medium`}>
              {rarityConfig.name}
            </div>
          )}
        </div>

        {/* Hover Overlay */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent rounded-2xl flex items-end justify-center pb-2"
            >
              <div className="text-xs text-center">
                <div className="text-cyan-400 font-medium">
                  {isPreviewing ? 'Click to Equip' : 'Hover to Preview'}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Action Menu */}
      <AnimatePresence>
        {showActions && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="absolute top-full left-0 right-0 mt-1 bg-gray-900 border border-gray-600 rounded-lg shadow-xl z-50"
            onClick={(e) => e.stopPropagation()}
          >
            {canEquip && (
              <button
                onClick={() => {
                  onEquip?.(outfit);
                  setShowActions(false);
                }}
                className="w-full px-3 py-2 text-left text-sm text-cyan-400 hover:bg-gray-800 first:rounded-t-lg"
              >
                ⚡ Equip Outfit
              </button>
            )}
            <button
              onClick={() => {
                onSave?.(outfit);
                setShowActions(false);
              }}
              className="w-full px-3 py-2 text-left text-sm text-blue-400 hover:bg-gray-800"
            >
              💾 Update Outfit
            </button>
            <button
              onClick={() => {
                onDelete?.(outfit);
                setShowActions(false);
              }}
              className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-gray-800 last:rounded-b-lg"
            >
              🗑️ Delete Outfit
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Context Menu Trigger (Right Click / Long Press) */}
      <div
        className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
        onClick={(e) => {
          e.stopPropagation();
          setShowActions(!showActions);
        }}
      >
        <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
          <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
        </svg>
      </div>

      {/* Mobile Tap Instructions */}
      {isPreviewing && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -bottom-6 left-0 right-0 text-center"
        >
          <div className="text-xs text-cyan-400 bg-black/60 px-2 py-1 rounded-full backdrop-blur-sm">
            Tap again to equip
          </div>
        </motion.div>
      )}

      {/* Click-away handler for action menu */}
      {showActions && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowActions(false)}
        />
      )}
    </motion.div>
  );
}