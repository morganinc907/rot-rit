import React, { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import { useAccount, useChainId } from "wagmi";

import useNFTBalances from "../hooks/useNFTBalancesSDK";
import useCultists from "../hooks/useCultists";
import { useMawSacrificeSDKV4 as useMawSacrificeSDK } from "../hooks/useMawSacrificeSDKV4";
import "../styles/MawAnimations.css";

/**
 * MawGameUI
 * - Full-bleed static background image of the Maw
 * - "Game HUD" layout:
 *   - Relics belt across the bottom (keys, fragments, masks, daggers, vials, etc.)
 *   - Cosmetics/boosters rail on the right (masks, vials, contracts, deeds)
 *   - Cultist selector on the left (when summoning demons)
 *   - Top-center offering summary + computed success chance
 *   - Bottom-center "FINAL SACRIFICE" button
 * - Reward modal pops in the center, inventories refresh automatically
 *
 * Drop your static background at /public/images/maw-bg.jpg (or edit BACKGROUND_URL below).
 */

const BACKGROUND_URL = "/images/maw-bg.PNG";

// Item IDs (corrected to match CONTRACT definitions)
const ITEM = {
  KEYS: 0,              // Rusted Caps (ID 0 - what contract actually uses for sacrifice)
  FRAGMENT: 2,          // Lantern Fragment 
  MASK: 3,              // Worm-eaten Mask
  DAGGER: 4,            // Bone Dagger (was wrong - contract says ID 4)
  VIAL: 5,              // Ash Vial
  ASHES: 6,             // Glass Shards
  // IDs 7,8,9 not used by contract
  CONTRACT: 8,          // Binding Contract (not in contract but in inventory)
};

const prettyName = {
  [ITEM.KEYS]: "Rusted Caps", // ID 0 - what you sacrifice
  [ITEM.FRAGMENT]: "Lantern Fragment",
  [ITEM.MASK]: "Worm-eaten Mask",
  [ITEM.DAGGER]: "Bone Dagger",
  [ITEM.VIAL]: "Ash Vial",
  [ITEM.CONTRACT]: "Binding Contract",
  [ITEM.ASHES]: "Glass Shards",
};

const emoji = {
  [ITEM.KEYS]: "🍾",
  [ITEM.FRAGMENT]: "💡",
  [ITEM.MASK]: "😷",
  [ITEM.DAGGER]: "🗡️",
  [ITEM.VIAL]: "🧪",
  [ITEM.CONTRACT]: "📜",
  [ITEM.DEED]: "💀📜",
  [ITEM.ASHES]: "🔷",
};

// Item images - fallback to emoji if image not found
const itemImages = {
  [ITEM.KEYS]: "/images/items/rusted-cap.png",
  [ITEM.FRAGMENT]: "/images/items/lantern-fragment.png", 
  [ITEM.MASK]: "/images/items/worm-eaten-mask.png",
  [ITEM.DAGGER]: "/images/items/bone-dagger.png",
  [ITEM.VIAL]: "/images/items/ash-vial.png",
  [ITEM.CONTRACT]: "/images/items/bindiing-contract.png",
  [ITEM.DEED]: "/images/items/soul-deed.png",
  [ITEM.ASHES]: "/images/items/glass-shards.png",
};

// Success chance helpers (mirror prior logic)
const getCosmeticSuccessChance = (frags) => {
  if (frags === 1) return 35;
  if (frags === 2) return 60;
  if (frags === 3) return 80;
  return 0;
};

const getDemonSuccessChance = (dags) => {
  if (dags === 1) return 10;
  if (dags === 2) return 20;
  if (dags === 3) return 30;
  return 0;
};

// Simple counter control component with RPG styling
function Counter({ value, min = 0, max = 99, onChange, disabled }) {
  const dec = () => onChange(Math.max(min, (value || 0) - 1));
  const inc = () => onChange(Math.min(max, (value || 0) + 1));

  return (
    <div className="flex items-center gap-1 justify-center">
      <button
        onClick={dec}
        disabled={disabled || value <= min}
        className="w-6 h-6 rounded text-xs font-bold transition-all duration-150 disabled:opacity-50"
        style={{
          background: 'linear-gradient(145deg, rgba(139, 69, 19, 0.8), rgba(101, 67, 33, 0.8))',
          border: '1px solid rgba(205, 133, 63, 0.4)',
          color: '#f3e8aa',
          textShadow: '0 1px 2px rgba(0, 0, 0, 0.8)',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        }}
        onMouseEnter={(e) => {
          if (!disabled && value > min) {
            e.target.style.background = 'linear-gradient(145deg, rgba(160, 82, 45, 0.9), rgba(139, 69, 19, 0.9))';
          }
        }}
        onMouseLeave={(e) => {
          e.target.style.background = 'linear-gradient(145deg, rgba(139, 69, 19, 0.8), rgba(101, 67, 33, 0.8))';
        }}
      >
        −
      </button>
      <div 
        className="text-center font-bold"
        style={{
          minWidth: '32px',
          padding: '4px 8px',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          borderRadius: '6px',
          border: '2px solid rgba(243, 232, 170, 0.5)',
          color: '#f3e8aa',
          fontSize: '16px',
          textShadow: '0 1px 2px rgba(0, 0, 0, 0.8)',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
        }}
      >
        {value || 0}
      </div>
      <button
        onClick={inc}
        disabled={disabled || value >= max}
        className="w-6 h-6 rounded text-xs font-bold transition-all duration-150 disabled:opacity-50"
        style={{
          background: 'linear-gradient(145deg, rgba(139, 69, 19, 0.8), rgba(101, 67, 33, 0.8))',
          border: '1px solid rgba(205, 133, 63, 0.4)',
          color: '#f3e8aa',
          textShadow: '0 1px 2px rgba(0, 0, 0, 0.8)',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        }}
        onMouseEnter={(e) => {
          if (!disabled && value < max) {
            e.target.style.background = 'linear-gradient(145deg, rgba(160, 82, 45, 0.9), rgba(139, 69, 19, 0.9))';
          }
        }}
        onMouseLeave={(e) => {
          e.target.style.background = 'linear-gradient(145deg, rgba(139, 69, 19, 0.8), rgba(101, 67, 33, 0.8))';
        }}
      >
        +
      </button>
    </div>
  );
}

function RailCard({
  title,
  subtitle,
  icon,
  itemId,
  owned = 0,
  value = 0,
  onChange,
  disabled,
  highlight = false,
}) {
  const [imageError, setImageError] = useState(false);
  const imageSrc = itemImages[itemId];
  const shouldShowImage = imageSrc && !imageError;

  return (
    <div
      className={`rounded-xl p-4 border backdrop-blur-md flex flex-col justify-between transition-all duration-200 ${
        highlight 
          ? "bg-gradient-to-br from-purple-900/90 to-blue-900/90 border-purple-400/60 shadow-lg shadow-purple-500/25" 
          : "bg-black/90 border-amber-600/50 hover:border-amber-500/70"
      }`}
      style={{
        width: '240px',
        height: '280px',
        backgroundImage: highlight ? 'none' : 'linear-gradient(145deg, rgba(139, 69, 19, 0.1), rgba(101, 67, 33, 0.1))',
        boxShadow: highlight 
          ? '0 0 20px rgba(147, 51, 234, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
          : '0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(205, 133, 63, 0.2), inset 0 -1px 0 rgba(101, 67, 33, 0.3)'
      }}
    >
      {/* Item Title */}
      <div className="text-center mb-2">
        <h3 className="text-amber-200 font-bold leading-tight" style={{ fontSize: '14px' }}>{title}</h3>
      </div>

      {/* Item Image Container with Quantity Badge */}
      <div className="relative flex items-center justify-center mb-3" style={{ height: '160px' }}>
        {shouldShowImage ? (
          <div style={{ position: 'relative', width: '160px', height: '160px', display: 'inline-block' }}>
            <img
              src={imageSrc}
              alt={title}
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'contain',
                imageRendering: 'crisp-edges',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
                display: 'block'
              }}
              onError={() => setImageError(true)}
            />
            {/* Quantity Badge */}
            {owned > 0 && (
              <div 
                style={{
                  position: 'absolute',
                  bottom: '4px',
                  right: '4px',
                  backgroundColor: '#000000',
                  color: '#ffffff',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.6)',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  minWidth: '40px',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  zIndex: 10,
                  textAlign: 'center'
                }}
              >
                {owned}
              </div>
            )}
          </div>
        ) : (
          <div style={{ position: 'relative', width: '160px', height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: '140px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}>{icon}</div>
            {/* Quantity Badge for emoji fallback */}
            {owned > 0 && (
              <div 
                style={{
                  position: 'absolute',
                  bottom: '4px',
                  right: '4px',
                  backgroundColor: '#000000',
                  color: '#ffffff',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.6)',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  minWidth: '40px',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  zIndex: 10,
                  textAlign: 'center'
                }}
              >
                {owned}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Counter */}
      <div className="flex justify-center">
        <Counter
          value={value}
          min={0}
          max={owned}
          disabled={disabled}
          onChange={onChange}
        />
      </div>

      {/* Item Description */}
      {subtitle && (
        <div className="text-center mt-2">
          <div className="text-amber-200/70" style={{ fontSize: '11px' }}>{subtitle}</div>
        </div>
      )}
    </div>
  );
}

function ToggleCard({
  title,
  subtitle,
  icon,
  itemId,
  owned = 0,
  checked = false,
  onToggle,
  disabled,
}) {
  const [imageError, setImageError] = useState(false);
  const imageSrc = itemImages[itemId];
  const shouldShowImage = imageSrc && !imageError;

  return (
    <button
      onClick={() => onToggle(!checked)}
      disabled={disabled || owned <= 0}
      className={`text-left rounded-xl p-3 border backdrop-blur-md min-w-[160px] transition-all duration-200
        ${
          checked
            ? "bg-gradient-to-br from-amber-900/90 to-yellow-900/90 border-amber-400/70 ring-2 ring-amber-400/30 shadow-lg shadow-amber-500/25"
            : "bg-black/90 border-amber-600/50 hover:border-amber-500/70"
        }
        disabled:opacity-50`}
      style={{
        backgroundImage: checked ? 'none' : 'linear-gradient(145deg, rgba(139, 69, 19, 0.1), rgba(101, 67, 33, 0.1))',
        boxShadow: checked 
          ? '0 0 20px rgba(220, 38, 38, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
          : '0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(205, 133, 63, 0.2), inset 0 -1px 0 rgba(101, 67, 33, 0.3)'
      }}
    >
      {/* Item Icon/Image */}
      <div className="flex items-center justify-center mb-2" style={{ height: '60px' }}>
        {shouldShowImage ? (
          <img
            src={imageSrc}
            alt={title}
            style={{ 
              width: '56px', 
              height: '56px', 
              objectFit: 'contain',
              imageRendering: 'crisp-edges',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))'
            }}
            onError={() => setImageError(true)}
          />
        ) : (
          <div style={{ fontSize: '48px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}>{icon}</div>
        )}
      </div>
      
      {/* Item Name */}
      <div className="text-center mb-1">
        <div className="font-semibold text-sm text-amber-100">{title}</div>
        {subtitle && (
          <div className="text-xs text-amber-200/70 mb-2">{subtitle}</div>
        )}
      </div>
      
      {/* Status */}
      <div className="text-center">
        <div className="text-xs font-medium">
          <span className="text-amber-300/80">Owned: {owned}</span>
          <span className="mx-2 text-amber-600">•</span>
          <span className={checked ? "text-green-400" : "text-gray-400"}>
            {checked ? "Enabled" : "Disabled"}
          </span>
        </div>
      </div>
    </button>
  );
}


// Helper to get rarity from item type
const getItemRarity = (itemName) => {
  // Map item names to rarities
  const rarityMap = {
    'Rusted Caps': 'common',
    'Glass Shards': 'common',
    'Lantern Fragment': 'uncommon',
    'Worm-eaten Mask': 'rare',
    'Bone Dagger': 'rare',
    'Ash Vial': 'epic',
    'Binding Contract': 'legendary',
    'Soul Deed': 'legendary',
  };
  
  // Check for cosmetic or demon rewards
  if (itemName?.includes('Cosmetic')) return 'epic';
  if (itemName?.includes('Demon')) return 'mythic';
  
  return rarityMap[itemName] || 'common';
};

export default function MawGameUI() {
  const { isConnected } = useAccount();
  const chainId = useChainId();

  const { relics, loading: relicsLoading, refetch: refetchRelics } = useNFTBalances();
  const { cultists, loading: cultistsLoading, refetch: refetchCultists } = useCultists();

  // Reward modal state
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [lastSacrificeResult, setLastSacrificeResult] = useState(null);
  
  // Animation states
  const [isChomping, setIsChomping] = useState(false);
  const [showReward, setShowReward] = useState(false);
  
  // Timeout references to prevent stale animations
  const rewardTimeoutRef = useRef(null);
  const chompEndTimeoutRef = useRef(null);

  // Selection state
  const [selected, setSelected] = useState({
    [ITEM.KEYS]: 0,
    [ITEM.FRAGMENT]: 0,
    [ITEM.MASK]: 0,
    [ITEM.DAGGER]: 0,
    [ITEM.VIAL]: 0,
  });
  const [useBindingContract, setUseBindingContract] = useState(false);
  const [useSoulDeed, setUseSoulDeed] = useState(false);
  const [selectedCultist, setSelectedCultist] = useState(null);

  const handleSacrificeComplete = useCallback(
    (result) => {
      console.log('🎬 handleSacrificeComplete called with:', result);
      console.log('🎬 Current animation state - isChomping:', isChomping, 'showReward:', showReward);
      
      // Only proceed if we don't already have an active animation
      if (isChomping || showReward) {
        console.log('⚠️ Ignoring duplicate sacrifice result - animation already running');
        return;
      }
      
      setLastSacrificeResult(result);
      
      // Start the chomp animation
      setIsChomping(true);
      
      // Show reward right at the "big puke" moment (94% of animation = 3.29s)
      rewardTimeoutRef.current = setTimeout(() => {
        setShowReward(true);
      }, 3290); // 3.29s - right at the big puke
      
      // End chomp animation after full duration
      chompEndTimeoutRef.current = setTimeout(() => {
        setIsChomping(false);
        
        // Auto-hide reward after 5 seconds from when it appears
        setTimeout(() => {
          setShowReward(false);
        }, 5000);
      }, 3500); // 3.5s for full chomp animation
      
      // Refresh inventories after outcome so HUD updates
      refetchRelics();
      refetchCultists();
      // Clear selection for next attempt
      setSelected({
        [ITEM.KEYS]: 0,
        [ITEM.FRAGMENT]: 0,
        [ITEM.MASK]: 0,
        [ITEM.DAGGER]: 0,
        [ITEM.VIAL]: 0,
      });
      setUseBindingContract(false);
      setUseSoulDeed(false);
      setSelectedCultist(null);
    },
    [refetchRelics, refetchCultists, isChomping, showReward]
  );

  const {
    sacrificeKeys,
    sacrificeForCosmetic,
    sacrificeForDemon,
    convertAshes,
    approveContract,
    isApproved,
    refetchApproval,
    isLoading,
    isPending,
    isConfirming,
    isInCooldown,
    getBlocksRemaining,
  } = useMawSacrificeSDK(handleSacrificeComplete);

  const getRelicBalance = useCallback(
    (id) => {
      if (!Array.isArray(relics) || relics.length === 0) return 0;
      const r = relics.find((x) => Number(x.id) === Number(id));
      return r ? Number(r.quantity || 0) : 0;
    },
    [relics]
  );

  // Helper to update selected counts with auto-clearing of conflicting types
  const setCount = useCallback(
    (id, count) => {
      const newCount = Math.max(0, count || 0);
      
      // If count is 0, just update normally (clearing)
      if (newCount === 0) {
        setSelected((prev) => ({ ...prev, [id]: 0 }));
        return;
      }
      
      // Define item type groups that conflict with each other
      const itemTypes = {
        keys: [ITEM.KEYS],
        cosmetic: [ITEM.FRAGMENT, ITEM.MASK], 
        demon: [ITEM.DAGGER, ITEM.VIAL],
        conversion: [ITEM.ASHES]
      };
      
      // Find which type group this item belongs to
      let selectedType = null;
      for (const [typeName, items] of Object.entries(itemTypes)) {
        if (items.includes(id)) {
          selectedType = typeName;
          break;
        }
      }
      
      // If we found the type, clear all other types when setting this one
      if (selectedType) {
        setSelected((prev) => {
          const newState = { ...prev, [id]: newCount };
          
          // Clear all items from other type groups
          Object.entries(itemTypes).forEach(([typeName, items]) => {
            if (typeName !== selectedType) {
              items.forEach(itemId => {
                newState[itemId] = 0;
              });
            }
          });
          
          // Also clear special demon items when switching types
          if (selectedType !== 'demon') {
            // Reset contract/deed toggles when not doing demon sacrifice
            setUseBindingContract(false);
            setUseSoulDeed(false);
          }
          
          return newState;
        });
      } else {
        // Fallback for unknown items
        setSelected((prev) => ({ ...prev, [id]: newCount }));
      }
    },
    [setSelected]
  );

  // Ritual decision + validation
  const ritual = useMemo(() => {
    const keys = selected[ITEM.KEYS] || 0;
    const frags = selected[ITEM.FRAGMENT] || 0;
    const masks = selected[ITEM.MASK] || 0;
    const dags = selected[ITEM.DAGGER] || 0;
    const vials = selected[ITEM.VIAL] || 0;
    const ashes = selected[ITEM.ASHES] || 0;

    const hasDemonIntent =
      !!selectedCultist ||
      useBindingContract ||
      useSoulDeed ||
      dags > 0 ||
      vials > 0;

    let type = null;
    if (hasDemonIntent) type = "demon";
    else if (frags > 0 || masks > 0) type = "cosmetic";
    else if (ashes > 0) type = "ashes";
    else if (keys > 0) type = "keys";

    // Validate based on type
    let valid = false;
    let reason = "";

    if (type === "keys") {
      valid = keys > 0 && keys <= getRelicBalance(ITEM.KEYS);
      if (!valid) reason = keys <= 0 ? "Select at least 1 rusted cap." : "Not enough rusted caps.";
    }

    if (type === "ashes") {
      valid = ashes >= 5 && ashes <= getRelicBalance(ITEM.ASHES) && ashes % 5 === 0;
      if (ashes < 5) reason = "Need at least 5 glass shards.";
      else if (ashes > getRelicBalance(ITEM.ASHES)) reason = "Not enough glass shards.";
      else if (ashes % 5 !== 0) reason = "Must be multiple of 5.";
    }

    if (type === "cosmetic") {
      const total = frags + masks;
      if (frags <= 0) {
        reason = "Need at least 1 fragment.";
      } else if (total > 3) {
        reason = "Max 3 relics total (fragments + masks).";
      } else if (frags > getRelicBalance(ITEM.FRAGMENT)) {
        reason = "Not enough fragments.";
      } else if (masks > getRelicBalance(ITEM.MASK)) {
        reason = "Not enough masks.";
      } else {
        valid = true;
      }
    }

    if (type === "demon") {
      if (!selectedCultist) {
        reason = "Select a cultist.";
      } else if (useSoulDeed && getRelicBalance(ITEM.DEED) <= 0) {
        reason = "No Soul Deed owned.";
      } else if (useBindingContract && getRelicBalance(ITEM.CONTRACT) <= 0) {
        reason = "No Binding Contract owned.";
      } else if (useSoulDeed && useBindingContract) {
        reason = "Choose only one: Deed or Contract.";
      } else if (useSoulDeed || useBindingContract) {
        // Contracts are exclusive; ignore daggers/vials, but warn if user tried to set them
        if (dags > 0 || vials > 0) {
          reason = "Contracts ignore daggers & vials; set them to 0.";
        } else {
          valid = true;
        }
      } else {
        const total = dags + vials;
        if (dags <= 0) {
          reason = "Need at least 1 dagger.";
        } else if (total > 3) {
          reason = "Max 3 relics total (daggers + vials).";
        } else if (dags > getRelicBalance(ITEM.DAGGER)) {
          reason = "Not enough daggers.";
        } else if (vials > getRelicBalance(ITEM.VIAL)) {
          reason = "Not enough vials.";
        } else {
          valid = true;
        }
      }
    }

    // Computed success text
    let success = "";
    if (type === "ashes") {
      const capCount = ashes / 5;
      success = `Convert ${ashes} glass shards → ${capCount} rusted cap${capCount > 1 ? 's' : ''}`;
    }
    if (type === "cosmetic" && frags > 0) {
      success = `${getCosmeticSuccessChance(frags)}% success`;
      if (masks > 0) success += " • masks improve rarity";
    }
    if (type === "demon") {
      if (useSoulDeed) success = "Guaranteed Legendary demon";
      else if (useBindingContract) success = "Guaranteed Rare demon";
      else if (selectedCultist && (dags > 0 || vials > 0)) {
        success = `${getDemonSuccessChance(dags)}% success${
          vials > 0 ? " • vials improve tier" : ""
        }`;
      }
    }

    return { type, valid, reason, success };
  }, [
    selected,
    selectedCultist,
    useBindingContract,
    useSoulDeed,
    getRelicBalance,
  ]);

  // Auto-enforce exclusivity: if a contract/deed is enabled, clear conflicting items
  const onToggleContract = (next) => {
    if (next) {
      // Clear all non-demon items when enabling contract
      setSelected({
        [ITEM.KEYS]: 0,
        [ITEM.FRAGMENT]: 0,
        [ITEM.MASK]: 0,
        [ITEM.DAGGER]: 0,
        [ITEM.VIAL]: 0,
        [ITEM.ASHES]: 0,
      });
      setUseSoulDeed(false);
    }
    setUseBindingContract(next);
  };
  
  const onToggleDeed = (next) => {
    if (next) {
      // Clear all non-demon items when enabling deed
      setSelected({
        [ITEM.KEYS]: 0,
        [ITEM.FRAGMENT]: 0,
        [ITEM.MASK]: 0,
        [ITEM.DAGGER]: 0,
        [ITEM.VIAL]: 0,
        [ITEM.ASHES]: 0,
      });
      setUseBindingContract(false);
    }
    setUseSoulDeed(next);
  };

  // Final sacrifice action
  const onFinalSacrifice = async () => {
    if (!ritual.type || !ritual.valid) {
      if (ritual.reason) toast.error(ritual.reason);
      return;
    }

    // Clear ALL previous results and animations before starting new sacrifice
    console.log('🧹 Clearing all previous animation states and timeouts');
    
    // Clear any pending timeouts to prevent stale animations
    if (rewardTimeoutRef.current) {
      clearTimeout(rewardTimeoutRef.current);
      rewardTimeoutRef.current = null;
    }
    if (chompEndTimeoutRef.current) {
      clearTimeout(chompEndTimeoutRef.current);
      chompEndTimeoutRef.current = null;
    }
    
    setLastSacrificeResult(null);
    setShowResultsModal(false);
    setShowReward(false);
    setIsChomping(false);

    try {
      if (ritual.type === "keys") {
        const qty = selected[ITEM.KEYS] || 0;
        console.log('🔥 Attempting to sacrifice', qty, 'caps');
        const result = await sacrificeKeys(qty);
        console.log('🔥 Sacrifice result:', result);
        if (!result?.success) {
          toast.error(result?.message || "Cap sacrifice failed");
        }
        // on success, callback handles UI reset
      }

      if (ritual.type === "ashes") {
        const shardsToConvert = selected[ITEM.ASHES] || 0;
        console.log('🔥 Converting', shardsToConvert, 'glass shards to rusted caps');
        const result = await convertAshes(shardsToConvert);
        console.log('🔥 Glass Shard conversion result:', result);
        if (!result?.success) {
          toast.error(result?.error || "Glass Shard conversion failed");
        }
        // on success, callback handles UI reset
      }

      if (ritual.type === "cosmetic") {
        const frags = selected[ITEM.FRAGMENT] || 0;
        // Simplified: masks disabled, only use fragments
        console.log('🔥 Attempting cosmetic sacrifice - frags:', frags, '(masks disabled)');
        const result = await sacrificeForCosmetic(frags, 0); // Always pass 0 for masks
        console.log('🔥 Cosmetic result:', result);
        if (!result?.success) {
          toast.error(result?.error || "Cosmetic ritual failed");
        }
      }

      if (ritual.type === "demon") {
        if (!selectedCultist) {
          toast.error("Select a cultist");
          return;
        }
        const daggers = selected[ITEM.DAGGER] || 0;
        // Simplified: vials disabled, only use daggers
        console.log('🔥 Attempting demon sacrifice - daggers:', daggers, '(vials disabled), cultist:', selectedCultist.id);

        const result = await sacrificeForDemon(
          daggers,
          0, // vials disabled - always pass 0
          false, // binding contract disabled
          useSoulDeed, // soul deed enabled based on user selection
          selectedCultist.id
        );
        console.log('🔥 Demon result:', result);

        if (result?.success === undefined) {
          toast.error(result?.message || "Demon ritual failed");
        }
      }
    } catch (e) {
      console.error('🔥 Sacrifice error:', e);
      toast.error("Ritual failed to execute");
    }
    
  };

  // Derived UX helpers
  const hasAnySelection = Object.values(selected).some((x) => x > 0) || useBindingContract || useSoulDeed || !!selectedCultist;

  // Loading / connect gates
  if (!isConnected) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-gray-200">
        <h1 className="text-4xl mb-2">🩸 The Maw</h1>
        <p>Connect your wallet to feed the Maw...</p>
      </div>
    );
  }

  if (relicsLoading || cultistsLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-gray-200">
        <h1 className="text-4xl mb-2">🩸 The Maw</h1>
        <p>Loading your offerings...</p>
      </div>
    );
  }

  // Owned counts
  const owned = {
    [ITEM.KEYS]: getRelicBalance(ITEM.KEYS),
    [ITEM.FRAGMENT]: getRelicBalance(ITEM.FRAGMENT),
    [ITEM.MASK]: getRelicBalance(ITEM.MASK),
    [ITEM.DAGGER]: getRelicBalance(ITEM.DAGGER),
    [ITEM.VIAL]: getRelicBalance(ITEM.VIAL),
    [ITEM.CONTRACT]: getRelicBalance(ITEM.CONTRACT),
    [ITEM.DEED]: getRelicBalance(ITEM.DEED),
    [ITEM.ASHES]: getRelicBalance(ITEM.ASHES),
  };

  return (
    <div 
      className={`min-h-screen text-gray-100 ${isChomping ? 'maw-chomp' : ''}`}
      style={{
        backgroundImage: `url('${BACKGROUND_URL}')`,
        backgroundColor: '#0a0a0a',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        position: 'relative'
      }}
    >
      {/* Chomp flash overlay */}
      {isChomping && <div className="chomp-flash" />}
      
      {/* Subtle overlay to ensure text readability */}
      <div className="absolute inset-0 bg-black/20 pointer-events-none" />
      
      {/* CENTER: Main buttons */}
      <div style={{ 
        position: 'fixed', 
        left: '50%', 
        top: '50%', 
        transform: 'translate(-50%, -50%)',
        zIndex: 15
      }}>
        <div className="flex flex-col gap-4 items-center">
          
          {/* Offering summary - moved to be more prominent */}
          <div className="w-[500px] mb-4">
            <div className="border-2 border-amber-500/60 p-4 shadow-lg" style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)', borderRadius: '16px' }}>
              <div className="flex flex-col gap-2">
                <div className="text-center text-lg">
                  <span className="font-bold text-amber-300">CURRENT OFFERING:</span>
                </div>
                <div className="text-center text-base">
                  {hasAnySelection ? (
                    <span className="text-white font-semibold">
                      {selected[ITEM.KEYS] ? `${selected[ITEM.KEYS]} Rusted Caps • ` : ""}
                      {selected[ITEM.ASHES] ? `${selected[ITEM.ASHES]} Glass Shards • ` : ""}
                      {selected[ITEM.FRAGMENT]
                        ? `${selected[ITEM.FRAGMENT]} Fragments • `
                        : ""}
                      {selected[ITEM.DAGGER]
                        ? `${selected[ITEM.DAGGER]} Daggers • `
                        : ""}
                      {useBindingContract ? "Binding Contract • " : ""}
                      {useSoulDeed ? "Soul Deed • " : ""}
                      {selectedCultist ? `Cultist #${selectedCultist.id}` : ""}
                    </span>
                  ) : (
                    <span className="text-gray-400">Nothing selected yet</span>
                  )}
                </div>
                <div className="text-center text-sm mt-2">
                  {ritual.type ? (
                    ritual.valid ? (
                      <span className="text-green-400 font-bold text-base">✅ READY TO SACRIFICE</span>
                    ) : (
                      <span className="text-yellow-400 font-semibold">{ritual.reason}</span>
                    )
                  ) : (
                    <span className="text-gray-400">Select items from inventory</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Main sacrifice button */}
          <button
            onClick={onFinalSacrifice}
            disabled={isLoading || isPending || isConfirming || !ritual.type || !ritual.valid || !isApproved || isInCooldown?.()}
            style={{
              backgroundColor: isLoading || isPending || isConfirming || !ritual.type || !ritual.valid || !isApproved || isInCooldown?.() ? '#374151' : '#dc2626',
              color: '#ffffff',
              padding: '24px 48px',
              borderRadius: '16px',
              fontWeight: 'bold',
              fontSize: '20px',
              minWidth: '300px',
              textAlign: 'center',
              cursor: isLoading || isPending || isConfirming || !ritual.type || !ritual.valid || !isApproved || isInCooldown?.() ? 'not-allowed' : 'pointer',
              border: '2px solid ' + (isLoading || isPending || isConfirming || !ritual.type || !ritual.valid || !isApproved || isInCooldown?.() ? '#6b7280' : '#ef4444'),
              boxShadow: '0 0 30px rgba(220, 38, 38, 0.5), 0 8px 20px rgba(0, 0, 0, 0.3)',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.8)',
              transition: 'all 0.2s',
              display: 'block',
              visibility: 'visible'
            }}
          >
            {isPending ? "SIGNING..." :
             isConfirming ? "CONFIRMING..." :
             isLoading ? "OFFERING..." : 
             !isApproved ? "APPROVE FIRST" :
             isInCooldown?.() ? `WAIT ${getBlocksRemaining?.()} BLOCKS` :
             "FEED THE MAW"}
          </button>

          {/* Approval section - moved below button */}
          {!isApproved && (
            <div className="text-center mt-4 rounded-2xl p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)', borderRadius: '16px' }}>
              <div className="text-yellow-300 font-bold text-base mb-2">
                ⚠️ CONTRACT APPROVAL REQUIRED
              </div>
              <p className="text-gray-300 text-sm mb-3 max-w-md">
                You must approve the Maw contract to spend your relics before you can sacrifice.
              </p>
              <button
                onClick={approveContract}
                disabled={isLoading || isPending || isConfirming}
                style={{
                  backgroundColor: isLoading || isPending || isConfirming ? '#374151' : '#059669',
                  color: '#ffffff',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  minWidth: '200px',
                  textAlign: 'center',
                  cursor: isLoading || isPending || isConfirming ? 'not-allowed' : 'pointer',
                  border: '2px solid ' + (isLoading || isPending || isConfirming ? '#6b7280' : '#10b981'),
                  boxShadow: '0 0 15px rgba(16, 185, 129, 0.3)',
                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.8)',
                  transition: 'all 0.2s'
                }}
              >
                {isPending ? "⏳ SIGNING..." :
                 isConfirming ? "⏳ CONFIRMING..." :
                 isLoading ? "⏳ APPROVING..." : "✅ APPROVE CONTRACT"}
              </button>
            </div>
          )}
          
        </div>
      </div>


      {/* LEFT SIDEBAR INVENTORY */}
      <div className="fixed left-0 top-0 right-auto w-72 h-full p-3 overflow-y-auto" style={{ zIndex: 10, backgroundColor: 'rgba(0, 0, 0, 0.9)', width: '260px' }}>
        <h2 style={{ color: '#f3e8aa', fontSize: '16px', marginBottom: '8px', textAlign: 'center', fontWeight: 'bold' }}>INVENTORY</h2>
        <div className="space-y-2">
            <RailCard
              title={prettyName[ITEM.KEYS]}
              subtitle={selected[ITEM.KEYS] > 0 ? `${selected[ITEM.KEYS]}x rusted caps → Random relics` : "Random relics"}
              icon={emoji[ITEM.KEYS]}
              itemId={ITEM.KEYS}
              owned={owned[ITEM.KEYS]}
              value={selected[ITEM.KEYS]}
              onChange={(v) => setCount(ITEM.KEYS, v)}
              disabled={isLoading}
              highlight={selected[ITEM.KEYS] > 0}
            />
            
            <RailCard
              title={prettyName[ITEM.FRAGMENT]}
              subtitle={selected[ITEM.FRAGMENT] > 0 ? `${getCosmeticSuccessChance(selected[ITEM.FRAGMENT])}% cosmetic success` : "Cosmetic success"}
              icon={emoji[ITEM.FRAGMENT]}
              itemId={ITEM.FRAGMENT}
              owned={owned[ITEM.FRAGMENT]}
              value={selected[ITEM.FRAGMENT]}
              onChange={(v) => setCount(ITEM.FRAGMENT, v)}
              disabled={isLoading}
              highlight={selected[ITEM.FRAGMENT] > 0}
            />
            
            {/* MASK input hidden - simplified to fragments-only
            <RailCard
              title={prettyName[ITEM.MASK]}
              subtitle={selected[ITEM.MASK] > 0 ? `+${selected[ITEM.MASK]} cosmetic rarity boost` : "Improves cosmetic rarity"}
              icon={emoji[ITEM.MASK]}
              itemId={ITEM.MASK}
              owned={owned[ITEM.MASK]}
              value={selected[ITEM.MASK]}
              onChange={(v) => setCount(ITEM.MASK, v)}
              disabled={isLoading}
              highlight={selected[ITEM.MASK] > 0}
            />
            */}
            
            <RailCard
              title={prettyName[ITEM.DAGGER]}
              subtitle={selected[ITEM.DAGGER] > 0 ? `${getDemonSuccessChance(selected[ITEM.DAGGER])}% demon success` : "Demon success"}
              icon={emoji[ITEM.DAGGER]}
              itemId={ITEM.DAGGER}
              owned={owned[ITEM.DAGGER]}
              value={selected[ITEM.DAGGER]}
              onChange={(v) => setCount(ITEM.DAGGER, v)}
              disabled={isLoading || useBindingContract || useSoulDeed}
              highlight={selected[ITEM.DAGGER] > 0}
            />
            
            {/* VIAL input hidden - simplified to daggers-only for demons
            <RailCard
              title={prettyName[ITEM.VIAL]}
              subtitle={selected[ITEM.VIAL] > 0 ? `+${selected[ITEM.VIAL]} demon tier boost` : "Improves demon tier"}
              icon={emoji[ITEM.VIAL]}
              itemId={ITEM.VIAL}
              owned={owned[ITEM.VIAL]}
              value={selected[ITEM.VIAL]}
              onChange={(v) => setCount(ITEM.VIAL, v)}
              disabled={isLoading || useBindingContract || useSoulDeed}
              highlight={selected[ITEM.VIAL] > 0}
            />
            */}

            
        </div>
      </div>

      {/* RIGHT SIDEBAR - SPECIAL ITEMS */}
      <div style={{ position: 'absolute', top: '0px', right: '0px', width: '260px', maxHeight: 'calc(100vh - 80px)', paddingTop: '12px', paddingLeft: '12px', paddingRight: '12px', paddingBottom: '12px', zIndex: 15, backgroundColor: 'rgba(0, 0, 0, 0.9)', boxSizing: 'border-box', overflowY: 'hidden' }}>
        <h2 style={{ color: '#f3e8aa', fontSize: '16px', marginTop: '8px', marginBottom: '8px', textAlign: 'center', fontWeight: 'bold' }}>SPECIAL ITEMS</h2>
        <div className="space-y-2">
          {/* BINDING CONTRACT HIDDEN - Simplified demon sacrifice
          <RailCard
            title={prettyName[ITEM.CONTRACT]}
            subtitle="Guarantees Rare demon"
            icon={emoji[ITEM.CONTRACT]}
            itemId={ITEM.CONTRACT}
            owned={owned[ITEM.CONTRACT]}
            value={useBindingContract ? 1 : 0}
            onChange={(v) => onToggleContract(v > 0)}
            disabled={isLoading}
            highlight={useBindingContract}
          />
          */}
          
          <RailCard
            title={prettyName[ITEM.DEED]}
            subtitle="Guarantees Legendary demon"
            icon={emoji[ITEM.DEED]}
            itemId={ITEM.DEED}
            owned={owned[ITEM.DEED]}
            value={useSoulDeed ? 1 : 0}
            onChange={(v) => onToggleDeed(v > 0)}
            disabled={isLoading}
            highlight={useSoulDeed}
          />

          {/* Glass Shards Section */}
          <div className="border-t border-gray-600 pt-3 mt-3">
            <RailCard
              title={prettyName[ITEM.ASHES]}
              subtitle="5 Glass Shards = 1 Rusted Cap"
              icon={emoji[ITEM.ASHES]}
              itemId={ITEM.ASHES}
              owned={owned[ITEM.ASHES]}
              value={selected[ITEM.ASHES] || 0}
              onChange={(v) => setCount(ITEM.ASHES, v)}
              disabled={isLoading || owned[ITEM.ASHES] < 5}
              highlight={selected[ITEM.ASHES] > 0}
              maxValue={Math.floor(owned[ITEM.ASHES] / 5) * 5}
              step={5}
            />
          </div>

          {/* Cultist Section */}
          <div className="border-t border-gray-600 pt-3 mt-8 flex-shrink-0">
            <div className="text-sm text-red-300 font-semibold mb-2">Cultist to Sacrifice</div>
            <div className="text-xs text-gray-300 mb-3">Select a cultist for demon rituals:</div>
            <div 
              style={{
                maxHeight: '200px',
                overflowY: 'auto',
                scrollbarWidth: 'thin',
                scrollbarColor: '#6b7280 #374151'
              }}
            >
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '8px', 
                paddingRight: '8px' 
              }}>
                {cultists.slice(0, 6).map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCultist(selectedCultist?.id === c.id ? null : c)}
                    className={`rounded-lg p-2 transition border flex flex-col items-center ${
                      selectedCultist?.id === c.id 
                        ? 'bg-red-900/70 border-red-400 border-2 shadow-xl shadow-red-400/80 ring-2 ring-red-400/50' 
                        : 'bg-gray-800/60 hover:bg-gray-700/70 border-white/10'
                    }`}
                  >
                    <div 
                      className="w-20 h-20 mb-1 flex-shrink-0 rounded overflow-hidden"
                      style={{
                        boxShadow: selectedCultist?.id === c.id ? '0 0 20px rgba(239, 68, 68, 0.8), 0 0 40px rgba(239, 68, 68, 0.4)' : 'none',
                        border: selectedCultist?.id === c.id ? '2px solid #ef4444' : 'none',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <img
                        src={c.image}
                        alt={c.name}
                        className="w-full h-full object-cover"
                        style={{
                          filter: selectedCultist?.id === c.id ? 'brightness(1.2) saturate(1.1)' : 'none',
                          transition: 'filter 0.3s ease'
                        }}
                        onError={(e) => {
                          console.log('Image error for cultist', c.id, ':', e.target.src);
                          e.target.src = '/cultist-raccoon.png';
                        }}
                      />
                    </div>
                    <div 
                      className="font-mono font-bold"
                      style={{
                        color: selectedCultist?.id === c.id ? '#fca5a5' : 'white',
                        transition: 'color 0.3s ease',
                        fontSize: '14px'
                      }}
                    >
                      #{c.id}
                    </div>
                  </button>
                ))}
              </div>
              {cultists.length === 0 && (
                <div className="text-xs text-gray-400 text-center py-4">No cultists available.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* FLOATING REWARD REVEAL */}
      <AnimatePresence>
        {showReward && lastSacrificeResult && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              backgroundColor: "rgba(0,0,0,0.7)",
              backdropFilter: "blur(4px)",
              zIndex: 9999,
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0
            }}
            onClick={() => setShowReward(false)}
          >
            {/* Floating Reward Container */}
            <div className="reward-container" onClick={(e) => e.stopPropagation()}>
              {lastSacrificeResult.success && lastSacrificeResult.rewards?.length > 0 && (
                <>
                  {/* Main reward display */}
                  <div className="reward-item">
                    {/* Glow effect based on rarity */}
                    <div className={`reward-glow glow-${getItemRarity(lastSacrificeResult.rewards[0].name)}`} />
                    
                    {/* Reward image */}
                    {(() => {
                      const reward = lastSacrificeResult.rewards[0];
                      const rewardItemId = Object.keys(prettyName).find(key => prettyName[key] === reward.name);
                      const imageSrc = rewardItemId && itemImages[rewardItemId];
                      
                      return imageSrc ? (
                        <img src={imageSrc} alt={reward.name} className="reward-image" />
                      ) : (
                        <div className="reward-image flex items-center justify-center text-6xl">
                          {emoji[rewardItemId] || '✨'}
                        </div>
                      );
                    })()}
                    
                    {/* Shimmer overlay */}
                    <div className="reward-shimmer" />
                  </div>
                  
                  {/* Reward info */}
                  <div className="reward-info">
                    <div className="reward-name">
                      {lastSacrificeResult.rewards[0].name}
                      {lastSacrificeResult.rewards[0].quantity > 1 && ` ×${lastSacrificeResult.rewards[0].quantity}`}
                    </div>
                    <div className={`reward-rarity text-${getItemRarity(lastSacrificeResult.rewards[0].name)}`}>
                      {getItemRarity(lastSacrificeResult.rewards[0].name).toUpperCase()}
                    </div>
                  </div>
                </>
              )}
              
              {/* Failure state - just show ash */}
              {!lastSacrificeResult.success && (
                <>
                  <div className="reward-item">
                    <div className="reward-glow glow-common" />
                    <div className="reward-image flex items-center justify-center text-6xl opacity-50">
                      🌫️
                    </div>
                  </div>
                  <div className="reward-info">
                    <div className="reward-name">Nothing but Glass Shards...</div>
                    <div className="reward-rarity text-gray-500">FAILED</div>
                  </div>
                </>
              )}
              
              {/* Click to dismiss */}
              <div className="dismiss-hint">Click anywhere to continue</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
    </div>
  );
}

