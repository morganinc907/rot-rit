/**
 * Reward Modal Previews Component
 * Shows preview of all possible reward modals from the Maw
 */
import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReadContract, useConfig } from 'wagmi';
import { readContract } from '@wagmi/core';
import { useCosmeticPoolManager } from '../hooks/useCosmeticPoolManager';
import { useCosmeticsAddress } from '../hooks/useCosmetics';
import { getRelicInfo } from '../sdk/contracts';
import { getRarityFromDropChance } from '../utils/raritySystem';

// Item images - fallback to emoji if image not found
const itemImages = {
  0: "/images/items/rusted-caps.png",
  1: "/images/items/rusted-caps.png",
  6: "/images/items/glass-shards.png",
  9: "/images/items/bindiing-contract.png",
  7: "/images/items/soul-deed.png",
};

// Emoji fallbacks
const emoji = {
  0: "🍾",
  1: "🍾",
  6: "🔷",
  9: "📜",
  7: "💀📜",
};

// Helper to get rarity from item type (using centralized rarity system for cosmetics)
const getItemRarity = (itemName, cosmeticId = null, dropRate = null) => {
  // For cosmetics, use centralized rarity system based on drop rate
  if (dropRate !== null) {
    const rarityInfo = getRarityFromDropChance(dropRate);
    return rarityInfo.tier;
  }

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
  if (itemName?.includes('Demon')) return 'legendary';

  return rarityMap[itemName] || 'common';
};

// Get cosmetic slot name from ID
const getCosmeticSlotName = (id) => {
  const slot = Math.floor(id / 1000);
  const slotNames = { 1: 'Head', 2: 'Face', 3: 'Body', 4: 'Fur', 5: 'Background' };
  return slotNames[slot] || 'Unknown';
};

// Cache buster for updated images (set once per session)
const IMAGE_VERSION = Date.now();

// Get cosmetic preview image URL
const getCosmeticImageUrl = (id) => {
  // Use preview images for cosmetics (try jpg first, will fallback to gif if 404)
  // Add cache-busting version to force reload of updated images
  return `https://rotandritual.work/previews/${id}.jpg?v=${IMAGE_VERSION}`;
};

// Get cosmetic preview image URL with gif fallback
const getCosmeticImageUrlWithFallback = (id) => {
  return {
    jpg: `https://rotandritual.work/previews/${id}.jpg`,
    gif: `https://rotandritual.work/previews/${id}.gif`
  };
};

// Reward Modal Component (matches MawNew.jsx styling)
function RewardModal({ reward, onClose }) {
  const rarity = reward.type === 'cosmetic'
    ? getItemRarity(null, reward.id, parseFloat(reward.probability))
    : getItemRarity(reward.name);

  return (
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
      onClick={onClose}
    >
      {/* Floating Reward Container */}
      <div className={`reward-container reward-container-${rarity}`} onClick={(e) => e.stopPropagation()}>
        {/* Success message at top */}
        {reward.type === 'cosmetic' && (
          <div className="reward-success-message">
            Success! The Maw Accepts Your Offering and Rewards You With...
          </div>
        )}

        <div className="reward-item">
          {/* Glow effect based on rarity */}
          <div className={`reward-glow glow-${rarity}`} />

          {/* Reward image */}
          {reward.type === 'cosmetic' ? (
            <img
              src={reward.imageUrl}
              alt={reward.name}
              className="reward-image"
              style={{ width: '240px', height: '240px', objectFit: 'contain' }}
              onError={(e) => {
                // Try gif if jpg fails
                if (e.target.src.includes('.jpg')) {
                  e.target.src = e.target.src.replace('.jpg', '.gif');
                }
              }}
            />
          ) : reward.type === 'shard' ? (
            <img
              src="/images/items/glass-shards.png"
              alt="Glass Shards"
              className="reward-image"
              style={{ width: '240px', height: '240px', objectFit: 'contain', opacity: 0.8 }}
            />
          ) : (
            <div className="reward-image flex items-center justify-center text-6xl">
              {emoji[reward.id] || '✨'}
            </div>
          )}

          {/* Shimmer overlay */}
          <div className="reward-shimmer" />
        </div>

        {/* Reward info */}
        <div className="reward-info">
          <div className="reward-name">
            {reward.name}
            {reward.quantity > 1 && ` ×${reward.quantity}`}
          </div>
          <div className={`reward-rarity text-${rarity}`}>
            {rarity.toUpperCase()}
          </div>
        </div>

        {/* Click to dismiss */}
        <div className="dismiss-hint">Click anywhere to continue</div>
      </div>
    </motion.div>
  );
}

// CosmeticsV2 ABI for getCosmeticInfo
const COSMETICS_ABI = [
  {
    name: 'getCosmeticInfo',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'typeId', type: 'uint256' }],
    outputs: [
      { name: 'name', type: 'string' },
      { name: 'imageURI', type: 'string' },
      { name: 'previewLayerURI', type: 'string' },
      { name: 'rarity', type: 'uint8' },
      { name: 'slot', type: 'uint8' },
      { name: 'active', type: 'bool' },
      { name: 'currentSupply', type: 'uint256' },
      { name: 'maxSupply', type: 'uint256' }
    ],
  }
];

// Hook to fetch cosmetic name
function useCosmeticName(cosmeticId) {
  const cosmeticsAddress = useCosmeticsAddress();

  const { data: cosmeticInfo } = useReadContract({
    address: cosmeticsAddress,
    abi: COSMETICS_ABI,
    functionName: 'getCosmeticInfo',
    args: [cosmeticId],
    query: {
      enabled: !!cosmeticsAddress && !!cosmeticId
    }
  });

  return cosmeticInfo?.[0] || `Cosmetic #${cosmeticId}`;
}

export default function RewardModalPreviews() {
  const { currentPool } = useCosmeticPoolManager();
  const [selectedReward, setSelectedReward] = useState(null);
  const [previewCategory, setPreviewCategory] = useState('cosmetics');
  const [cosmeticNames, setCosmeticNames] = useState({});
  const { address: cosmeticsAddress } = useCosmeticsAddress();
  const config = useConfig();

  // Fetch cosmetic names for all items in the pool
  useEffect(() => {
    if (!currentPool || !currentPool.ids || !cosmeticsAddress || !config) {
      console.log('⏸️ Not fetching cosmetic names:', {
        hasPool: !!currentPool,
        hasIds: !!currentPool?.ids,
        hasAddress: !!cosmeticsAddress,
        hasConfig: !!config
      });
      return;
    }

    console.log('🔍 Fetching cosmetic names for pool:', currentPool.ids);
    console.log('📍 Using cosmetics address:', cosmeticsAddress);

    const fetchNames = async () => {
      const names = {};

      for (const id of currentPool.ids) {
        try {
          const info = await readContract(config, {
            address: cosmeticsAddress,
            abi: COSMETICS_ABI,
            functionName: 'getCosmeticInfo',
            args: [id]
          });

          names[id] = info[0]; // First element is the name
          console.log(`✅ Fetched name for ${id}:`, info[0]);
        } catch (error) {
          console.warn(`Failed to fetch name for cosmetic ${id}:`, error);
          names[id] = `Cosmetic #${id}`;
        }
      }

      console.log('📝 All cosmetic names:', names);
      setCosmeticNames(names);
    };

    fetchNames();
  }, [currentPool, cosmeticsAddress, config]);

  // Build list of all possible rewards
  const allRewards = useMemo(() => {
    const rewards = {
      cosmetics: [],
      failure: [
        {
          id: 6,
          name: 'Nothing but Glass Shards...',
          type: 'shard',
          quantity: 1,
          category: 'Failure Reward'
        }
      ],
      demons: [
        {
          id: 'demon_common',
          name: 'Common Demon',
          type: 'demon',
          quantity: 1,
          category: 'Demon Summon (Placeholder)',
          imageUrl: '/cultist-raccoon.png' // Placeholder until demons implemented
        },
        {
          id: 'demon_rare',
          name: 'Rare Demon (Binding Contract)',
          type: 'demon',
          quantity: 1,
          category: 'Demon Summon (Placeholder)',
          imageUrl: '/cultist-raccoon.png'
        },
        {
          id: 'demon_legendary',
          name: 'Legendary Demon (Soul Deed)',
          type: 'demon',
          quantity: 1,
          category: 'Demon Summon (Placeholder)',
          imageUrl: '/cultist-raccoon.png'
        }
      ]
    };

    // Add cosmetics from current pool
    if (currentPool && currentPool.ids.length > 0) {
      rewards.cosmetics = currentPool.ids.map(id => ({
        id,
        name: cosmeticNames[id] || `${getCosmeticSlotName(id)} Cosmetic #${id}`,
        type: 'cosmetic',
        quantity: 1,
        category: 'Cosmetic Reward',
        imageUrl: getCosmeticImageUrl(id),
        weight: currentPool.weights[currentPool.ids.indexOf(id)],
        probability: ((currentPool.weights[currentPool.ids.indexOf(id)] / currentPool.total) * 100).toFixed(1)
      }));
    }

    return rewards;
  }, [currentPool, cosmeticNames]);

  const currentRewards = allRewards[previewCategory] || [];

  return (
    <div className="dashboard-panel">
      <h3>🎁 Reward Modal Previews</h3>
      <p style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '1rem' }}>
        Preview all possible reward modals from Maw sacrifices
      </p>

      {/* Category Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '1.5rem',
        borderBottom: '2px solid #e5e5e5',
        paddingBottom: '0.5rem'
      }}>
        <button
          onClick={() => setPreviewCategory('cosmetics')}
          style={{
            padding: '0.5rem 1rem',
            background: previewCategory === 'cosmetics' ? '#4f46e5' : '#f3f4f6',
            color: previewCategory === 'cosmetics' ? 'white' : '#374151',
            border: 'none',
            borderRadius: '6px',
            fontWeight: '600',
            cursor: 'pointer',
            fontSize: '0.875rem'
          }}
        >
          Cosmetics ({allRewards.cosmetics.length})
        </button>
        <button
          onClick={() => setPreviewCategory('failure')}
          style={{
            padding: '0.5rem 1rem',
            background: previewCategory === 'failure' ? '#4f46e5' : '#f3f4f6',
            color: previewCategory === 'failure' ? 'white' : '#374151',
            border: 'none',
            borderRadius: '6px',
            fontWeight: '600',
            cursor: 'pointer',
            fontSize: '0.875rem'
          }}
        >
          Failure (Shards)
        </button>
        <button
          onClick={() => setPreviewCategory('demons')}
          style={{
            padding: '0.5rem 1rem',
            background: previewCategory === 'demons' ? '#4f46e5' : '#f3f4f6',
            color: previewCategory === 'demons' ? 'white' : '#374151',
            border: 'none',
            borderRadius: '6px',
            fontWeight: '600',
            cursor: 'pointer',
            fontSize: '0.875rem'
          }}
        >
          Demons (Future)
        </button>
      </div>

      {/* Reward Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '1rem',
        maxHeight: '400px',
        overflowY: 'auto',
        padding: '0.5rem'
      }}>
        {currentRewards.map((reward, index) => {
          const rarity = reward.type === 'cosmetic'
            ? getItemRarity(null, reward.id, parseFloat(reward.probability))
            : getItemRarity(reward.name);

          return (
            <button
              key={reward.id + '_' + index}
              onClick={() => setSelectedReward(reward)}
              style={{
                background: 'linear-gradient(145deg, #f9fafb, #f3f4f6)',
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                padding: '1rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                textAlign: 'center',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)';
                e.currentTarget.style.borderColor = '#4f46e5';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = '#e5e7eb';
              }}
            >
              {/* Image preview */}
              <div style={{
                width: '100%',
                height: '120px',
                marginBottom: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#ffffff',
                borderRadius: '8px',
                overflow: 'hidden'
              }}>
                {reward.type === 'cosmetic' && reward.imageUrl ? (
                  <img
                    src={reward.imageUrl}
                    alt={reward.name}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain'
                    }}
                    onError={(e) => {
                      // Try gif if jpg fails
                      if (e.target.src.includes('.jpg')) {
                        e.target.src = e.target.src.replace('.jpg', '.gif');
                      } else {
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML = '<div style="font-size: 48px">✨</div>';
                      }
                    }}
                  />
                ) : reward.type === 'shard' ? (
                  <img
                    src="/images/items/glass-shards.png"
                    alt="Glass Shards"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain',
                      opacity: 0.7
                    }}
                  />
                ) : reward.type === 'demon' ? (
                  <div style={{ fontSize: '48px' }}>👹</div>
                ) : (
                  <div style={{ fontSize: '48px' }}>{emoji[reward.id] || '✨'}</div>
                )}
              </div>

              {/* Reward name */}
              <div style={{
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#111827',
                marginBottom: '0.25rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {reward.name}
              </div>

              {/* Rarity badge */}
              <div style={{
                display: 'inline-block',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '0.75rem',
                fontWeight: '600',
                background: rarity === 'common' ? '#d1fae5' :
                           rarity === 'uncommon' ? '#dbeafe' :
                           rarity === 'rare' ? '#fef3c7' :
                           rarity === 'epic' ? '#e9d5ff' :
                           rarity === 'legendary' ? '#fecaca' : '#f3f4f6',
                color: rarity === 'common' ? '#065f46' :
                       rarity === 'uncommon' ? '#1e40af' :
                       rarity === 'rare' ? '#92400e' :
                       rarity === 'epic' ? '#6b21a8' :
                       rarity === 'legendary' ? '#991b1b' : '#374151'
              }}>
                {rarity.toUpperCase()}
              </div>

              {/* Probability for cosmetics */}
              {reward.probability && (
                <div style={{
                  fontSize: '0.75rem',
                  color: '#6b7280',
                  marginTop: '0.25rem'
                }}>
                  {reward.probability}% chance
                </div>
              )}
            </button>
          );
        })}
      </div>

      {currentRewards.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '2rem',
          color: '#6b7280',
          fontSize: '0.875rem'
        }}>
          {previewCategory === 'cosmetics'
            ? 'No cosmetics in current pool'
            : `No ${previewCategory} rewards available`}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {selectedReward && (
          <RewardModal
            reward={selectedReward}
            onClose={() => setSelectedReward(null)}
          />
        )}
      </AnimatePresence>

      <style jsx>{`
        /* Reward modal styles - matching MawNew.jsx */
        .reward-container {
          background: linear-gradient(135deg, rgba(20, 20, 30, 0.98), rgba(10, 10, 20, 0.98));
          border: 3px solid rgba(243, 232, 170, 0.6);
          border-radius: 24px;
          padding: 48px;
          max-width: 500px;
          width: 90%;
          position: relative;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5),
                      inset 0 2px 0 rgba(255, 255, 255, 0.1),
                      0 0 80px rgba(243, 232, 170, 0.2);
          backdrop-filter: blur(10px);
          animation: modalSlideIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        /* Rarity-specific border colors */
        .reward-container-common {
          border-color: rgba(156, 163, 175, 0.7);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5),
                      inset 0 2px 0 rgba(255, 255, 255, 0.1),
                      0 0 80px rgba(156, 163, 175, 0.3);
        }

        .reward-container-uncommon {
          border-color: rgba(34, 197, 94, 0.7);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5),
                      inset 0 2px 0 rgba(255, 255, 255, 0.1),
                      0 0 80px rgba(34, 197, 94, 0.3);
        }

        .reward-container-rare {
          border-color: rgba(59, 130, 246, 0.7);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5),
                      inset 0 2px 0 rgba(255, 255, 255, 0.1),
                      0 0 80px rgba(59, 130, 246, 0.3);
        }

        .reward-container-epic {
          border-color: rgba(168, 85, 247, 0.7);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5),
                      inset 0 2px 0 rgba(255, 255, 255, 0.1),
                      0 0 80px rgba(168, 85, 247, 0.3);
        }

        .reward-container-legendary {
          border-color: rgba(251, 191, 36, 0.8);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5),
                      inset 0 2px 0 rgba(255, 255, 255, 0.1),
                      0 0 100px rgba(251, 191, 36, 0.4);
        }

        @keyframes modalSlideIn {
          0% {
            opacity: 0;
            transform: scale(0.8) translateY(40px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .reward-item {
          position: relative;
          width: 260px;
          height: 280px;
          margin: 0 auto 32px;
          padding-top: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 20px;
          overflow: hidden;
        }

        .reward-glow {
          position: absolute;
          inset: -30px;
          border-radius: 50%;
          filter: blur(40px);
          animation: pulse 2s ease-in-out infinite;
          z-index: 0;
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.1); }
        }

        .glow-common {
          background: radial-gradient(circle, rgba(156, 163, 175, 0.4), transparent);
        }

        .glow-uncommon {
          background: radial-gradient(circle, rgba(59, 130, 246, 0.5), transparent);
        }

        .glow-rare {
          background: radial-gradient(circle, rgba(168, 85, 247, 0.6), transparent);
        }

        .glow-epic {
          background: radial-gradient(circle, rgba(236, 72, 153, 0.7), transparent);
        }

        .glow-legendary {
          background: radial-gradient(circle, rgba(251, 191, 36, 0.8), transparent);
        }

        .glow-mythic {
          background: radial-gradient(circle,
            rgba(239, 68, 68, 0.6),
            rgba(251, 191, 36, 0.4),
            transparent);
          animation: mythicPulse 2s ease-in-out infinite;
        }

        @keyframes mythicPulse {
          0%, 100% {
            opacity: 0.6;
            transform: scale(1) rotate(0deg);
          }
          50% {
            opacity: 1;
            transform: scale(1.2) rotate(180deg);
          }
        }

        .reward-image {
          position: relative;
          z-index: 1;
          width: 240px;
          height: 240px;
          object-fit: contain;
          filter: drop-shadow(0 10px 30px rgba(0, 0, 0, 0.5));
          animation: float 3s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }

        .reward-shimmer {
          position: absolute;
          top: -100%;
          left: -100%;
          width: 200%;
          height: 200%;
          background: linear-gradient(
            to bottom right,
            transparent 0%,
            transparent 40%,
            rgba(255, 255, 255, 0.15) 50%,
            transparent 60%,
            transparent 100%
          );
          animation: shimmer 3s ease-in-out infinite;
          pointer-events: none;
          z-index: 2;
          border-radius: 20px;
          overflow: hidden;
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%) translateY(-100%);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translateX(100%) translateY(100%);
            opacity: 0;
          }
        }

        .reward-info {
          text-align: center;
          margin-bottom: 24px;
        }

        .reward-success-message {
          font-size: 14px;
          color: #f3e8aa;
          margin-bottom: 20px;
          padding: 0 20px;
          font-style: italic;
          text-shadow: 0 1px 4px rgba(0, 0, 0, 0.6);
          animation: fadeIn 0.6s ease-out 0.2s both;
          line-height: 1.5;
          max-width: 100%;
          word-wrap: break-word;
        }

        .reward-name {
          font-size: 28px;
          font-weight: 700;
          color: #f3e8aa;
          margin-bottom: 12px;
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.8),
                       0 0 20px rgba(243, 232, 170, 0.3);
          animation: fadeIn 0.6s ease-out 0.3s both;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .reward-rarity {
          display: inline-block;
          padding: 8px 20px;
          border-radius: 20px;
          font-size: 16px;
          font-weight: 700;
          letter-spacing: 2px;
          text-transform: uppercase;
          animation: fadeIn 0.6s ease-out 0.5s both;
        }

        .text-common {
          background: linear-gradient(135deg, #9ca3af, #6b7280);
          color: white;
          box-shadow: 0 4px 12px rgba(107, 114, 128, 0.3);
        }

        .text-uncommon {
          background: linear-gradient(135deg, #22c55e, #16a34a);
          color: white;
          box-shadow: 0 4px 12px rgba(34, 197, 94, 0.4);
        }

        .text-rare {
          background: linear-gradient(135deg, #60a5fa, #3b82f6);
          color: white;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.5);
        }

        .text-epic {
          background: linear-gradient(135deg, #a855f7, #9333ea);
          color: white;
          box-shadow: 0 4px 12px rgba(168, 85, 247, 0.5);
        }

        .text-legendary {
          background: linear-gradient(135deg, #fbbf24, #f59e0b);
          color: #78350f;
          box-shadow: 0 4px 12px rgba(251, 191, 36, 0.6);
        }

        .text-mythic {
          background: linear-gradient(135deg, #ef4444, #fbbf24, #ef4444);
          background-size: 200% 200%;
          animation: gradientShift 3s ease infinite;
          color: white;
          box-shadow: 0 4px 20px rgba(239, 68, 68, 0.6);
        }

        .text-gray-500 {
          background: #6b7280;
          color: white;
          box-shadow: 0 4px 12px rgba(107, 114, 128, 0.3);
        }

        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        .dismiss-hint {
          text-align: center;
          font-size: 14px;
          color: #9ca3af;
          font-style: italic;
          animation: fadeIn 0.6s ease-out 0.7s both;
        }
      `}</style>
    </div>
  );
}
