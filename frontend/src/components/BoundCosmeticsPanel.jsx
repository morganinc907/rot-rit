import React, { useState, useEffect } from 'react';
import { useCosmeticsV2 } from '../hooks/useCosmeticsV2';
import { useConfig, useAccount } from 'wagmi';
import { readContract, writeContract } from '@wagmi/core';
import { decodeAbiParameters } from 'viem';
import { useContracts } from '../hooks/useContracts';
import { useCosmeticsAddress } from '../hooks/useCosmetics';
import { ethers } from 'ethers';

const SLOT_NAMES = {
  0: { name: "HEAD", icon: "👑", color: "text-blue-400" },
  1: { name: "FACE", icon: "👀", color: "text-green-400" },
  2: { name: "BODY", icon: "👕", color: "text-purple-400" },
  3: { name: "FUR", icon: "🎨", color: "text-yellow-400" },
  4: { name: "BACKGROUND", icon: "🌟", color: "text-pink-400" },
};

// Add the ABI we need for reading wardrobe
const COSMETICS_V2_ABI = [
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
  },
  {
    name: 'getWardrobePagePacked',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'raccoonId', type: 'uint256' },
      { name: 'slot', type: 'uint8' },
      { name: 'offset', type: 'uint256' },
      { name: 'limit', type: 'uint256' }
    ],
    outputs: [
      { name: 'data', type: 'bytes' },
      { name: 'totalCount', type: 'uint256' }
    ],
  },
  {
    name: 'getEquippedCosmetics',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'raccoonId', type: 'uint256' }],
    outputs: [
      { name: 'headTypeId', type: 'uint256' },
      { name: 'faceTypeId', type: 'uint256' },
      { name: 'bodyTypeId', type: 'uint256' },
      { name: 'colorTypeId', type: 'uint256' },
      { name: 'backgroundTypeId', type: 'uint256' }
    ],
  },
  {
    name: 'equipCosmetic',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'raccoonId', type: 'uint256' },
      { name: 'slot', type: 'uint8' },
      { name: 'itemIndex', type: 'uint256' }
    ],
    outputs: [],
  },
];

const BoundCosmeticsPanel = ({ raccoonId, isOpen, onClose, availableCosmetics = [] }) => {
  console.log('🎨 BoundCosmeticsPanel rendered:', { raccoonId, isOpen, availableCosmeticsCount: availableCosmetics.length });

  const { equipCosmetic } = useCosmeticsV2();
  const config = useConfig();
  const { address: account } = useAccount();
  const { address: cosmeticsAddressFromHook } = useCosmeticsAddress();

  // Use address from hook (should work with new chain-first resolution)
  const cosmeticsAddress = cosmeticsAddressFromHook;

  const [boundCosmetics, setBoundCosmetics] = useState({});
  const [equippedCosmetics, setEquippedCosmetics] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(0);

  // Fetch bound cosmetics for this raccoon
  const fetchBoundCosmetics = async () => {
    if (!raccoonId || !cosmeticsAddress) return;
    
    setLoading(true);
    try {
      console.log(`🔍 Fetching bound cosmetics for raccoon ${raccoonId}...`);
      
      const cosmeticsBySlot = {};
      const equipped = {};
      
      // Get equipped cosmetics first
      try {
        const equippedData = await readContract(config, {
          address: cosmeticsAddress,
          abi: COSMETICS_V2_ABI,
          functionName: 'getEquippedCosmetics',
          args: [BigInt(raccoonId)]
        });
        
        equipped.head = Number(equippedData[0]) || 0;
        equipped.face = Number(equippedData[1]) || 0;
        equipped.body = Number(equippedData[2]) || 0;
        equipped.fur = Number(equippedData[3]) || 0;
        equipped.background = Number(equippedData[4]) || 0;
      } catch (e) {
        console.error('Error fetching equipped cosmetics:', e);
      }
      
      // Since getWardrobePagePacked doesn't exist, scan for bound cosmetics by checking balances
      console.log(`📋 Scanning for bound cosmetics for raccoon ${raccoonId}...`);
      console.log(`🔍 Using account: ${account}`);
      console.log(`🔍 Using cosmetics address: ${cosmeticsAddress}`);
      console.log(`🔍 Hook provided address: ${cosmeticsAddressFromHook}`);
      
      // Initialize empty arrays for each slot
      for (let slot = 0; slot < 5; slot++) {
        cosmeticsBySlot[slot] = [];
      }
      
      // Use available cosmetics list if provided, otherwise scan range
      const typeIdsToCheck = availableCosmetics.length > 0
        ? availableCosmetics.map(c => c.id).filter(id => id > 0) // Use actual cosmetic IDs from the list
        : Array.from({ length: 5001 }, (_, i) => i + 1000); // Fallback: scan 1000-6000

      console.log(`🔍 Checking ${typeIdsToCheck.length} cosmetic type IDs for bound versions...`);

      for (const typeId of typeIdsToCheck) {
        try {
          // Generate the bound ID using the correct hash method (matches contract logic)
          const packed = ethers.solidityPacked(
            ["string", "uint256", "uint256"], 
            ["BOUND", typeId, raccoonId]
          );
          const hashId = BigInt(ethers.keccak256(packed));
          const BOUND_ID_OFFSET = 1000000000n;
          const maxUint256 = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');
          const boundId = (hashId + BOUND_ID_OFFSET) % maxUint256;
          
          // Check if user owns this bound cosmetic
          const balance = await readContract(config, {
            address: cosmeticsAddress,
            abi: [
              {
                name: 'balanceOf',
                type: 'function', 
                stateMutability: 'view',
                inputs: [
                  { name: 'account', type: 'address' },
                  { name: 'id', type: 'uint256' }
                ],
                outputs: [{ name: '', type: 'uint256' }]
              }
            ],
            functionName: 'balanceOf',
            args: [account, boundId]
          });

          if (Number(balance) > 0) {
            console.log(`✅ Found bound cosmetic: type ${typeId} -> bound ID ${boundId}`);
            
            // Get cosmetic info
            try {
              const info = await readContract(config, {
                address: cosmeticsAddress,
                abi: COSMETICS_V2_ABI,
                functionName: 'getCosmeticInfo',
                args: [BigInt(typeId)]
              });

              const slot = Number(info[4]);
              console.log(`📍 Cosmetic ${typeId} info:`, {
                name: info[0],
                slot: slot,
                rarity: Number(info[3])
              });
              
              cosmeticsBySlot[slot].push({
                baseTypeId: Number(typeId),
                boundId: boundId.toString(),
                boundAt: Date.now(), // We don't have the actual timestamp
                name: info[0] || `Cosmetic #${typeId}`,
                imageURI: info[1] || '',
                rarity: Number(info[3]) || 0,
                slot: slot,
                active: info[5] || false,
              });
              
              console.log(`✅ Added to slot ${slot}:`, cosmeticsBySlot[slot]);
            } catch (e) {
              console.error(`Error getting info for cosmetic ${typeId}:`, e);
            }
          } else {
            // Only log for type 4 to avoid spam
            if (typeId === 4) {
              console.log(`❌ Type ${typeId} balance: ${balance} (expected > 0)`);
            }
          }
        } catch (e) {
          // Ignore errors for non-existent cosmetic types
        }
      }
      
      setBoundCosmetics(cosmeticsBySlot);
      setEquippedCosmetics(equipped);
      
      console.log('✅ Bound cosmetics by slot:', cosmeticsBySlot);
      console.log('✅ Equipped cosmetics:', equipped);
      
    } catch (error) {
      console.error('Error fetching bound cosmetics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && raccoonId) {
      fetchBoundCosmetics();
    }
  }, [isOpen, raccoonId]);

  const handleEquipCosmetic = async (slot, itemIndex) => {
    try {
      setLoading(true);
      
      // Call the contract directly instead of using the potentially broken hook
      const result = await writeContract(config, {
        address: cosmeticsAddress,
        abi: [
          {
            name: 'equipCosmetic',
            type: 'function',
            stateMutability: 'nonpayable',
            inputs: [
              { name: 'raccoonId', type: 'uint256' },
              { name: 'slot', type: 'uint8' },
              { name: 'itemIndex', type: 'uint256' }
            ],
            outputs: []
          }
        ],
        functionName: 'equipCosmetic',
        args: [BigInt(raccoonId), slot, BigInt(itemIndex)]
      });
      
      // Show success message
      alert(`✅ COSMETIC EQUIPPED! Transaction: ${result}`);
      
      // Refresh data after equipping
      await fetchBoundCosmetics();
      
    } catch (error) {
      alert(`❌ FAILED TO EQUIP: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const currentSlotCosmetics = boundCosmetics[selectedSlot] || [];
  const hasCosmetics = Object.values(boundCosmetics).some(slot => slot.length > 0);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-red-500/30 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-red-400">
            🦝 Raccoon #{raccoonId} - Bound Cosmetics
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl"
          >
            ✕
          </button>
        </div>

        {loading && (
          <div className="text-center py-8">
            <div className="text-lg text-yellow-400">Loading bound cosmetics...</div>
          </div>
        )}

        {!loading && !hasCosmetics && (
          <div className="text-center py-8">
            <div className="text-lg text-gray-400">No bound cosmetics found</div>
            <div className="text-sm text-gray-500 mt-2">
              Bind some cosmetics to this raccoon to see them here
            </div>
          </div>
        )}

        {!loading && hasCosmetics && (
          <>
            {/* Slot Tabs */}
            <div className="flex gap-2 mb-6 flex-wrap">
              {Object.entries(SLOT_NAMES).map(([slotNum, slot]) => {
                const slotInt = parseInt(slotNum);
                const count = boundCosmetics[slotInt]?.length || 0;
                
                return (
                  <button
                    key={slotNum}
                    onClick={() => setSelectedSlot(slotInt)}
                    className={`px-4 py-2 rounded-lg border transition-colors ${
                      selectedSlot === slotInt
                        ? 'bg-red-600 border-red-500 text-white'
                        : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-gray-500'
                    }`}
                  >
                    <span className="mr-2">{slot.icon}</span>
                    {slot.name}
                    {count > 0 && (
                      <span className="ml-2 px-2 py-1 text-xs bg-red-500 rounded-full">
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Selected Slot Content */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-4">
                {SLOT_NAMES[selectedSlot].icon} {SLOT_NAMES[selectedSlot].name} Slot
              </h3>

              {currentSlotCosmetics.length === 0 ? (
                <div className="text-gray-400 text-center py-8">
                  No bound cosmetics in this slot
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {currentSlotCosmetics.map((cosmetic, index) => (
                    <div
                      key={`${cosmetic.boundId}-${index}`}
                      className="bg-gray-700 rounded-lg p-4 border border-gray-600"
                    >
                      {/* Cosmetic Image */}
                      {cosmetic.imageURI && (
                        <div className="w-full h-32 bg-gray-800 rounded mb-3 flex items-center justify-center overflow-hidden">
                          <img
                            src={cosmetic.imageURI}
                            alt={cosmetic.name}
                            className="max-w-full max-h-full object-contain"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        </div>
                      )}

                      {/* Cosmetic Info */}
                      <div className="text-white">
                        <h4 className="font-semibold mb-1">{cosmetic.name}</h4>
                        <div className="text-sm text-gray-400 mb-2">
                          ID: {cosmetic.baseTypeId}
                        </div>
                        <div className="text-xs text-gray-500 mb-3">
                          Bound ID: {cosmetic.boundId}
                        </div>
                        <div className="text-xs text-gray-500 mb-3">
                          Bound: {new Date(cosmetic.boundAt * 1000).toLocaleDateString()}
                        </div>

                        {/* Rarity */}
                        {cosmetic.rarity !== undefined && (
                          <div className="text-xs mb-3">
                            <span className={`px-2 py-1 rounded ${
                              cosmetic.rarity === 0 ? 'bg-gray-600 text-gray-300' :
                              cosmetic.rarity === 1 ? 'bg-green-600 text-white' :
                              cosmetic.rarity === 2 ? 'bg-blue-600 text-white' :
                              cosmetic.rarity === 3 ? 'bg-purple-600 text-white' :
                              'bg-orange-600 text-white'
                            }`}>
                              Rarity: {cosmetic.rarity}
                            </span>
                          </div>
                        )}

                        {/* Equip Button */}
                        <button
                          onClick={() => handleEquipCosmetic(selectedSlot, index)}
                          disabled={loading}
                          className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded transition-colors"
                        >
                          {loading ? 'Equipping...' : 'Equip'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BoundCosmeticsPanel;