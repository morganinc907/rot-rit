import { useState, useEffect, useCallback } from 'react';
import { useAccount, useReadContract, useReadContracts, useChainId } from 'wagmi';
import { getCosmeticsAddress } from '../sdk/addresses';
import { useContracts } from './useContracts';

// Mock ABI - replace with real Cosmetics ABI
const COSMETICS_ABI = [
  {
    name: 'getMonthlySetCosmetics',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'setId', type: 'uint256', internalType: 'uint256' }],
    outputs: [{ name: '', type: 'uint256[]', internalType: 'uint256[]' }],
  },
  {
    name: 'getCosmeticTypeInfo',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'cosmeticId', type: 'uint256', internalType: 'uint256' }],
    outputs: [
      { name: 'name', type: 'string', internalType: 'string' },
      { name: 'imageURI', type: 'string', internalType: 'string' },
      { name: 'rarity', type: 'uint8', internalType: 'uint8' },
      { name: 'monthlySetId', type: 'uint256', internalType: 'uint256' },
      { name: 'maxSupply', type: 'uint256', internalType: 'uint256' },
      { name: 'currentSupply', type: 'uint256', internalType: 'uint256' },
    ],
  },
  {
    name: 'currentMonthlySetId',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
  },
];

export default function useCosmetics() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const COSMETICS_ADDRESS = getCosmeticsAddress(chainId);
  const [cosmetics, setCosmetics] = useState([]);
  const [loading, setLoading] = useState(false);

  // Read current monthly set ID
  const { data: currentSetId } = useReadContract({
    address: COSMETICS_ADDRESS,
    abi: COSMETICS_ABI,
    functionName: 'currentMonthlySetId',
    query: {
      enabled: isConnected,
    },
  });

  // Read cosmetics for current set
  const { data: cosmeticIds } = useReadContract({
    address: COSMETICS_ADDRESS,
    abi: COSMETICS_ABI,
    functionName: 'getMonthlySetCosmetics',
    args: currentSetId ? [currentSetId] : [1n],
    query: {
      enabled: isConnected,
    },
  });

  const fetchCosmeticsData = useCallback(async () => {
    if (!cosmeticIds || cosmeticIds.length === 0) {
      // Use mock data when contracts not available
      setCosmetics([
        {
          id: 1,
          name: 'Ice Crown',
          imageURI: '/cosmetics/ice-crown.png',
          rarity: 4,
          monthlySetId: 1,
          maxSupply: 10,
          currentSupply: 3,
        },
        {
          id: 2,
          name: 'Frost Aura',
          imageURI: '/cosmetics/frost-aura.png',
          rarity: 3,
          monthlySetId: 1,
          maxSupply: 50,
          currentSupply: 12,
        },
        {
          id: 3,
          name: 'Shadow Cloak',
          imageURI: '/cosmetics/shadow-cloak.png',
          rarity: 3,
          monthlySetId: 1,
          maxSupply: 50,
          currentSupply: 8,
        },
        {
          id: 4,
          name: 'Snow Goggles',
          imageURI: '/cosmetics/snow-goggles.png',
          rarity: 2,
          monthlySetId: 1,
          maxSupply: 200,
          currentSupply: 67,
        },
        {
          id: 5,
          name: 'Winter Scarf',
          imageURI: '/cosmetics/winter-scarf.png',
          rarity: 1,
          monthlySetId: 1,
          maxSupply: 500,
          currentSupply: 234,
        },
        {
          id: 6,
          name: 'Icicle Earring',
          imageURI: '/cosmetics/icicle-earring.png',
          rarity: 1,
          monthlySetId: 1,
          maxSupply: 500,
          currentSupply: 189,
        },
      ]);
      return;
    }

    setLoading(true);

    try {
      // Prepare contract calls for all cosmetics
      const cosmeticCalls = cosmeticIds.map((id) => ({
        address: COSMETICS_ADDRESS,
        abi: COSMETICS_ABI,
        functionName: 'getCosmeticTypeInfo',
        args: [id],
      }));

      // This would use useReadContracts in real implementation
      // For now, using mock data
      const mockCosmetics = cosmeticIds.map((id, index) => ({
        id: Number(id),
        name: `Cosmetic #${id}`,
        imageURI: `/cosmetics/cosmetic-${id}.png`,
        rarity: Math.floor(Math.random() * 4) + 1,
        monthlySetId: Number(currentSetId || 1),
        maxSupply: [500, 200, 50, 10][Math.floor(Math.random() * 4)],
        currentSupply: Math.floor(Math.random() * 100),
      }));

      setCosmetics(mockCosmetics);
    } catch (error) {
      console.error('Error fetching cosmetics:', error);
    } finally {
      setLoading(false);
    }
  }, [cosmeticIds, currentSetId]);

  useEffect(() => {
    fetchCosmeticsData();
  }, [fetchCosmeticsData]);

  const currentMonthlySet = {
    id: Number(currentSetId || 1),
    name: 'January Collection - Winter Ritual',
    description: 'Embrace the cold with these frostbitten cosmetics',
    endDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000), // 12 days from now
  };

  const getCosmeticById = useCallback((id) => {
    return cosmetics.find(c => c.id === id);
  }, [cosmetics]);

  const getCosmeticsByRarity = useCallback((rarity) => {
    return cosmetics.filter(c => c.rarity === rarity);
  }, [cosmetics]);

  const getTotalSupplyInfo = useCallback(() => {
    const total = {
      legendary: { minted: 0, max: 0 },
      rare: { minted: 0, max: 0 },
      uncommon: { minted: 0, max: 0 },
      common: { minted: 0, max: 0 },
    };

    cosmetics.forEach(c => {
      const key = ['common', 'uncommon', 'rare', 'legendary'][c.rarity - 1];
      if (key) {
        total[key].minted += c.currentSupply;
        total[key].max += c.maxSupply;
      }
    });

    return total;
  }, [cosmetics]);

  return {
    cosmetics,
    currentMonthlySet,
    loading,
    getCosmeticById,
    getCosmeticsByRarity,
    getTotalSupplyInfo,
    refetch: fetchCosmeticsData,
  };
}

// Hook to get Cosmetics address from MAW contract (chain-first pattern)
export function useCosmeticsAddress() {
  const { contracts, maw } = useContracts();
  const mawAddress = maw ?? contracts?.MawSacrifice;

  // Get cosmetics address from MAW contract
  const { data: cosmeticsAddress, isLoading, error } = useReadContract({
    address: mawAddress,
    abi: [
      {
        name: 'cosmetics',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'address' }],
      },
    ],
    functionName: 'cosmetics',
    query: { 
      enabled: !!mawAddress,
      staleTime: 60000, // Cache for 1 minute
    },
  });

  if (!mawAddress) {
    console.log('⚠️ MAW address not available');
    return { address: undefined, isLoading: true, error: 'MAW not available' };
  }

  if (error) {
    console.error('❌ Error fetching cosmetics address from MAW:', error);
  }

  if (cosmeticsAddress) {
    console.log('✅ Cosmetics address from chain:', cosmeticsAddress);
  }

  return {
    address: cosmeticsAddress,
    isLoading,
    error: error?.message,
  };
}