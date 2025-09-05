import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import useCosmeticsV2 from '../hooks/useCosmeticsV2';

const SLOT_CONFIG = {
  0: { name: "HEAD", icon: "👑", color: "text-blue-400" },
  1: { name: "FACE", icon: "👀", color: "text-green-400" },
  2: { name: "BODY", icon: "👕", color: "text-purple-400" },
  3: { name: "COLOR", icon: "🎨", color: "text-yellow-400" },
  4: { name: "BACKGROUND", icon: "🌟", color: "text-pink-400" },
};

const RARITY_CONFIG = {
  1: { name: "Common", color: "text-gray-400", bg: "bg-gray-400/10", border: "border-gray-400/50", glow: "" },
  2: { name: "Uncommon", color: "text-green-400", bg: "bg-green-400/10", border: "border-green-400/50", glow: "shadow-green-400/20" },
  3: { name: "Rare", color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/50", glow: "shadow-blue-400/30" },
  4: { name: "Legendary", color: "text-purple-400", bg: "bg-purple-400/10", border: "border-purple-400/50", glow: "shadow-purple-400/40" },
  5: { name: "Mythic", color: "text-yellow-300", bg: "bg-yellow-300/10", border: "border-yellow-300/50", glow: "shadow-yellow-300/50" },
};

export default function WardrobeSlot({ 
  raccoonId, 
  slot, 
  equippedCosmetic, 
  onEquipChange, 
  disabled = false 
}) {
  const [wardrobeItems, setWardrobeItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const { 
    equipCosmetic, 
    unequipCosmetic, 
    getWardrobeCosmetics, 
    getCosmeticInfo,
    loading: hookLoading 
  } = useCosmeticsV2();

  const slotConfig = SLOT_CONFIG[slot] || SLOT_CONFIG[0];
  const isLoading = loading || hookLoading;

  // Fetch wardrobe items for this slot
  const fetchWardrobeItems = useCallback(async () => {
    if (!raccoonId || slot === undefined) return;
    
    setLoading(true);
    try {
      const items = await getWardrobeCosmetics(raccoonId, slot);
      const itemsWithInfo = await Promise.all(
        items.map(async (item) => {
          const info = await getCosmeticInfo?.(item.baseTypeId);
          return {
            ...item,
            ...info,
            id: item.baseTypeId,
          };
        })
      );
      setWardrobeItems(itemsWithInfo.filter(item => item.id));
    } catch (error) {
      console.error('Error fetching wardrobe items:', error);
      setWardrobeItems([]);
    } finally {
      setLoading(false);
    }
  }, [raccoonId, slot, getWardrobeCosmetics, getCosmeticInfo]);

  useEffect(() => {
    fetchWardrobeItems();
  }, [fetchWardrobeItems]);

  const handleEquip = useCallback(async (itemIndex) => {
    if (!raccoonId || slot === undefined) return;
    
    try {
      await equipCosmetic(raccoonId, slot, itemIndex);
      await fetchWardrobeItems(); // Refresh wardrobe
      onEquipChange?.(slot, wardrobeItems[itemIndex]);
      setShowDropdown(false);
    } catch (error) {
      console.error('Error equipping cosmetic:', error);
      toast.error('Failed to equip cosmetic');
    }
  }, [raccoonId, slot, equipCosmetic, fetchWardrobeItems, onEquipChange, wardrobeItems]);

  const handleUnequip = useCallback(async () => {
    if (!raccoonId || slot === undefined) return;
    
    try {
      await unequipCosmetic(raccoonId, slot);
      await fetchWardrobeItems(); // Refresh wardrobe
      onEquipChange?.(slot, null);
      setShowDropdown(false);
    } catch (error) {
      console.error('Error unequipping cosmetic:', error);
      toast.error('Failed to unequip cosmetic');
    }
  }, [raccoonId, slot, unequipCosmetic, fetchWardrobeItems, onEquipChange]);

  return (
    <div className="relative">
      {/* Slot Display */}
      <motion.div
        whileHover={{ scale: disabled ? 1 : 1.02 }}
        className={`relative rounded-xl border-2 overflow-hidden transition-all duration-200 ${
          disabled 
            ? 'opacity-50 cursor-not-allowed border-gray-600' 
            : equippedCosmetic 
              ? `${RARITY_CONFIG[equippedCosmetic.rarity]?.border || 'border-gray-400'} cursor-pointer hover:shadow-lg ${RARITY_CONFIG[equippedCosmetic.rarity]?.glow || ''}`
              : 'border-gray-600 cursor-pointer hover:border-gray-500'
        }`}
        onClick={() => !disabled && setShowDropdown(!showDropdown)}
      >
        {/* Slot Header */}
        <div className="p-2 bg-black/40 border-b border-gray-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <span className={slotConfig.color}>{slotConfig.icon}</span>
              <span className="text-xs font-medium">{slotConfig.name}</span>
            </div>
            <div className="flex items-center gap-1">
              {wardrobeItems.length > 0 && (
                <span className="text-xs text-gray-400">
                  {wardrobeItems.length}
                </span>
              )}
              {!disabled && (
                <svg 
                  className={`w-3 h-3 text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </div>
          </div>
        </div>

        {/* Equipped Cosmetic or Empty Slot */}
        <div className="relative aspect-square">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
            </div>
          ) : equippedCosmetic ? (
            <>
              <img
                src={equippedCosmetic.image || equippedCosmetic.imageURI}
                alt={equippedCosmetic.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div className="hidden absolute inset-0 bg-gradient-to-br from-purple-600/20 to-purple-800/20 items-center justify-center">
                <span className="text-3xl">💎</span>
              </div>
              {/* Rarity badge */}
              <div className={`absolute top-1 right-1 px-1 py-0.5 rounded text-xs font-bold ${RARITY_CONFIG[equippedCosmetic.rarity]?.bg || 'bg-gray-600'} ${RARITY_CONFIG[equippedCosmetic.rarity]?.color || 'text-gray-200'}`}>
                {equippedCosmetic.rarity}
              </div>
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-800/20 to-gray-900/20 text-gray-400">
              <span className="text-2xl opacity-50">{slotConfig.icon}</span>
              <span className="text-xs mt-1 opacity-75">Empty</span>
            </div>
          )}
        </div>

        {/* Equipped indicator */}
        {equippedCosmetic && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1">
            <div className="text-xs text-center text-white truncate">
              {equippedCosmetic.name}
            </div>
          </div>
        )}
      </motion.div>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {showDropdown && !disabled && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 z-50 mt-1 bg-gray-900 border border-gray-600 rounded-lg shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-2 bg-black/40 border-b border-gray-600">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Wardrobe</span>
                <button
                  onClick={() => setShowDropdown(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Items List */}
            <div className="max-h-64 overflow-y-auto">
              {/* Unequip Option */}
              {equippedCosmetic && (
                <motion.button
                  whileHover={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                  onClick={handleUnequip}
                  className="w-full p-2 text-left border-b border-gray-700 hover:bg-red-500/10 text-red-400 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span>✖</span>
                    <span>Unequip Current</span>
                  </div>
                </motion.button>
              )}

              {/* Wardrobe Items */}
              {wardrobeItems.length === 0 ? (
                <div className="p-3 text-center text-gray-400 text-sm">
                  No cosmetics bound to this slot
                </div>
              ) : (
                wardrobeItems.map((item, index) => {
                  const rarity = RARITY_CONFIG[item.rarity] || RARITY_CONFIG[1];
                  const isEquipped = equippedCosmetic?.id === item.id;
                  
                  return (
                    <motion.button
                      key={`${item.boundId}-${index}`}
                      whileHover={isEquipped ? {} : { backgroundColor: 'rgba(139, 92, 246, 0.1)' }}
                      onClick={() => !isEquipped && handleEquip(index)}
                      disabled={isEquipped}
                      className={`w-full p-2 text-left border-b border-gray-700 last:border-b-0 transition-colors ${
                        isEquipped 
                          ? 'bg-green-500/10 text-green-400 cursor-default' 
                          : 'hover:bg-purple-500/10 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded bg-gray-800 flex items-center justify-center overflow-hidden">
                          {item.image || item.imageURI ? (
                            <img
                              src={item.image || item.imageURI}
                              alt={item.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <span className="hidden text-sm">💎</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">
                            {item.name || `Cosmetic #${item.id}`}
                          </div>
                          <div className={`text-xs ${rarity.color}`}>
                            {rarity.name}
                          </div>
                        </div>
                        {isEquipped && (
                          <div className="text-green-400">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </motion.button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click outside handler */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
}