import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import CosmeticPreview from './CosmeticPreview';
import CosmeticsGrid from './CosmeticsGrid';
import { toast } from 'react-hot-toast';
import { useConfig, useAccount } from 'wagmi';
import { readContract, writeContract } from '@wagmi/core';
import { useCosmeticsAddress } from '../hooks/useCosmetics';
import { ethers } from 'ethers';
import './CosmeticsBrowseTab.css';

/**
 * CosmeticsBrowseTab - Mobile-styled with blockchain integration
 * - Beautiful animations and emoji icons
 * - Full blockchain bind/equip functionality
 * - Fetches equipped and bound cosmetics from contract
 */
const SLOT_CONFIG = [
  { key: 'HEAD',        label: 'Head',        icon: '🎩', slot: 0, contractKey: 'head' },
  { key: 'FACE',        label: 'Face',        icon: '😎', slot: 1, contractKey: 'face' },
  { key: 'BODY',        label: 'Body',        icon: '🧥', slot: 2, contractKey: 'body' },
  { key: 'FUR',         label: 'Fur',         icon: '🐾', slot: 3, contractKey: 'color' },
  { key: 'BACKGROUND',  label: 'Background',  icon: '🌌', slot: 4, contractKey: 'background' },
];

export default function CosmeticsBrowseTab({
  raccoons = [],
  cosmetics = [],
  loading = false,
  bindCosmetic,
  equipCosmetic,
  getWardrobeCosmetics,
  refetchRaccoons,
}) {
  const config = useConfig();
  const { address: account } = useAccount();
  const { address: cosmeticsAddress } = useCosmeticsAddress();

  const [selectedRaccoonId, setSelectedRaccoonId] = useState(null);
  const [selectedRaccoon, setSelectedRaccoon] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [hoverCosmetic, setHoverCosmetic] = useState(null);
  const [previewCosmetics, setPreviewCosmetics] = useState({});
  const [boundCosmeticIds, setBoundCosmeticIds] = useState(new Set());
  const [equippedCosmetics, setEquippedCosmetics] = useState({});

  // Auto-select first raccoon
  useEffect(() => {
    if (raccoons.length > 0 && !selectedRaccoonId) {
      const firstRaccoon = raccoons[0];
      setSelectedRaccoonId(firstRaccoon.id);
      setSelectedRaccoon(firstRaccoon);
    }
  }, [raccoons, selectedRaccoonId]);

  // Update selected raccoon and fetch data
  useEffect(() => {
    if (selectedRaccoonId) {
      const raccoon = raccoons.find(r => r.id === selectedRaccoonId);
      setSelectedRaccoon(raccoon);
      fetchEquippedCosmetics(selectedRaccoonId);
      fetchBoundCosmetics(selectedRaccoonId);
    }
  }, [selectedRaccoonId, raccoons, cosmetics, cosmeticsAddress, account, config]);

  // Fetch equipped cosmetics from blockchain
  const fetchEquippedCosmetics = async (raccoonId) => {
    if (!raccoonId || !cosmeticsAddress || cosmetics.length === 0) return;

    try {
      const equippedTypeIds = await readContract(config, {
        address: cosmeticsAddress,
        abi: [{
          name: 'getEquippedCosmetics',
          type: 'function',
          stateMutability: 'view',
          inputs: [{ name: 'raccoonId', type: 'uint256' }],
          outputs: [{ name: '', type: 'uint256[5]' }]
        }],
        functionName: 'getEquippedCosmetics',
        args: [BigInt(raccoonId)]
      });

      const equipped = {};
      for (let i = 0; i < 5; i++) {
        const typeId = Number(equippedTypeIds[i]);
        if (typeId > 0) {
          const cosmetic = cosmetics.find(c => c.id === typeId);
          if (cosmetic) {
            equipped[SLOT_CONFIG[i].key] = cosmetic;
          }
        }
      }
      setEquippedCosmetics(equipped);
    } catch (error) {
      console.error('Error fetching equipped cosmetics:', error);
    }
  };

  // Fetch bound cosmetics
  const fetchBoundCosmetics = async (raccoonId) => {
    if (!raccoonId || !cosmeticsAddress || !account || cosmetics.length === 0) return;

    const boundIds = new Set();
    const typeIdsToCheck = cosmetics.map(c => c.id).filter(id => id > 0);

    for (const typeId of typeIdsToCheck) {
      try {
        const packed = ethers.solidityPacked(
          ["string", "uint256", "uint256"],
          ["BOUND", typeId, raccoonId]
        );
        const hashId = BigInt(ethers.keccak256(packed));
        const BOUND_ID_OFFSET = 1000000000n;
        const maxUint256 = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');
        const boundId = (hashId + BOUND_ID_OFFSET) % maxUint256;

        const balance = await readContract(config, {
          address: cosmeticsAddress,
          abi: [{
            name: 'balanceOf',
            type: 'function',
            stateMutability: 'view',
            inputs: [
              { name: 'account', type: 'address' },
              { name: 'id', type: 'uint256' }
            ],
            outputs: [{ name: '', type: 'uint256' }]
          }],
          functionName: 'balanceOf',
          args: [account, boundId]
        });

        if (Number(balance) > 0) {
          boundIds.add(typeId);
        }
      } catch (e) {
        // Ignore errors for non-existent cosmetics
      }
    }

    setBoundCosmeticIds(boundIds);
  };

  // Filter cosmetics by selected slot
  const filteredCosmetics = useMemo(() => {
    if (!selectedSlot) return cosmetics;
    const slotNum = SLOT_CONFIG.find(s => s.key === selectedSlot)?.slot;
    return cosmetics.filter(c => c.slot === slotNum);
  }, [cosmetics, selectedSlot]);

  const hasSelection = Object.keys(previewCosmetics).length > 0;

  function handleSlotClick(slotKey) {
    setSelectedSlot(prev => (prev === slotKey ? null : slotKey));
  }

  function handleCosmeticSelect(cosmetic) {
    const key = SLOT_CONFIG.find(s => s.slot === cosmetic.slot)?.key;
    if (!key) return;
    setPreviewCosmetics(prev => ({
      ...prev,
      [key]: cosmetic,
    }));
  }

  async function handleBindAll() {
    const cosmeticsToEquip = Object.values(previewCosmetics).filter(Boolean);
    if (cosmeticsToEquip.length === 0) {
      toast.error('No cosmetics selected');
      return;
    }

    const boundCosmetics = cosmeticsToEquip.filter(c => boundCosmeticIds.has(c.id));
    const unboundCosmetics = cosmeticsToEquip.filter(c => !boundCosmeticIds.has(c.id));

    if (unboundCosmetics.length > 0) {
      const confirmed = window.confirm(
        `${unboundCosmetics.length} cosmetic(s) need to be bound first.\n` +
        `Binding is permanent and cannot be undone. Continue?`
      );
      if (!confirmed) return;

      // Bind cosmetics
      for (const cosmetic of unboundCosmetics) {
        try {
          await bindCosmetic(selectedRaccoonId, cosmetic.id);
          toast.success(`Bound ${cosmetic.name}!`);
        } catch (error) {
          console.error('Error binding cosmetic:', error);
          toast.error(`Failed to bind ${cosmetic.name}`);
        }
      }

      // Refresh bound cosmetics
      await fetchBoundCosmetics(selectedRaccoonId);
    }

    // Equip all (now bound)
    for (const cosmetic of cosmeticsToEquip) {
      try {
        const slotConfig = SLOT_CONFIG.find(s => s.slot === cosmetic.slot);
        if (!slotConfig) continue;

        // Generate boundId
        const packed = ethers.solidityPacked(
          ["string", "uint256", "uint256"],
          ["BOUND", cosmetic.id, selectedRaccoonId]
        );
        const hashId = BigInt(ethers.keccak256(packed));
        const BOUND_ID_OFFSET = 1000000000n;
        const maxUint256 = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');
        const boundId = (hashId + BOUND_ID_OFFSET) % maxUint256;

        await writeContract(config, {
          address: cosmeticsAddress,
          abi: [{
            name: 'equipCosmeticById',
            type: 'function',
            stateMutability: 'nonpayable',
            inputs: [
              { name: 'raccoonId', type: 'uint256' },
              { name: 'slot', type: 'uint8' },
              { name: 'boundId', type: 'uint256' }
            ],
            outputs: []
          }],
          functionName: 'equipCosmeticById',
          args: [BigInt(selectedRaccoonId), slotConfig.slot, boundId]
        });

        toast.success(`Equipped ${cosmetic.name}!`);
      } catch (error) {
        console.error('Error equipping cosmetic:', error);
        toast.error(`Failed to equip ${cosmetic.name}`);
      }
    }

    setPreviewCosmetics({});
    setTimeout(() => {
      fetchEquippedCosmetics(selectedRaccoonId);
      if (refetchRaccoons) refetchRaccoons();
    }, 2000);
  }

  function handleReset() {
    setPreviewCosmetics({});
    setSelectedSlot(null);
  }

  return (
    <div className="cosmetics-browse-tab">
      <div className="browse-content">
        {/* Top Section: Preview */}
        <div className="preview-section">
          {/* Raccoon Selector */}
          <button className="raccoon-selector-button" onClick={() => { /* TODO: open selector modal */ }}>
            <span className="menu-icon">🦝</span>
            <span className="raccoon-label">
              {selectedRaccoon ? `Raccoon #${selectedRaccoon.id}` : 'Select a raccoon'}
            </span>
            <span className="dropdown-icon">▾</span>
          </button>

          {/* Raccoon Preview */}
          <div className="preview-container">
            {selectedRaccoon ? (
              <CosmeticPreview
                className="cosmetic-preview-root"
                raccoon={selectedRaccoon}
                cosmetics={{ ...equippedCosmetics, ...previewCosmetics }}
                previewCosmetic={hoverCosmetic}
                size="xl"
                showGlow={true}
              />
            ) : (
              <div className="preview-empty">
                <div className="empty-icon">✨</div>
                <p>Select a raccoon to begin</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="action-buttons">
            <button
              className="btn-primary"
              onClick={handleBindAll}
              disabled={!hasSelection || !selectedRaccoon}
            >
              Bind & Equip ({Object.keys(previewCosmetics).length})
            </button>
            <button
              className="btn-secondary"
              onClick={handleReset}
              disabled={!hasSelection}
            >
              Reset
            </button>
          </div>

          {/* Wardrobe Slots */}
          <div className="wardrobe-slots-section">
            <h3 className="section-title">Try On Cosmetics</h3>
            <div className="wardrobe-slots">
              {SLOT_CONFIG.map(slot => {
                const equipped = previewCosmetics[slot.key];
                const isActive = selectedSlot === slot.key;
                return (
                  <motion.div
                    key={slot.key}
                    className={`slot-card ${isActive ? 'active' : ''} ${equipped ? 'has-cosmetic' : ''}`}
                    onClick={() => handleSlotClick(slot.key)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {equipped ? (
                      <div className="slot-preview">
                        <img
                          src={equipped.image}
                          alt={equipped.name}
                          className="slot-image"
                        />
                      </div>
                    ) : (
                      <div className="slot-empty">
                        <span className="slot-icon">{slot.icon}</span>
                      </div>
                    )}
                    <div className="slot-label">
                      <span className="slot-name">{slot.label}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {selectedSlot && (
              <div className="filter-indicator">
                <span>
                  Showing: {SLOT_CONFIG.find(s => s.key === selectedSlot)?.label} cosmetics
                </span>
                <button className="clear-filter" onClick={() => setSelectedSlot(null)}>
                  Show All
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Section: Cosmetics Grid */}
        <CosmeticsGrid
          cosmetics={filteredCosmetics}
          selectedSlot={selectedSlot}
          equippedCosmetics={previewCosmetics}
          onCosmeticSelect={handleCosmeticSelect}
          onCosmeticHover={setHoverCosmetic}
          boundCosmeticIds={boundCosmeticIds}
        />
      </div>
    </div>
  );
}
