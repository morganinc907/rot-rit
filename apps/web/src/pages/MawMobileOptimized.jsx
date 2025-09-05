import React, { useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import { useAccount, useChainId } from "wagmi";

import useNFTBalances from "../hooks/useNFTBalancesSDK";
import useCultists from "../hooks/useCultists";
import { useMawSacrificeKitV4 as useMawSacrificeKit } from "../kit-hooks/useMawSacrificeKitV4";

/**
 * MawMobileOptimized
 * - Full-bleed background image
 * - Mobile: off-canvas drawers for Inventory (left) and Specials (right)
 * - Desktop: HUD rails remain pinned
 * - Reduced backdrop blur on mobile
 * - Lazy-loaded images, explicit sizes to reduce CLS
 */

const BACKGROUND_URL = "/images/maw-bg.PNG";

// Item IDs (must align with your backend)
const ITEM = {
  KEYS: 0,      // Rusted Caps (11 tokens)
  FRAGMENT: 2,  // Lantern Fragment (1 token)
  MASK: 3,      // Worm-eaten Mask (11 tokens)
  VIAL: 5,      // Ash Vial (4 tokens)
  ASHES: 6,     // Glass Shards (6 tokens)
  DEED: 7,      // Soul Deed (3 tokens - but used as boolean flag)
  DAGGER: 8,    // Bone Dagger (10 tokens)
  CONTRACT: 9,  // Binding Contract (4 tokens - but used as boolean flag)
};

const prettyName = {
  [ITEM.KEYS]: "Rusted Cap",
  [ITEM.FRAGMENT]: "Lantern Fragment",
  [ITEM.MASK]: "Worm-eaten Mask",
  [ITEM.DAGGER]: "Bone Dagger",
  [ITEM.VIAL]: "Ash Vial",
  [ITEM.CONTRACT]: "Binding Contract",
  [ITEM.DEED]: "Soul Deed",
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
      style={{
        borderRadius: '12px',
        padding: '16px',
        border: highlight 
          ? '1px solid rgba(168, 85, 247, 0.6)' 
          : '1px solid rgba(251, 191, 36, 0.5)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        width: '100%',
        maxWidth: '160px',
        height: '200px',
        background: highlight 
          ? 'linear-gradient(135deg, rgba(139, 69, 19, 0.1), rgba(101, 67, 33, 0.1))'
          : 'rgba(0, 0, 0, 0.9)',
        boxShadow: highlight 
          ? '0 0 20px rgba(147, 51, 234, 0.3)'
          : '0 2px 8px rgba(0, 0, 0, 0.3)',
        transition: 'all 0.2s ease'
      }}
    >
      {/* Header with title */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: '8px'
      }}>
        <div style={{ 
          fontSize: '14px', 
          fontWeight: 'bold', 
          color: highlight ? '#a855f7' : '#f3e8aa' 
        }}>
          {title}
        </div>
        <div style={{
          background: 'black',
          color: 'white',
          fontSize: '14px',
          fontWeight: 'bold',
          padding: '4px 8px',
          borderRadius: '12px',
          minWidth: '28px',
          textAlign: 'center',
          border: '2px solid rgba(255,255,255,0.4)',
          boxShadow: '0 2px 4px rgba(0,0,0,0.5)'
        }}>
          {owned || 0}
        </div>
      </div>
      
      {/* Image container */}
      <div style={{ 
        position: 'relative', 
        flex: 1, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        marginBottom: '8px'
      }}>
        {shouldShowImage ? (
          <>
            <img
              src={imageSrc}
              alt={title}
              style={{
                width: '60px',
                height: '60px',
                objectFit: 'contain',
                filter: disabled ? 'grayscale(100%) opacity(50%)' : 'none'
              }}
              onError={() => setImageError(true)}
            />
            {value > 0 && (
              <div style={{
                position: 'absolute',
                top: '-5px',
                right: '35px',
                background: '#dc2626',
                color: 'white',
                fontSize: '12px',
                fontWeight: 'bold',
                padding: '2px 6px',
                borderRadius: '10px',
                minWidth: '20px',
                textAlign: 'center',
                boxShadow: '0 2px 4px rgba(0,0,0,0.5)'
              }}>
                {value}
              </div>
            )}
          </>
        ) : (
          <div style={{ fontSize: '48px' }}>{icon}</div>
        )}
      </div>

      {/* Subtitle */}
      {subtitle && (
        <div style={{ 
          fontSize: '11px', 
          color: '#9ca3af', 
          marginBottom: '8px',
          textAlign: 'center'
        }}>
          {subtitle}
        </div>
      )}

      {/* Counter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
        <button
          onClick={() => onChange(Math.max(0, value - 1))}
          disabled={disabled || value <= 0}
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 'bold',
            background: 'linear-gradient(145deg, rgba(139, 69, 19, 0.8), rgba(101, 67, 33, 0.8))',
            border: '1px solid rgba(205, 133, 63, 0.4)',
            color: '#f3e8aa',
            cursor: 'pointer',
            opacity: (disabled || value <= 0) ? 0.5 : 1
          }}
        >
          −
        </button>
        <div style={{
          width: '30px',
          textAlign: 'center',
          fontWeight: 'bold',
          color: '#f3e8aa',
          textShadow: '0 1px 2px rgba(0, 0, 0, 0.8)'
        }}>
          {value || 0}
        </div>
        <button
          onClick={() => onChange(Math.min(owned, value + 1))}
          disabled={disabled || value >= owned}
          style={{
            width: '24px',
            height: '24px', 
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 'bold',
            background: 'linear-gradient(145deg, rgba(139, 69, 19, 0.8), rgba(101, 67, 33, 0.8))',
            border: '1px solid rgba(205, 133, 63, 0.4)',
            color: '#f3e8aa',
            cursor: 'pointer',
            opacity: (disabled || value >= owned) ? 0.5 : 1
          }}
        >
          +
        </button>
      </div>
    </div>
  );
}

function ToggleCard({ title, subtitle, icon, owned = 0, checked = false, onToggle, disabled }) {
  return (
    <button
      onClick={() => onToggle(!checked)}
      disabled={disabled || owned <= 0}
      className={`text-left rounded-xl p-3 bg-black/40 border backdrop-blur-md md:backdrop-blur-md sm:backdrop-blur-0 min-w-[150px] transition
        ${
          checked ? "border-amber-400/70 ring-2 ring-amber-400/30" : "border-white/10 hover:border-white/20"
        } disabled:opacity-50`}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="text-2xl">{icon}</div>
        <div className="font-semibold">{title}</div>
      </div>
      {subtitle && <div className="text-xs text-gray-300 mb-3">{subtitle}</div>}
      <div className="text-xs text-gray-400">Owned: {owned} • {checked ? "Enabled" : "Disabled"}</div>
    </button>
  );
}

function CultistPicker({ cultists, selected, onSelect }) {
  return (
    <div className="space-y-3">
      <div className="text-sm text-red-300 font-semibold">Cultist to Sacrifice</div>
      <div className="rounded-xl bg-black/40 border border-white/10 p-3 backdrop-blur-md md:backdrop-blur-md sm:backdrop-blur-0">
        <div>
          <div className="text-xs text-gray-300 mb-3">Select a cultist for demon rituals:</div>
          <div className="max-h-48 overflow-y-auto">
            <div className="grid grid-cols-2 gap-2">
              {cultists.slice(0, 6).map((c) => (
                <button
                  key={c.id}
                  onClick={() => onSelect(c)}
                  className={`rounded-lg p-2 transition border flex flex-col items-center ${
                    selected?.id === c.id 
                      ? 'bg-red-900/50 border-red-500 shadow-lg shadow-red-500/50' 
                      : 'bg-gray-800/60 hover:bg-gray-700/70 border-white/10'
                  }`}
                >
                  <div className="w-20 h-20 mb-1 flex-shrink-0 rounded overflow-hidden">
                    <img
                      src={c.image}
                      alt={c.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.log('Mobile image error for cultist', c.id, ':', e.target.src);
                        e.target.src = '/cultist-raccoon.png';
                      }}
                    />
                  </div>
                  <div className={`text-xs font-mono font-bold ${
                    selected?.id === c.id ? 'text-red-300' : 'text-white'
                  }`}>
                    #{c.id}
                  </div>
                </button>
              ))}
            </div>
            {cultists.length === 0 && <div className="text-xs text-gray-400">No cultists available.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MawNewMobileOptimized() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { relics, loading: relicsLoading, refetch: refetchRelics } = useNFTBalances();
  const { cultists, loading: cultistsLoading, refetch: refetchCultists } = useCultists();

  // Reward modal
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [lastSacrificeResult, setLastSacrificeResult] = useState(null);

  // Mobile drawers
  const [showLeft, setShowLeft] = useState(false);   // Inventory
  const [showRight, setShowRight] = useState(false); // Specials
  // FORCE MOBILE MODE - this component should always show mobile interface
  const [isMobile, setIsMobile] = useState(true);
  
  // For MawMobileOptimized, we ALWAYS want mobile interface regardless of screen size
  // (Use MawResponsive if you want auto-detection)

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
      setLastSacrificeResult(result);
      setShowResultsModal(true);
      // Refresh inventories after outcome so HUD updates
      refetchRelics();
      refetchCultists();
      // Clear selection
      setSelected({ [ITEM.KEYS]: 0, [ITEM.FRAGMENT]: 0, [ITEM.MASK]: 0, [ITEM.DAGGER]: 0, [ITEM.VIAL]: 0 });
      setUseBindingContract(false);
      setUseSoulDeed(false);
      setSelectedCultist(null);
    },
    [refetchRelics, refetchCultists]
  );

  const {
    sacrificeKeys,
    sacrificeForCosmetic,
    sacrificeForDemon,
    convertAshes,
    approveContract,
    isApproved,
    isLoading,
  } = useMawSacrificeKit({
    baseUrl: '/abis',
    chainId,
    onSacrificeComplete: handleSacrificeComplete
  });

  const getRelicBalance = useCallback(
    (id) => {
      if (!Array.isArray(relics) || relics.length === 0) return 0;
      const r = relics.find((x) => Number(x.id) === Number(id));
      return r ? Number(r.quantity || 0) : 0;
    },
    [relics]
  );

  const owned = useMemo(
    () => ({
      [ITEM.KEYS]: getRelicBalance(ITEM.KEYS),
      [ITEM.FRAGMENT]: getRelicBalance(ITEM.FRAGMENT),
      [ITEM.MASK]: getRelicBalance(ITEM.MASK),
      [ITEM.DAGGER]: getRelicBalance(ITEM.DAGGER),
      [ITEM.VIAL]: getRelicBalance(ITEM.VIAL),
      [ITEM.CONTRACT]: getRelicBalance(ITEM.CONTRACT),
      [ITEM.DEED]: getRelicBalance(ITEM.DEED),
      [ITEM.ASHES]: getRelicBalance(ITEM.ASHES),
    }),
    [getRelicBalance]
  );

  const setCount = useCallback((id, count) => {
    setSelected((prev) => ({ ...prev, [id]: Math.max(0, count || 0) }));
  }, []);

  // Exclusivity: Contracts/Deeds ignore daggers/vials
  const onToggleContract = (next) => {
    setUseBindingContract(next);
    if (next) {
      setUseSoulDeed(false);
      setCount(ITEM.DAGGER, 0);
      setCount(ITEM.VIAL, 0);
    }
  };
  const onToggleDeed = (next) => {
    setUseSoulDeed(next);
    if (next) {
      setUseBindingContract(false);
      setCount(ITEM.DAGGER, 0);
      setCount(ITEM.VIAL, 0);
    }
  };
  
  // Ritual decision + validation
  const ritual = useMemo(() => {
    const keys = selected[ITEM.KEYS] || 0;
    const frags = selected[ITEM.FRAGMENT] || 0;
    const masks = selected[ITEM.MASK] || 0;
    const dags = selected[ITEM.DAGGER] || 0;
    const vials = selected[ITEM.VIAL] || 0;

    const usingContract = useBindingContract && owned[ITEM.CONTRACT] > 0;
    const usingDeed = useSoulDeed && owned[ITEM.DEED] > 0;
    const hasDemonIntent = usingContract || usingDeed || dags > 0 || vials > 0 || !!selectedCultist;

    let type = null;
    if (hasDemonIntent) type = "demon";
    else if (frags > 0 || masks > 0) type = "cosmetic";
    else if (keys > 0) type = "keys";

    let valid = false;
    let reason = "";
    let success = "";

    if (type === "keys") {
      valid = keys > 0 && keys <= owned[ITEM.KEYS];
      if (!valid) reason = keys <= 0 ? "Select at least 1 rusted cap." : "Not enough rusted caps.";
    }

    if (type === "cosmetic") {
      const total = frags + masks;
      if (frags <= 0) reason = "Need at least 1 fragment.";
      else if (total > 3) reason = "Max 3 (fragments + masks).";
      else if (frags > owned[ITEM.FRAGMENT]) reason = "Not enough fragments.";
      else if (masks > owned[ITEM.MASK]) reason = "Not enough masks.";
      else valid = true;

      if (frags > 0) {
        success = `${getCosmeticSuccessChance(frags)}% success` + (masks > 0 ? " • masks improve rarity" : "");
      }
    }

    if (type === "demon") {
      if (!selectedCultist) reason = "Select a cultist.";
      else if (usingDeed && !owned[ITEM.DEED]) reason = "No Soul Deed owned.";
      else if (usingContract && !owned[ITEM.CONTRACT]) reason = "No Binding Contract owned.";
      else if (usingDeed && usingContract) reason = "Choose only one: Deed or Contract.";
      else if (usingDeed || usingContract) {
        if (dags > 0 || vials > 0) reason = "Contracts ignore daggers/vials; set them to 0.";
        else valid = true;
      } else {
        const total = dags + vials;
        if (dags <= 0) reason = "Need at least 1 dagger.";
        else if (total > 3) reason = "Max 3 (daggers + vials).";
        else if (dags > owned[ITEM.DAGGER]) reason = "Not enough daggers.";
        else if (vials > owned[ITEM.VIAL]) reason = "Not enough vials.";
        else valid = true;
      }

      if (valid) {
        if (usingDeed) success = "Guaranteed Legendary demon";
        else if (usingContract) success = "Guaranteed Rare demon";
        else success = `${getDemonSuccessChance(dags)}% success${vials > 0 ? " • vials improve tier" : ""}`;
      }
    }

    return { type, valid, reason, success };
  }, [selected, selectedCultist, useBindingContract, useSoulDeed, owned]);

  const hasAnySelection = useMemo(
    () =>
      Object.values(selected).some((x) => x > 0) ||
      useBindingContract ||
      useSoulDeed ||
      !!selectedCultist,
    [selected, useBindingContract, useSoulDeed, selectedCultist]
  );

  const onFinalSacrifice = async () => {
    if (!ritual.type || !ritual.valid) {
      if (ritual.reason) toast.error(ritual.reason);
      return;
    }
    
    // Clear previous results before starting new sacrifice
    setLastSacrificeResult(null);
    setShowResultsModal(false);
    
    try {
      if (ritual.type === "keys") {
        const qty = selected[ITEM.KEYS] || 0;
        const result = await sacrificeKeys(qty);
        if (!result?.success) toast.error(result?.message || "Key sacrifice failed");
      } else if (ritual.type === "cosmetic") {
        const frags = selected[ITEM.FRAGMENT] || 0;
        const masks = selected[ITEM.MASK] || 0;
        const result = await sacrificeForCosmetic(frags, masks);
        if (result?.success === undefined) toast.error(result?.message || "Cosmetic ritual failed");
      } else if (ritual.type === "demon") {
        if (!selectedCultist) {
          toast.error("Select a cultist");
          return;
        }
        const result = await sacrificeForDemon(
          selected[ITEM.DAGGER] || 0,
          selected[ITEM.VIAL] || 0,
          useBindingContract,
          useSoulDeed,
          selectedCultist.id
        );
        if (result?.success === undefined) toast.error(result?.message || "Demon ritual failed");
      }
    } catch (e) {
      console.error(e);
      toast.error("Ritual failed to execute");
    }
  };

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

  return (
    <div className="min-h-screen relative text-gray-100">
      {/* BACKDROP */}
      <div
        style={{
          position: 'fixed',
          inset: '0',
          zIndex: '-10',
          backgroundImage: `url(${BACKGROUND_URL})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />
      <div 
        style={{
          position: 'fixed',
          inset: '0',
          zIndex: '-5',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.1), transparent, rgba(0,0,0,0.2))',
          pointerEvents: 'none'
        }}
      />


      {/* INVENTORY BUTTON - Left side */}
      <div 
        style={{ 
          display: !isMobile ? 'none' : 'block',
          position: 'fixed',
          top: '80px',
          left: '12px',
          zIndex: 99999
        }}
      >
        <button
          style={{
            background: 'linear-gradient(145deg, #1a1a1a, #2d2d2d)',
            color: '#e5e5e5',
            padding: '12px 20px',
            border: '2px solid #444444',
            borderRadius: '4px',
            fontSize: '13px',
            fontWeight: 'bold',
            cursor: 'pointer',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)',
            textShadow: '0 1px 2px rgba(0,0,0,0.8)',
            transition: 'all 0.2s ease'
          }}
          onClick={() => setShowLeft(!showLeft)}
          onMouseEnter={(e) => {
            e.target.style.background = 'linear-gradient(145deg, #2d2d2d, #3a3a3a)';
            e.target.style.borderColor = '#555555';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'linear-gradient(145deg, #1a1a1a, #2d2d2d)';
            e.target.style.borderColor = '#444444';
          }}
        >
          INVENTORY
        </button>
      </div>

      {/* SPECIALS BUTTON - Right side */}
      <div 
        style={{ 
          display: !isMobile ? 'none' : 'block',
          position: 'fixed',
          top: '80px',
          right: '12px',
          zIndex: 99999
        }}
      >
        <button
          style={{
            background: 'linear-gradient(145deg, #1a1a1a, #2d2d2d)',
            color: '#e5e5e5',
            padding: '12px 20px',
            border: '2px solid #444444',
            borderRadius: '4px',
            fontSize: '13px',
            fontWeight: 'bold',
            cursor: 'pointer',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)',
            textShadow: '0 1px 2px rgba(0,0,0,0.8)',
            transition: 'all 0.2s ease'
          }}
          onClick={() => setShowRight(!showRight)}
          onMouseEnter={(e) => {
            e.target.style.background = 'linear-gradient(145deg, #2d2d2d, #3a3a3a)';
            e.target.style.borderColor = '#555555';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'linear-gradient(145deg, #1a1a1a, #2d2d2d)';
            e.target.style.borderColor = '#444444';
          }}
        >
          SPECIALS
        </button>
      </div>

      {/* OFFERING STATUS - DESKTOP ONLY */}
      <div 
        className="fixed top-4 left-1/2 -translate-x-1/2 w-[96%] max-w-md md:max-w-3xl z-10"
        style={{ display: isMobile ? 'none' : 'block' }}
      >
        <div className="rounded-2xl border border-white/10 bg-black/60 md:bg-black/40 backdrop-blur-0 md:backdrop-blur-md p-3 md:p-4 shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div className="text-sm md:text-base">
              <span className="font-semibold text-red-300">Offering:</span>{" "}
              {hasAnySelection ? (
                <span className="text-gray-200">
                  {selected[ITEM.KEYS] ? `${selected[ITEM.KEYS]} Rusted Caps • ` : ""}
                  {(selected[ITEM.FRAGMENT] || selected[ITEM.MASK])
                    ? `${selected[ITEM.FRAGMENT] || 0} Fragments + ${selected[ITEM.MASK] || 0} Masks • `
                    : ""}
                  {(selected[ITEM.DAGGER] || selected[ITEM.VIAL])
                    ? `${selected[ITEM.DAGGER] || 0} Daggers + ${selected[ITEM.VIAL] || 0} Vials • `
                    : ""}
                  {useBindingContract ? "Binding Contract • " : ""}
                  {useSoulDeed ? "Soul Deed • " : ""}
                  {selectedCultist ? `Cultist #${selectedCultist.id}` : ""}
                </span>
              ) : (
                <span className="text-gray-400">Nothing selected yet.</span>
              )}
            </div>
            <div className="text-sm md:text-base">
              {ritual.type ? (
                ritual.valid ? (
                  <span className="text-green-400">{ritual.success || "Ready"}</span>
                ) : (
                  <span className="text-yellow-300">{ritual.reason}</span>
                )
              ) : (
                <span className="text-gray-400">Select items to begin.</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* LEFT RAIL (desktop only) */}
      <div 
        className="fixed left-0 top-0 w-[260px] h-full overflow-y-auto p-4 space-y-3 bg-black/30 border-r border-white/10"
        style={{ display: isMobile ? 'none' : 'block' }}
      >
        <h2 className="text-lg font-bold text-red-300">Relics</h2>
        <RailCard
          title={prettyName[ITEM.KEYS]}
          icon={emoji[ITEM.KEYS]}
          owned={owned[ITEM.KEYS]}
          value={selected[ITEM.KEYS]}
          onChange={(v) => setCount(ITEM.KEYS, v)}
        />
        <RailCard
          title={prettyName[ITEM.FRAGMENT]}
          icon={emoji[ITEM.FRAGMENT]}
          owned={owned[ITEM.FRAGMENT]}
          value={selected[ITEM.FRAGMENT]}
          onChange={(v) => setCount(ITEM.FRAGMENT, v)}
        />
        <RailCard
          title={prettyName[ITEM.MASK]}
          icon={emoji[ITEM.MASK]}
          owned={owned[ITEM.MASK]}
          value={selected[ITEM.MASK]}
          onChange={(v) => setCount(ITEM.MASK, v)}
        />
      </div>

      {/* RIGHT RAIL (desktop only) */}
      <div 
        className="fixed right-0 top-0 w-[260px] h-full overflow-y-auto p-4 space-y-3 bg-black/30 border-l border-white/10"
        style={{ display: isMobile ? 'none' : 'block' }}
      >
        <h2 className="text-lg font-bold text-red-300">Special Items</h2>
        <RailCard
          title={prettyName[ITEM.DAGGER]}
          icon={emoji[ITEM.DAGGER]}
          owned={owned[ITEM.DAGGER]}
          value={selected[ITEM.DAGGER]}
          onChange={(v) => setCount(ITEM.DAGGER, v)}
        />
        <RailCard
          title={prettyName[ITEM.VIAL]}
          icon={emoji[ITEM.VIAL]}
          owned={owned[ITEM.VIAL]}
          value={selected[ITEM.VIAL]}
          onChange={(v) => setCount(ITEM.VIAL, v)}
        />
        <ToggleCard
          title={prettyName[ITEM.CONTRACT]}
          icon={emoji[ITEM.CONTRACT]}
          owned={owned[ITEM.CONTRACT]}
          checked={useBindingContract}
          onToggle={onToggleContract}
        />
        <ToggleCard
          title={prettyName[ITEM.DEED]}
          icon={emoji[ITEM.DEED]}
          owned={owned[ITEM.DEED]}
          checked={useSoulDeed}
          onToggle={onToggleDeed}
        />
        <CultistPicker
          cultists={cultists}
          selected={selectedCultist}
          onSelect={setSelectedCultist}
        />
      </div>

      {/* MOBILE DRAWERS */}
      <AnimatePresence>
        {showLeft && (
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed',
              top: '130px', // Start below the button
              left: 0,
              bottom: '120px', // Leave space for sacrifice button + offering summary
              width: '42vw',
              maxWidth: '280px',
              backgroundColor: 'rgba(0,0,0,0.95)',
              borderRight: '1px solid rgba(255,255,255,0.1)',
              overflowY: 'auto',
              padding: '16px',
              paddingBottom: '20px', // Extra padding at bottom
              zIndex: 30
            }}
          >
            <button onClick={() => setShowLeft(false)} className="mb-3" style={{ color: 'white', background: 'none', border: 'none', fontSize: '16px' }}>✕ Close</button>
            <h2 className="text-lg font-bold text-red-300">Relics</h2>
            <RailCard
              title={prettyName[ITEM.KEYS]}
              subtitle={selected[ITEM.KEYS] > 0 ? `${selected[ITEM.KEYS]}x rusted caps → Random relics` : "Random relics"}
              icon={emoji[ITEM.KEYS]}
              itemId={ITEM.KEYS}
              owned={owned[ITEM.KEYS]}
              value={selected[ITEM.KEYS]}
              onChange={(v) => setCount(ITEM.KEYS, v)}
            />
            <RailCard
              title={prettyName[ITEM.FRAGMENT]}
              subtitle={selected[ITEM.FRAGMENT] > 0 ? `${getCosmeticSuccessChance(selected[ITEM.FRAGMENT])}% cosmetic success` : "Cosmetic success"}
              icon={emoji[ITEM.FRAGMENT]}
              itemId={ITEM.FRAGMENT}
              owned={owned[ITEM.FRAGMENT]}
              value={selected[ITEM.FRAGMENT]}
              onChange={(v) => setCount(ITEM.FRAGMENT, v)}
            />
            <RailCard
              title={prettyName[ITEM.MASK]}
              subtitle={selected[ITEM.MASK] > 0 ? `+${selected[ITEM.MASK]} cosmetic rarity boost` : "Improves cosmetic rarity"}
              icon={emoji[ITEM.MASK]}
              itemId={ITEM.MASK}
              owned={owned[ITEM.MASK]}
              value={selected[ITEM.MASK]}
              onChange={(v) => setCount(ITEM.MASK, v)}
            />
            <RailCard
              title={prettyName[ITEM.DAGGER]}
              subtitle={selected[ITEM.DAGGER] > 0 ? `${getDemonSuccessChance(selected[ITEM.DAGGER])}% demon success` : "Demon success"}
              icon={emoji[ITEM.DAGGER]}
              itemId={ITEM.DAGGER}
              owned={owned[ITEM.DAGGER]}
              value={selected[ITEM.DAGGER]}
              onChange={(v) => setCount(ITEM.DAGGER, v)}
            />
            <RailCard
              title={prettyName[ITEM.VIAL]}
              subtitle={selected[ITEM.VIAL] > 0 ? `+${selected[ITEM.VIAL]} demon tier boost` : "Improves demon tier"}
              icon={emoji[ITEM.VIAL]}
              itemId={ITEM.VIAL}
              owned={owned[ITEM.VIAL]}
              value={selected[ITEM.VIAL]}
              onChange={(v) => setCount(ITEM.VIAL, v)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showRight && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed',
              top: '130px', // Start below the button
              right: 0,
              bottom: '120px', // Leave space for sacrifice button + offering summary
              width: '42vw',
              maxWidth: '280px',
              backgroundColor: 'rgba(0,0,0,0.95)',
              borderLeft: '1px solid rgba(255,255,255,0.1)',
              overflowY: 'auto',
              padding: '16px',
              paddingBottom: '20px', // Extra padding at bottom
              zIndex: 30
            }}
          >
            <button onClick={() => setShowRight(false)} className="mb-3" style={{ color: 'white', background: 'none', border: 'none', fontSize: '16px' }}>✕ Close</button>
            <h2 className="text-lg font-bold text-red-300">Special Items</h2>
            <RailCard
              title={prettyName[ITEM.CONTRACT]}
              subtitle="Guarantees Rare demon"
              icon={emoji[ITEM.CONTRACT]}
              itemId={ITEM.CONTRACT}
              owned={owned[ITEM.CONTRACT]}
              value={useBindingContract ? 1 : 0}
              onChange={() => onToggleContract()}
              highlight={useBindingContract}
            />
            <RailCard
              title={prettyName[ITEM.DEED]}
              subtitle="Guarantees Legendary demon"
              icon={emoji[ITEM.DEED]}
              itemId={ITEM.DEED}
              owned={owned[ITEM.DEED]}
              value={useSoulDeed ? 1 : 0}
              onChange={() => onToggleDeed()}
              highlight={useSoulDeed}
            />
            <div style={{ borderTop: '1px solid #4b5563', paddingTop: '12px', marginTop: '12px' }}>
              <RailCard
                title={prettyName[ITEM.ASHES]}
                subtitle="5 Glass Shards = 1 Rusted Cap"
                icon={emoji[ITEM.ASHES]}
                itemId={ITEM.ASHES}
                owned={owned[ITEM.ASHES]}
                value={0}
                onChange={() => {}}
                disabled={true}
              />
            </div>
            <CultistPicker
              cultists={cultists}
              selected={selectedCultist}
              onSelect={setSelectedCultist}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Approval Notice */}
      {isConnected && !isApproved && (
        <div className="fixed bottom-20 left-4 right-4 md:bottom-4 md:left-auto md:right-4 md:w-80 z-20 p-3 bg-yellow-900/90 border border-yellow-500/50 rounded-xl">
          <p className="text-yellow-300 text-sm mb-2">Approve the Maw to access your relics</p>
          <button
            onClick={approveContract}
            disabled={isLoading}
            className="w-full py-2 bg-yellow-600 hover:bg-yellow-500 text-white font-semibold rounded-lg disabled:opacity-50"
          >
            {isLoading ? "Approving..." : "APPROVE MAW"}
          </button>
        </div>
      )}

      {/* Ash Conversion Notice */}
      {owned[ITEM.ASHES] >= 25 && (
        <div className="fixed bottom-32 left-4 right-4 md:bottom-4 md:left-4 md:w-80 z-20 p-3 bg-gray-900/90 border border-gray-500/50 rounded-xl">
          <p className="text-gray-300 text-sm mb-2">Convert 5 glass shards → 1 rusted cap (You have: {owned[ITEM.ASHES]})</p>
          <button
            onClick={convertAshes}
            disabled={isLoading}
            className="w-full py-2 bg-gray-600 hover:bg-gray-500 text-white font-semibold rounded-lg disabled:opacity-50"
          >
            {isLoading ? "Converting..." : "CONVERT ASHES"}
          </button>
        </div>
      )}

      {/* BOTTOM SACRIFICE BELT - MOBILE */}
      <div 
        style={{ 
          display: !isMobile ? 'none' : 'flex',
          position: 'fixed',
          bottom: '0',
          left: '0',
          right: '0',
          padding: '12px',
          backgroundColor: 'rgba(0,0,0,0.8)',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          flexDirection: 'column',
          alignItems: 'center',
          zIndex: 9999
        }}
      >
        {/* OFFERING SUMMARY */}
        <div style={{ 
          fontSize: '12px', 
          textAlign: 'center', 
          marginBottom: '8px',
          color: '#d1d5db'
        }}>
          <div>
            <span style={{ fontWeight: 'bold', color: '#fca5a5' }}>Offering: </span>
            {hasAnySelection ? (
              <span style={{ color: '#e5e7eb' }}>
                {selected[ITEM.KEYS] ? `${selected[ITEM.KEYS]} Rusted Caps • ` : ""}
                {(selected[ITEM.FRAGMENT] || selected[ITEM.MASK])
                  ? `${selected[ITEM.FRAGMENT] || 0} Fragments + ${selected[ITEM.MASK] || 0} Masks • `
                  : ""}
                {(selected[ITEM.DAGGER] || selected[ITEM.VIAL])
                  ? `${selected[ITEM.DAGGER] || 0} Daggers + ${selected[ITEM.VIAL] || 0} Vials • `
                  : ""}
                {useBindingContract ? "Binding Contract • " : ""}
                {useSoulDeed ? "Soul Deed • " : ""}
                {selectedCultist ? `Cultist #${selectedCultist.id}` : ""}
              </span>
            ) : (
              <span style={{ color: '#9ca3af' }}>Nothing selected yet.</span>
            )}
          </div>
          <div style={{ marginTop: '4px' }}>
            {ritual.type ? (
              ritual.valid ? (
                <span style={{ color: '#86efac' }}>{ritual.success || "Ready"}</span>
              ) : (
                <span style={{ color: '#fde047' }}>{ritual.reason}</span>
              )
            ) : (
              <span style={{ color: '#9ca3af' }}>Select items to begin.</span>
            )}
          </div>
        </div>

        <button
          onClick={onFinalSacrifice}
          disabled={isLoading || !ritual.valid || !isApproved}
          style={{
            padding: '12px 24px',
            borderRadius: '12px',
            fontWeight: 'bold',
            fontSize: '18px',
            background: 'linear-gradient(135deg, #dc2626, #ef4444)',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            opacity: (isLoading || !ritual.valid || !isApproved) ? 0.5 : 1
          }}
        >
          {isLoading ? "Sacrificing..." : "FEED THE MAW"}
        </button>
      </div>

      {/* BOTTOM SACRIFICE BELT - DESKTOP */}
      <div 
        className="fixed bottom-0 left-0 right-0 p-3 md:p-4 bg-black/70 border-t border-white/10 justify-center z-20 hidden lg:flex"
      >
        <button
          onClick={onFinalSacrifice}
          disabled={isLoading || !ritual.valid || !isApproved}
          className="px-6 py-3 rounded-xl font-bold text-lg bg-gradient-to-r from-red-700 to-red-500 hover:from-red-600 hover:to-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Sacrificing..." : "FEED THE MAW"}
        </button>
      </div>

      {/* RESULT MODAL */}
      <AnimatePresence>
        {showResultsModal && lastSacrificeResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.8)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 50
            }}
            onClick={() => setShowResultsModal(false)}
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: '400px',
                margin: '0 16px',
                background: lastSacrificeResult.success 
                  ? 'linear-gradient(145deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)'
                  : 'linear-gradient(145deg, #1c1917 0%, #44403c 50%, #1c1917 100%)',
                border: lastSacrificeResult.success ? '2px solid #fbbf24' : '2px solid #dc2626',
                borderRadius: '24px',
                boxShadow: lastSacrificeResult.success
                  ? '0 25px 50px rgba(251, 191, 36, 0.25)'
                  : '0 25px 50px rgba(220, 38, 38, 0.25)',
              }}
            >
              <button
                onClick={() => setShowResultsModal(false)}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(0,0,0,0.2)',
                  border: 'none',
                  color: 'rgba(255,255,255,0.6)',
                  fontSize: '20px',
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
              
              <div style={{ padding: '24px', textAlign: 'center' }}>
                {lastSacrificeResult.success ? (
                  <>
                    <h2 style={{ 
                      fontSize: '24px', 
                      fontWeight: 'bold', 
                      color: '#fbbf24', 
                      marginBottom: '8px',
                      textTransform: 'uppercase',
                      letterSpacing: '1px'
                    }}>
                      THE MAW HAS AWAKENED
                    </h2>
                    <p style={{ color: '#d1d5db', marginBottom: '16px' }}>
                      Your offering has pleased the ancient hunger
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                      {lastSacrificeResult.rewards?.map((reward, i) => {
                        const itemId = Object.keys(prettyName).find(key => prettyName[key] === reward.name);
                        const imageSrc = itemImages[itemId];
                        return (
                          <div key={i} style={{
                            backgroundColor: 'rgba(220, 38, 38, 0.2)',
                            borderRadius: '12px',
                            padding: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            border: '1px solid rgba(220, 38, 38, 0.3)'
                          }}>
                            {imageSrc && (
                              <img 
                                src={imageSrc} 
                                alt={reward.name}
                                style={{
                                  width: '40px',
                                  height: '40px',
                                  objectFit: 'contain'
                                }}
                              />
                            )}
                            <div style={{ flex: 1 }}>
                              <div style={{ color: '#fbbf24', fontWeight: 'bold' }}>{reward.name}</div>
                            </div>
                            <div style={{ 
                              color: '#fbbf24', 
                              fontWeight: 'bold', 
                              fontSize: '18px',
                              minWidth: '60px',
                              textAlign: 'right'
                            }}>
                              ×{reward.quantity}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <>
                    <h2 style={{ 
                      fontSize: '24px', 
                      fontWeight: 'bold', 
                      color: '#dc2626', 
                      marginBottom: '8px',
                      textTransform: 'uppercase',
                      letterSpacing: '1px'
                    }}>
                      THE MAW HUNGERS STILL
                    </h2>
                    <p style={{ color: '#d1d5db', marginBottom: '16px' }}>
                      {lastSacrificeResult.message}
                    </p>
                    {lastSacrificeResult.rewards?.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                        {lastSacrificeResult.rewards.map((reward, i) => {
                          const itemId = Object.keys(prettyName).find(key => prettyName[key] === reward.name);
                          const imageSrc = itemImages[itemId];
                          return (
                            <div key={i} style={{
                              backgroundColor: 'rgba(220, 38, 38, 0.2)',
                              borderRadius: '12px',
                              padding: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              border: '1px solid rgba(220, 38, 38, 0.3)'
                            }}>
                              {imageSrc && (
                                <img 
                                  src={imageSrc} 
                                  alt={reward.name}
                                  style={{
                                    width: '40px',
                                    height: '40px',
                                    objectFit: 'contain'
                                  }}
                                />
                              )}
                              <div style={{ flex: 1 }}>
                                <div style={{ color: '#dc2626', fontWeight: 'bold' }}>{reward.name}</div>
                              </div>
                              <div style={{ 
                                color: '#dc2626', 
                                fontWeight: 'bold', 
                                fontSize: '18px',
                                minWidth: '60px',
                                textAlign: 'right'
                              }}>
                                ×{reward.quantity}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
                
                <button
                  onClick={() => setShowResultsModal(false)}
                  className="w-full py-3 rounded-xl font-bold text-white"
                  style={{
                    background: lastSacrificeResult.success 
                      ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)'
                      : 'linear-gradient(135deg, #dc2626, #b91c1c)',
                  }}
                >
                  CONTINUE
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}