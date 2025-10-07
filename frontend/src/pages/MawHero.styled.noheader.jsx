import React, { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import { useAccount, useChainId } from "wagmi";
const span = ({ ok, label }) => (
  <span
    className={`px-2 py-1 rounded-full text-[11px] border ${
      ok
        ? "bg-emerald-500/15 text-emerald-300 border-emerald-400/30"
        : "bg-amber-500/15 text-amber-300 border-amber-400/30"
    }`}
  >
    {label}
  </span>
);


import useNFTBalances from "../hooks/useNFTBalancesSDK";
import useCultists from "../hooks/useCultists";
import { useMawSacrificeSDK } from "../hooks/useMawSacrificeSDK";
import { useContracts } from "../hooks/useContracts";
import "../styles/MawAnimations.css";

// Add CSS for the grid since Tailwind isn't working
const gridStyles = `
  .maw-background {
    background-size: cover;
    background-position: center;
  }

  @media (max-width: 767px) {
    .maw-background {
      background-size: cover;
      background-position: center center;
    }
  }

  .inventory-container {
    max-width: 900px;
    margin: 0 auto 32px auto;
  }

  .inventory-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
    padding: 0 16px;
  }

  @media (min-width: 768px) {
    .inventory-grid {
      grid-template-columns: repeat(4, 1fr);
    }
  }

  .inventory-item {
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 2px solid rgba(255, 179, 102, 0.3);
    border-radius: 12px;
    padding: 20px;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
    box-shadow:
      0 8px 32px rgba(0, 0, 0, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }

  .inventory-item::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 215, 0, 0.15), transparent);
    transition: left 0.5s ease;
  }

  .inventory-item:hover::before {
    left: 100%;
  }

  .inventory-item:hover {
    border-color: rgba(255, 215, 0, 0.7);
    transform: translateY(-4px) scale(1.02);
    box-shadow:
      0 12px 40px rgba(0, 0, 0, 0.4),
      0 0 20px rgba(255, 215, 0, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);
    background: rgba(0, 0, 0, 0.6);
  }

  .cultist-container {
    max-width: 1000px;
    margin: 0 auto 32px auto;
    padding: 0 16px;
  }

  .cultist-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }

  @media (min-width: 768px) {
    .cultist-grid {
      grid-template-columns: repeat(6, 1fr);
    }
  }

  @media (max-width: 480px) {
    .cultist-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
`;

// Inject the styles
if (typeof document !== 'undefined' && !document.getElementById('inventory-grid-styles')) {
  const styleElement = document.createElement('style');
  styleElement.id = 'inventory-grid-styles';
  styleElement.textContent = gridStyles;
  document.head.appendChild(styleElement);
}

/**
 * MawHero - Hero Layout Design
 * - Dramatic full-screen MAW hero section with centered "Feed the MAW" button
 * - Clean interface cards below for inventory and cultist selection
 * - Responsive design that works on mobile and desktop
 * - Preserves all existing functionality from MawNew
 */

const BACKGROUND_URL = "/images/maw-bg.JPG";

// Item IDs - Based on actual contract constants
const ITEM = {
  RUSTED_CAP: 1,          // sacrifice item - contract expects at ID 1
  GLASS_SHARD: 6,         // currency for conversions
  BINDING_CONTRACT: 9,    // rare guarantee - contract expects at ID 9
  SOUL_DEED: 7,           // legendary guarantee - contract expects at ID 7
};

const prettyName = {
  [ITEM.RUSTED_CAP]: "Rusted Caps",
  [ITEM.GLASS_SHARD]: "Glass Shards",
  [ITEM.BINDING_CONTRACT]: "Binding Contract",
  [ITEM.SOUL_DEED]: "Soul Deed",
};

const emoji = {
  [ITEM.RUSTED_CAP]: "🍾",
  [ITEM.GLASS_SHARD]: "🔷",
  [ITEM.BINDING_CONTRACT]: "📜",
  [ITEM.SOUL_DEED]: "💀📜",
};

// Item images - fallback to emoji if image not found
const itemImages = {
  0: "/images/items/rusted-caps.png",
  1: "/images/items/rusted-caps.png",
  6: "/images/items/glass-shards.png",
  8: "/images/items/glass-shards.png",
  9: "/images/items/bindiing-contract.png",
  7: "/images/items/soul-deed.png",
};

// Counter component for item selection
function Counter({ value, min = 0, max = 99, onChange, disabled, step = 1 }) {
  const dec = () => onChange(Math.max(min, (value || 0) - step));
  const inc = () => onChange(Math.min(max, (value || 0) + step));

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
      <button
        onClick={dec}
        disabled={disabled || value <= min}
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '6px',
          background: disabled || value <= min
            ? 'rgba(100, 100, 100, 0.3)'
            : 'linear-gradient(135deg, #8B4513, #A0522D)',
          border: '1px solid rgba(255, 179, 102, 0.4)',
          color: '#FFD700',
          fontSize: '20px',
          fontWeight: 'bold',
          cursor: disabled || value <= min ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
        }}
        onMouseEnter={(e) => {
          if (!disabled && value > min) {
            e.target.style.transform = 'scale(1.1)';
            e.target.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.5)';
          }
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'scale(1)';
          e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.3)';
        }}
      >
        −
      </button>
      <div style={{
        minWidth: '48px',
        textAlign: 'center',
        fontWeight: 'bold',
        color: '#FFD700',
        background: 'rgba(0, 0, 0, 0.6)',
        borderRadius: '6px',
        padding: '6px 12px',
        fontSize: '18px',
        border: '1px solid rgba(255, 179, 102, 0.3)',
        textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)'
      }}>
        {value || 0}
      </div>
      <button
        onClick={inc}
        disabled={disabled || value >= max}
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '6px',
          background: disabled || value >= max
            ? 'rgba(100, 100, 100, 0.3)'
            : 'linear-gradient(135deg, #8B4513, #A0522D)',
          border: '1px solid rgba(255, 179, 102, 0.4)',
          color: '#FFD700',
          fontSize: '20px',
          fontWeight: 'bold',
          cursor: disabled || value >= max ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
        }}
        onMouseEnter={(e) => {
          if (!disabled && value < max) {
            e.target.style.transform = 'scale(1.1)';
            e.target.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.5)';
          }
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'scale(1)';
          e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.3)';
        }}
      >
        +
      </button>
    </div>
  );
}

// Inventory card component
function InventoryCard({ title, icon, itemId, owned = 0, value = 0, onChange, disabled, step = 1 }) {
  const [imageError, setImageError] = useState(false);
  const imageSrc = itemImages[itemId];
  const shouldShowImage = imageSrc && !imageError;

  
  // Item descriptions
  const descriptions = {
    [ITEM.RUSTED_CAP]: "SACRIFICE TO SUMMON COSMETICS",
    [ITEM.GLASS_SHARD]: "5 SHARDS = 1 CAP • 50 = BINDING • 100 = SOUL DEED"
  };

  return (
    <div className="inventory-item">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h3 style={{ color: '#FFB366', fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>{title}</h3>
        {descriptions[itemId] && (
          <p style={{
            color: '#999',
            fontSize: '10px',
            marginBottom: '8px',
            textAlign: 'center',
            lineHeight: '1.3'
          }}>{descriptions[itemId]}</p>
        )}

        {/* Item image with quantity badge */}
        <div className="relative flex items-center justify-center mb-2" style={{ height: '80px', width: '100%' }}>
          {shouldShowImage ? (
            <>
              <img
                src={imageSrc}
                alt={title}
                className="w-full h-full object-contain"
                style={{
                  maxWidth: '80px',
                  maxHeight: '80px',
                  imageRendering: 'crisp-edges',
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
                }}
                onError={() => setImageError(true)}
              />
            </>
          ) : (
            <div className="text-4xl">{icon}</div>
          )}
        </div>

        {/* Owned count */}
        <div style={{
          color: '#FFB366',
          fontSize: '13px',
          marginBottom: '12px',
          fontWeight: '500',
          background: 'rgba(0, 0, 0, 0.4)',
          padding: '4px 12px',
          borderRadius: '12px',
          border: '1px solid rgba(255, 179, 102, 0.2)'
        }}>Owned: {owned}</div>
      </div>

      {/* Counter with step support */}
      <div className="flex justify-center">
        <Counter
          value={value}
          max={itemId === ITEM.GLASS_SHARD ? Math.floor(owned / 5) * 5 : owned}
          onChange={onChange}
          disabled={disabled}
          step={step}
        />
      </div>
    </div>
  );
}

// Cultist selection component
function CultistCard({ cultist, isSelected, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        borderRadius: '8px',
        padding: '12px',
        transition: 'all 0.3s',
        border: '2px solid',
        borderColor: isSelected ? '#F87171' : '#6B7280',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minHeight: '120px',
        background: isSelected
          ? 'rgba(153, 27, 27, 0.7)'
          : 'rgba(55, 65, 81, 0.6)',
        boxShadow: isSelected
          ? '0 10px 25px rgba(248, 113, 113, 0.5)'
          : '0 4px 6px rgba(0, 0, 0, 0.3)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1
      }}
      onMouseEnter={(e) => {
        if (!disabled && !isSelected) {
          e.target.style.background = 'rgba(75, 85, 99, 0.7)';
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !isSelected) {
          e.target.style.background = 'rgba(55, 65, 81, 0.6)';
        }
      }}
    >
      <div style={{
        width: '64px',
        height: '64px',
        borderRadius: '8px',
        marginBottom: '8px',
        overflow: 'hidden',
        border: '2px solid rgba(255, 255, 255, 0.2)'
      }}>
        <img
          src={cultist.image}
          alt={cultist.name}
          crossOrigin="anonymous"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
          onError={(e) => {
            e.target.src = '/cultist-raccoon.png';
          }}
        />
      </div>
      <div style={{ color: 'white', fontSize: '12px', textAlign: 'center' }}>
        <div style={{ fontWeight: '600' }}>#{cultist.id}</div>
      </div>
    </button>
  );
}

export default function MawHero() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  // State management
  const [selected, setSelected] = useState({
    [ITEM.RUSTED_CAP]: 0,
    [ITEM.GLASS_SHARD]: 0,
  });
  const [useBindingContract, setUseBindingContract] = useState(false);
  const [useSoulDeed, setUseSoulDeed] = useState(false);
  const [selectedCultist, setSelectedCultist] = useState(null);
  const [showReward, setShowReward] = useState(false);
  const [lastSacrificeResult, setLastSacrificeResult] = useState(null);
  const [isChomping, setIsChomping] = useState(false);

  // Refs for cleanup
  const rewardTimeoutRef = useRef();
  const chompEndTimeoutRef = useRef();

  // Data hooks
  const { relics, loading: relicsLoading, refetch: refetchRelics } = useNFTBalances();
  const { cultists, loading: cultistsLoading, refetch: refetchCultists } = useCultists();

  // Calculate owned amounts
  const owned = useMemo(() => {
    const result = {
      [ITEM.RUSTED_CAP]: 0,
      [ITEM.GLASS_SHARD]: 0,
      [ITEM.BINDING_CONTRACT]: 0,
      [ITEM.SOUL_DEED]: 0,
    };

    if (Array.isArray(relics)) {
      relics.forEach(relic => {
        const id = Number(relic.id);
        const quantity = Number(relic.quantity || 0);
        if (result.hasOwnProperty(id)) {
          result[id] = quantity;
        }
      });
    }

    return result;
  }, [relics]);

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (rewardTimeoutRef.current) clearTimeout(rewardTimeoutRef.current);
      if (chompEndTimeoutRef.current) clearTimeout(chompEndTimeoutRef.current);
    };
  }, []);

  // Auto-deactivate boosters when no cultist is selected
  useEffect(() => {
    if (!selectedCultist) {
      setUseBindingContract(false);
      setUseSoulDeed(false);
    }
  }, [selectedCultist]);

  // Handle sacrifice completion
  const handleSacrificeComplete = useCallback(
    (result) => {
      console.log("🎉 Sacrifice complete:", result);
      setLastSacrificeResult(result);
      setIsChomping(true);

      // Show reward after chomp animation
      rewardTimeoutRef.current = setTimeout(() => {
        setShowReward(true);
      }, 3290);

      // End chomp animation
      chompEndTimeoutRef.current = setTimeout(() => {
        setIsChomping(false);
      }, 3500);

      // Refresh inventories and reset selection
      refetchRelics();
      refetchCultists();
      setSelected({
        [ITEM.RUSTED_CAP]: 0,
        [ITEM.GLASS_SHARD]: 0,
      });
      setUseBindingContract(false);
      setUseSoulDeed(false);
      setSelectedCultist(null);
    },
    [refetchRelics, refetchCultists, isChomping, showReward]
  );

  // MAW sacrifice hook
  const {
    sacrificeCaps,
    sacrificeForCosmetic,
    sacrificeForDemon,
    convertAshes,
    convertShardsToRustedCaps,
    convertShardsToBinding,
    convertShardsToSoulDeed,
    approveContract,
    isApproved,
    refetchApproval,
    isLoading,
    isPending,
    isConfirming,
    contracts,
  } = useMawSacrificeSDK(handleSacrificeComplete, {
    onConversionComplete: () => {
      refetchRelics();
      setSelected({ [ITEM.RUSTED_CAP]: 0, [ITEM.GLASS_SHARD]: 0 });
    },
  });

  // Chain-first address resolution for comparison
  const { contracts: chainFirstContracts, loading: contractsLoading, error: contractsError } = useContracts();

  // Debug logging to check for address mismatch (flagged SDK issue #2)
  useEffect(() => {
    if (chainFirstContracts && contracts) {
      const chainFirstMaw = chainFirstContracts.MawSacrifice;
      const sdkMaw = contracts.MawSacrifice;

      console.log('🔍 Address Comparison (Chain-First vs SDK):', {
        chainFirstMaw,
        sdkMaw,
        addressesMatch: chainFirstMaw === sdkMaw,
        chainFirstReady: !contractsLoading,
        sdkReady: !!contracts
      });

      if (chainFirstMaw && sdkMaw && chainFirstMaw !== sdkMaw) {
        console.error('🚨 STALE ADDRESS DETECTED: SDK using wrong MAW address!', {
          correctAddress: chainFirstMaw,
          staleAddress: sdkMaw,
          issue: 'Flagged SDK Issue #2: Stale addresses (two MAW deployments)'
        });
      }
    }
  }, [chainFirstContracts, contracts, contractsLoading]);

  // Helper to update selected counts
  const setCount = useCallback((id, count) => {
    const newCount = Math.max(0, count || 0);
    setSelected(prev => ({ ...prev, [id]: newCount }));
  }, []);

  // Calculate available actions
  const canSacrificeCaps = useMemo(() => {
    return selected[ITEM.RUSTED_CAP] > 0;
  }, [selected]);

  const canSummonDemon = useMemo(() => {
    return !!selectedCultist;
  }, [selectedCultist]);

  const canConvertShards = useMemo(() => {
    return selected[ITEM.GLASS_SHARD] >= 5;
  }, [selected]);

  // Handle different sacrifice actions
  const handleSacrificeCaps = useCallback(async () => {
    console.log("🎯 FULL TEST LOG: Starting cap sacrifice flow");
    console.log("📊 Test State:", {
      rustedCapBalance: owned[ITEM.RUSTED_CAP],
      selectedCaps: selected[ITEM.RUSTED_CAP],
      tokenIdUsed: ITEM.RUSTED_CAP,
      canSacrificeCaps,
      isLoading,
      isApproved,
      contracts: {
        MawSacrifice: contracts?.MawSacrifice,
        Relics: contracts?.Relics,
        KeyShop: contracts?.KeyShop
      }
    });

    if (!canSacrificeCaps || isLoading) {
      console.warn("❌ Cannot sacrifice:", { canSacrificeCaps, isLoading });
      return;
    }

    console.log("🔥 Calling sacrificeCaps with amount:", selected[ITEM.RUSTED_CAP]);

    try {
      const result = await sacrificeCaps(selected[ITEM.RUSTED_CAP]);
      console.log("📦 Full sacrifice result:", {
        success: result?.success,
        hash: result?.hash,
        cosmeticId: result?.cosmeticId,
        error: result?.error,
        fullResult: result
      });

      if (result?.success) {
        console.log("✅ SACRIFICE SUCCESSFUL!");
      } else {
        toast.error("Sacrifice failed: " + (result?.error?.message || "Unknown error"));
      }
    } catch (error) {
      console.error("❌ Sacrifice failed:", error);
      toast.error("Sacrifice failed: " + error.message);
    }
  }, [canSacrificeCaps, selected, isLoading, sacrificeCaps, isApproved]);

  const handleSummonDemon = useCallback(async () => {
    if (!canSummonDemon || isLoading) return;
    try {
      await sacrificeForDemon(0, 0, useBindingContract, useSoulDeed, selectedCultist.id);
    } catch (error) {
      console.error("Demon summoning failed:", error);
      toast.error("Demon summoning failed: " + error.message);
    }
  }, [canSummonDemon, selectedCultist, selected, isLoading, sacrificeForDemon]);

  const handleConvertShards = useCallback(async () => {
    if (!canConvertShards || isLoading) return;
    try {
      await convertShardsToRustedCaps(selected[ITEM.GLASS_SHARD]);
    } catch (error) {
      console.error("Conversion failed:", error);
      toast.error("Conversion failed: " + error.message);
    }
  }, [canConvertShards, selected, isLoading, convertShardsToRustedCaps]);

  const handleConvertToBinding = useCallback(async () => {
    if (!selected[ITEM.GLASS_SHARD] || isLoading) return;
    const shards = selected[ITEM.GLASS_SHARD];
    const usable = Math.floor(shards / 50) * 50;
    if (usable < 50) { toast.error("Need at least 50 shards (multiples of 50)"); return; }
    try {
      await convertShardsToBinding(usable);
    } catch (error) {
      console.error("Binding conversion failed:", error);
      toast.error("Binding conversion failed: " + error.message);
    }
  }, [selected, isLoading, convertShardsToBinding]);

  const handleConvertToSoulDeed = useCallback(async () => {
    if (!selected[ITEM.GLASS_SHARD] || isLoading) return;
    const shards = selected[ITEM.GLASS_SHARD];
    const usable = Math.floor(shards / 100) * 100;
    if (usable < 100) { toast.error("Need at least 100 shards (multiples of 100)"); return; }
    try {
      await convertShardsToSoulDeed(usable);
    } catch (error) {
      console.error("Soul deed conversion failed:", error);
      toast.error("Soul deed conversion failed: " + error.message);
    }
  }, [selected, isLoading, convertShardsToSoulDeed]);

  const handleApprove = useCallback(async () => {
    try {
      await approveContract();
      await refetchApproval();
    } catch (error) {
      console.error("Approval failed:", error);
      toast.error("Approval failed: " + error.message);
    }
  }, [approveContract, refetchApproval]);

  // Loading states
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
    <div className={`min-h-screen relative maw-background ${isChomping ? 'maw-chomp' : ''}`}
         style={{
           backgroundImage: `url('${BACKGROUND_URL}')`,
           backgroundRepeat: 'no-repeat'
         }}>

      {/* Chomp flash overlay */

      }
      {isChomping && <div className="chomp-flash" />}

      {/* Strong overlay for readability */}
      <div className="absolute inset-0 bg-black/80" />

      {/* Main content with proper spacing for bottom action bar */}
      <div className="relative z-10 min-h-screen pb-32">

        {/* Title Header */}
        <div style={{
          textAlign: 'center',
          paddingTop: '40px',
          paddingBottom: '40px'
        }}>
          <h1 style={{
            fontFamily: 'Kings Cross',
            fontWeight: 'normal',
            fontSize: '5rem',
            background: 'linear-gradient(45deg, #8B4513, #FFD700, #8B4513)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: 0,
            display: 'inline-block'
          }}>
            Prepare Your Offering To The Maw
          </h1>
        </div>

        {/* Interface Section */}
        <div style={{ padding: '0 16px' }}>

        {/* Inventory Container */}
        <div className="inventory-container">

          <div className="inventory-grid">
            <InventoryCard
              title={prettyName[ITEM.RUSTED_CAP]}
              icon={emoji[ITEM.RUSTED_CAP]}
              itemId={ITEM.RUSTED_CAP}
              owned={owned[ITEM.RUSTED_CAP]}
              value={selected[ITEM.RUSTED_CAP]}
              onChange={(v) => setCount(ITEM.RUSTED_CAP, v)}
              disabled={isLoading}
            />
            <InventoryCard
              title={prettyName[ITEM.GLASS_SHARD]}
              icon={emoji[ITEM.GLASS_SHARD]}
              itemId={ITEM.GLASS_SHARD}
              owned={owned[ITEM.GLASS_SHARD]}
              value={selected[ITEM.GLASS_SHARD]}
              onChange={(v) => setCount(ITEM.GLASS_SHARD, v)}
              disabled={isLoading}
              step={5} // Increment by 5s since 5 shards = 1 cap
            />
            {/* Binding Contract Card */}
            <div className="inventory-item">
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <h3 style={{ color: '#FFB366', fontWeight: 'bold', fontSize: '14px', marginBottom: '4px', textAlign: 'center' }}>{prettyName[ITEM.BINDING_CONTRACT]}</h3>
                <p style={{
                  color: '#999',
                  fontSize: '10px',
                  marginBottom: '8px',
                  textAlign: 'center',
                  lineHeight: '1.3'
                }}>GUARANTEED DEMON SUMMON</p>
                {/* Binding Contract Image */}
                <div className="relative flex items-center justify-center mb-2" style={{ height: '80px', width: '100%' }}>
                  <img
                    src={itemImages[ITEM.BINDING_CONTRACT]}
                    alt={prettyName[ITEM.BINDING_CONTRACT]}
                    className="w-full h-full object-contain"
                    style={{
                      maxWidth: '80px',
                      maxHeight: '80px',
                      imageRendering: 'crisp-edges',
                      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                  />
                </div>
                <div style={{
                  color: '#FFB366',
                  fontSize: '13px',
                  marginBottom: '12px',
                  fontWeight: '500',
                  background: 'rgba(0, 0, 0, 0.4)',
                  padding: '4px 12px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 179, 102, 0.2)'
                }}>Owned: {owned[ITEM.BINDING_CONTRACT]}</div>
              </div>
              <div className="flex justify-center">
                <button
                  onClick={() => { setUseBindingContract(!useBindingContract); if (!useBindingContract) setUseSoulDeed(false); }}
                  disabled={isLoading || owned[ITEM.BINDING_CONTRACT] === 0 || !selectedCultist}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    cursor: isLoading || owned[ITEM.BINDING_CONTRACT] === 0 ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s',
                    background: useBindingContract
                      ? 'linear-gradient(135deg, #9333EA, #7C3AED)'
                      : 'rgba(0, 0, 0, 0.6)',
                    border: useBindingContract
                      ? '2px solid #A855F7'
                      : '2px solid rgba(255, 179, 102, 0.3)',
                    color: useBindingContract ? '#FFD700' : '#999',
                    boxShadow: useBindingContract
                      ? '0 0 20px rgba(147, 51, 234, 0.5)'
                      : '0 2px 4px rgba(0, 0, 0, 0.3)',
                    opacity: isLoading || owned[ITEM.BINDING_CONTRACT] === 0 || !selectedCultist ? 0.5 : 1
                  }}
                >
                  {useBindingContract ? '✓ ACTIVATED' : 'USE BOOSTER'}
                </button>
              </div>
            </div>
            {/* Soul Deed Card */}
            <div className="inventory-item">
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <h3 style={{ color: '#FFB366', fontWeight: 'bold', fontSize: '14px', marginBottom: '4px', textAlign: 'center' }}>{prettyName[ITEM.SOUL_DEED]}</h3>
                <p style={{
                  color: '#999',
                  fontSize: '10px',
                  marginBottom: '8px',
                  textAlign: 'center',
                  lineHeight: '1.3'
                }}>GUARANTEED LEGENDARY DEMON</p>

                {/* Soul Deed Image */}
                <div className="relative flex items-center justify-center mb-2" style={{ height: '80px', width: '100%' }}>
                  <img
                    src={itemImages[ITEM.SOUL_DEED]}
                    alt={prettyName[ITEM.SOUL_DEED]}
                    className="w-full h-full object-contain"
                    style={{
                      maxWidth: '80px',
                      maxHeight: '80px',
                      imageRendering: 'crisp-edges',
                      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                  />

                </div>

                <div style={{
                  color: '#FFB366',
                  fontSize: '13px',
                  marginBottom: '12px',
                  fontWeight: '500',
                  background: 'rgba(0, 0, 0, 0.4)',
                  padding: '4px 12px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 179, 102, 0.2)'
                }}>Owned: {owned[ITEM.SOUL_DEED]}</div>
              </div>

              <div className="flex justify-center">
                <button
                  onClick={() => { setUseSoulDeed(!useSoulDeed); if (!useSoulDeed) setUseBindingContract(false); }}
                  disabled={isLoading || owned[ITEM.SOUL_DEED] === 0 || !selectedCultist}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    cursor: isLoading || owned[ITEM.SOUL_DEED] === 0 ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s',
                    background: useSoulDeed
                      ? 'linear-gradient(135deg, #4338CA, #6366F1)'
                      : 'rgba(0, 0, 0, 0.6)',
                    border: useSoulDeed
                      ? '2px solid #818CF8'
                      : '2px solid rgba(255, 179, 102, 0.3)',
                    color: useSoulDeed ? '#FFD700' : '#999',
                    boxShadow: useSoulDeed
                      ? '0 0 20px rgba(67, 56, 202, 0.5)'
                      : '0 2px 4px rgba(0, 0, 0, 0.3)',
                    opacity: isLoading || owned[ITEM.SOUL_DEED] === 0 || !selectedCultist ? 0.5 : 1
                  }}
                >
                  {useSoulDeed ? '✓ ACTIVATED' : 'USE BOOSTER'}
                </button>
              </div>
            </div>

          </div>

        </div>

        {/* Sacrifice Action Section */}
        {isApproved && (
          <div style={{
            maxWidth: '900px',
            margin: '40px auto',
            padding: '32px',
            background: 'rgba(0, 0, 0, 0.8)',
            borderRadius: '16px',
            border: '2px solid rgba(255, 215, 0, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
              {/* Main action buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '600px' }}>
                {canSacrificeCaps && (
                  <button
                    onClick={handleSacrificeCaps}
                    disabled={isLoading}
                    style={{
                      padding: '16px 32px',
                      background: 'linear-gradient(135deg, #7F1D1D, #991B1B, #B91C1C)',
                      border: '2px solid #DC2626',
                      borderRadius: '12px',
                      color: '#FFFFFF',
                      fontSize: '18px',
                      fontWeight: 'bold',
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      transition: 'all 0.3s',
                      boxShadow: '0 4px 12px rgba(220, 38, 38, 0.4)',
                      opacity: isLoading ? 0.6 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (!isLoading) {
                        e.target.style.transform = 'scale(1.02)';
                        e.target.style.boxShadow = '0 6px 20px rgba(220, 38, 38, 0.6)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'scale(1)';
                      e.target.style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.4)';
                    }}
                  >
                    {isLoading ? 'SACRIFICING...' : 'SACRIFICE CAPS'}
                  </button>
                )}

                {canSummonDemon && (
                  <button
                    onClick={handleSummonDemon}
                    disabled={isLoading}
                    style={{
                      padding: '16px 32px',
                      background: 'linear-gradient(135deg, #581C87, #7C2D92, #9333EA)',
                      border: '2px solid #A855F7',
                      borderRadius: '12px',
                      color: '#FFFFFF',
                      fontSize: '18px',
                      fontWeight: 'bold',
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      transition: 'all 0.3s',
                      boxShadow: '0 4px 12px rgba(168, 85, 247, 0.4)',
                      opacity: isLoading ? 0.6 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (!isLoading) {
                        e.target.style.transform = 'scale(1.02)';
                        e.target.style.boxShadow = '0 6px 20px rgba(168, 85, 247, 0.6)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'scale(1)';
                      e.target.style.boxShadow = '0 4px 12px rgba(168, 85, 247, 0.4)';
                    }}
                  >
                    {isLoading ? 'SUMMONING...' : 'SUMMON DEMON'}
                  </button>
                )}
              </div>

              {/* Conversion buttons */}
              {canConvertShards && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'row',
                  gap: '8px',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                  marginTop: '16px'
                }}>
                  <button
                    onClick={handleConvertShards}
                    disabled={isLoading}
                    style={{
                      padding: '12px 16px',
                      background: 'linear-gradient(135deg, #1E3A8A, #3B82F6)',
                      border: '1px solid #60A5FA',
                      borderRadius: '8px',
                      color: '#FFFFFF',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
                      opacity: isLoading ? 0.6 : 1
                    }}
                  >
                    Convert to Caps ({Math.floor(selected[ITEM.GLASS_SHARD] / 5)})
                  </button>
                  <button
                    onClick={handleConvertToBinding}
                    disabled={isLoading}
                    style={{
                      padding: '12px 16px',
                      background: 'linear-gradient(135deg, #9A3412, #EA580C)',
                      border: '1px solid #FB923C',
                      borderRadius: '8px',
                      color: '#FFFFFF',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: '0 2px 8px rgba(234, 88, 12, 0.3)',
                      opacity: isLoading ? 0.6 : 1
                    }}
                  >
                    Convert to Binding
                  </button>
                  <button
                    onClick={handleConvertToSoulDeed}
                    disabled={isLoading}
                    style={{
                      padding: '12px 16px',
                      background: 'linear-gradient(135deg, #4338CA, #6366F1)',
                      border: '1px solid #818CF8',
                      borderRadius: '8px',
                      color: '#FFFFFF',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)',
                      opacity: isLoading ? 0.6 : 1
                    }}
                  >
                    Convert to Soul Deed
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {!isApproved && (
          <div style={{
            maxWidth: '900px',
            margin: '40px auto',
            padding: '24px',
            background: 'rgba(0, 0, 0, 0.7)',
            borderRadius: '12px',
            border: '2px solid rgba(251, 191, 36, 0.3)',
            textAlign: 'center'
          }}>
            <button
              onClick={handleApprove}
              disabled={isPending}
              style={{
                padding: '16px 32px',
                background: 'linear-gradient(135deg, #A16207, #D97706, #F59E0B)',
                border: '2px solid #FBBF24',
                borderRadius: '12px',
                color: '#FFFFFF',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: isPending ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s',
                boxShadow: '0 4px 12px rgba(251, 191, 36, 0.4)',
                opacity: isPending ? 0.6 : 1
              }}
            >
              {isPending ? 'APPROVING...' : 'APPROVE CONTRACT'}
            </button>
            <div style={{ color: '#FCD34D', fontSize: '14px', marginTop: '12px' }}>
              Approve the contract first to perform sacrifices
            </div>
          </div>
        )}

        {/* Cultist Selection */}
        {true && (
          <div className="cultist-container" style={{
            background: 'rgba(0, 0, 0, 0.7)',
            borderRadius: '16px',
            padding: '32px',
            border: '2px solid rgba(220, 38, 38, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
          }}>
            <h2 style={{
              fontFamily: 'Kings Cross',
              fontWeight: 'normal',
              fontSize: '2.5rem',
              color: '#DC2626',
              textAlign: 'center',
              marginBottom: '24px',
              margin: 0,
              display: 'inline-block',
              width: '100%'
            }}>Offer Cultist for Demon Ritual</h2>
            <div className="cultist-grid">
              {cultists && cultists.length > 0 ? (
                cultists.slice(0, 12).map((cultist) => (
                  <CultistCard
                    key={cultist.id}
                    cultist={cultist}
                    isSelected={selectedCultist?.id === cultist.id}
                    onClick={() => setSelectedCultist(selectedCultist?.id === cultist.id ? null : cultist)}
                    disabled={isLoading}
                  />
                ))
              ) : (
                <div style={{
                  gridColumn: '1 / -1',
                  textAlign: 'center',
                  color: '#999',
                  padding: '20px',
                  fontStyle: 'italic'
                }}>
                  {cultistsLoading ? 'Loading cultists...' : 'No cultists available or wallet not connected'}
                </div>
              )}
            </div>
          </div>
        )}
        </div>
      </div>

      {/* Reward Modal */}
      <AnimatePresence>
        {showReward && lastSacrificeResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
              backgroundColor: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(4px)',
              zIndex: 9999
            }}
            onClick={() => setShowReward(false)}
          >
            <div
              className={`reward-container ${
                lastSacrificeResult.success && lastSacrificeResult.rewards?.[0]?.type === 'cosmetic'
                  ? 'reward-container-legendary'
                  : 'reward-container-common'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {lastSacrificeResult.success && lastSacrificeResult.rewards?.length > 0 && (
                <>
                  <div className="reward-success-message">
                    Success! The Maw Accepts Your Offering and Rewards You With...
                  </div>

                  <div className="reward-item">
                    <div className="reward-glow glow-legendary" />
                    {(() => {
                      const reward = lastSacrificeResult.rewards[0];
                      const cosmeticId = reward.typeId ?? reward.id;
                      const isCosmetic = reward.type === 'cosmetic' || (cosmeticId >= 1000 && cosmeticId < 6000);

                      if (isCosmetic && cosmeticId) {
                        const imageUrl = `https://rotandritual.work/previews/${cosmeticId}.jpg`;
                        return (
                          <img
                            src={imageUrl}
                            alt={reward.name}
                            className="reward-image"
                            onError={(e) => {
                              if (e.target.src.includes('.jpg')) {
                                e.target.src = e.target.src.replace('.jpg', '.gif');
                              }
                            }}
                          />
                        );
                      }

                      return (
                        <div style={{ fontSize: '200px', zIndex: 2, position: 'relative' }}>
                          ✨
                        </div>
                      );
                    })()}
                    <div className="reward-shimmer" />
                  </div>

                  <div className="reward-info">
                    <div className="reward-name">
                      {lastSacrificeResult.rewards[0].name}
                      {lastSacrificeResult.rewards[0].quantity > 1 && ` ×${lastSacrificeResult.rewards[0].quantity}`}
                    </div>
                    {lastSacrificeResult.rewards[0].type === 'cosmetic' && (() => {
                      const id = lastSacrificeResult.rewards[0].typeId ?? lastSacrificeResult.rewards[0].id;
                      const slot = Math.floor(id / 1000);
                      const slotNames = { 1: 'Head', 2: 'Face', 3: 'Body', 4: 'Fur', 5: 'Background' };
                      return (
                        <div style={{
                          fontSize: '14px',
                          opacity: 0.8,
                          marginTop: '4px',
                          color: 'white',
                          textTransform: 'uppercase',
                          letterSpacing: '1px'
                        }}>
                          ({slotNames[slot] || 'Unknown'})
                        </div>
                      );
                    })()}
                    <div className="reward-rarity text-legendary">
                      {lastSacrificeResult.rewards[0].type === 'cosmetic' ? 'LEGENDARY' : 'REWARD'}
                    </div>
                  </div>
                </>
              )}

              {!lastSacrificeResult.success && (
                <>
                  <div className="reward-item">
                    <div className="reward-glow glow-common" />
                    <img
                      src="/images/items/glass-shards.png"
                      alt="Glass Shards"
                      className="reward-image"
                      style={{ width: '240px', height: '240px', objectFit: 'contain', opacity: 0.8 }}
                    />
                    <div className="reward-shimmer" />
                  </div>

                  <div className="reward-info">
                    <div className="reward-name">Nothing but Glass Shards...</div>
                    <div className="reward-rarity text-common">
                      FAILED
                    </div>
                  </div>
                </>
              )}

              <div className="dismiss-hint">Click anywhere to continue</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/80 border-t border-white/10 backdrop-blur supports-[backdrop-filter]:bg-black/60 z-40">
        <div className="max-w-6xl mx-auto p-4">

          {/* Current offering summary - compact */}
          {(canSacrificeCaps || canConvertShards || canSummonDemon) && (
            <div className="mb-4 text-center">
              <div className="text-amber-300 font-bold text-sm mb-1">Current Offering:</div>
              <div className="text-white text-sm flex flex-wrap justify-center gap-2">
                {selected[ITEM.RUSTED_CAP] > 0 && (
                  <span className="bg-red-900/50 px-2 py-1 rounded">🍾 {selected[ITEM.RUSTED_CAP]} Caps</span>
                )}
                {selected[ITEM.GLASS_SHARD] > 0 && (
                  <span className="bg-blue-900/50 px-2 py-1 rounded">
                    🔷 {selected[ITEM.GLASS_SHARD]} Shards
                    <span className="ml-2 text-white/70 text-xs">
                      (→ {Math.floor(selected[ITEM.GLASS_SHARD]/5)} Caps · {Math.floor(selected[ITEM.GLASS_SHARD]/50)} Binding · {Math.floor(selected[ITEM.GLASS_SHARD]/100)} Deed)
                    </span>
                  </span>
                )}
                {useBindingContract && (
                  <span className="bg-purple-900/50 px-2 py-1 rounded">📜 Binding</span>
                )}
                {useSoulDeed && (
                  <span className="bg-indigo-900/50 px-2 py-1 rounded">💀📜 Soul Deed</span>
                )}
                {selectedCultist && (
                  <span className="bg-gray-900/50 px-2 py-1 rounded">👤 Cultist #{selectedCultist.id}</span>
                )}
              </div>
            </div>
          )}

          {/* Approval needed */}
          {!isApproved && (canSacrificeCaps || canSummonDemon || canConvertShards) && (
            <div className="text-center mb-4">
              <button
                onClick={handleApprove}
                disabled={isLoading}
                className="px-6 py-3 bg-yellow-900/90 hover:bg-yellow-800/90 border-2 border-yellow-400 rounded-lg text-white font-bold transition-all shadow-lg"
              >
                {isLoading ? 'APPROVING...' : '⚡ APPROVE CONTRACT'}
              </button>
              <div className="text-yellow-300 text-xs mt-1">
                Approve the contract first to perform sacrifices
              </div>
            </div>
          )}


        </div>
      </div>

    </div>
  );
}