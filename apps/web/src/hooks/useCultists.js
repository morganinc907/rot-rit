import { useState, useEffect, useCallback } from 'react';
import { useAccount, useReadContract, useConfig } from 'wagmi';
import { readContract } from '@wagmi/core';
import useContracts from './useContracts.tsx';

// Raccoons ABI for fetching cultist raccoons
const RACCOONS_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address', internalType: 'address' }],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
  },
  {
    name: 'tokenOfOwnerByIndex',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address', internalType: 'address' },
      { name: 'index', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
  },
  {
    name: 'getState',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256', internalType: 'uint256' }],
    outputs: [{ name: '', type: 'uint8', internalType: 'uint8' }],
  },
  {
    name: 'tokenURI',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256', internalType: 'uint256' }],
    outputs: [{ name: '', type: 'string', internalType: 'string' }],
  },
];

// Helper: fetch metadata JSON from tokenURI
async function fetchMetadata(uri) {
  try {
    if (!uri) return null;
    const cleanUri = uri.replace("ipfs://", "https://ipfs.io/ipfs/");
    const res = await fetch(cleanUri);
    return await res.json();
  } catch (err) {
    console.error("Metadata fetch failed:", err);
    return null;
  }
}

export default function useCultists() {
  const { address, isConnected } = useAccount();
  const { contracts } = useContracts();
  const config = useConfig();
  const [cultists, setCultists] = useState([]);
  const [loading, setLoading] = useState(false);

  // Read raccoon balance (cultists are raccoons in cult state)
  const { data: raccoonCount, refetch: refetchBalance } = useReadContract({
    address: contracts?.Raccoons,
    abi: RACCOONS_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: isConnected && !!address && !!contracts?.Raccoons,
    },
  });

  const fetchCultists = useCallback(async () => {
    if (!address || !isConnected || !contracts?.Raccoons || !raccoonCount) {
      setCultists([]);
      return;
    }

    setLoading(true);

    try {
      console.log('🔍 Checking for cultist raccoons...');
      
      // Get all raccoons you own
      const ownedRaccoons = [];
      for (let i = 0; i < Number(raccoonCount); i++) {
        try {
          const tokenId = await readContract(config, {
            address: contracts.Raccoons,
            abi: RACCOONS_ABI,
            functionName: 'tokenOfOwnerByIndex',
            args: [address, BigInt(i)],
          });
          ownedRaccoons.push(Number(tokenId));
        } catch (error) {
          console.error(`Error getting token ${i}:`, error);
        }
      }
      
      console.log('🦝 Your raccoons:', ownedRaccoons);
      
      // Check each raccoon's state and filter for cultists
      const cultistData = await Promise.all(
        ownedRaccoons.map(async (tokenId) => {
          try {
            // Check if this raccoon is in cult state (state = 1)
            const state = await readContract(config, {
              address: contracts.Raccoons,
              abi: RACCOONS_ABI,
              functionName: 'getState',
              args: [BigInt(tokenId)],
            });
            
            console.log(`🦝 Raccoon #${tokenId} state:`, Number(state));
            
            // Only include raccoons in cult state (state = 1)
            if (Number(state) !== 1) {
              return null;
            }
            
            // Get the actual tokenURI from the contract
            const tokenURI = await readContract(config, {
              address: contracts.Raccoons,
              abi: RACCOONS_ABI,
              functionName: 'tokenURI',
              args: [BigInt(tokenId)],
            });
            
            const metadata = await fetchMetadata(tokenURI);

            const imageUrl = metadata?.image ? 
              metadata.image.replace("ipfs://", "https://ipfs.io/ipfs/") : 
              '/cultist-raccoon.png';
              
            console.log(`✅ Found cultist #${tokenId}:`, metadata?.name);
              
            return {
              id: tokenId,
              name: `${metadata?.name || 'Cult Raccoon'} #${tokenId}`,
              image: imageUrl,
              originalRaccoonId: tokenId,
              isRealCultist: true,
              traits: [
                { trait_type: 'Cult Status', value: 'Active' },
                { trait_type: 'Ritual Power', value: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)] },
                ...(metadata?.attributes || []),
              ],
            };
          } catch (error) {
            console.error(`Error checking raccoon ${tokenId}:`, error);
            return null;
          }
        })
      );

      // Filter out null values (non-cultist raccoons)
      const validCultists = cultistData.filter(cultist => cultist !== null);
      setCultists(validCultists);
    } catch (error) {
      console.error('Error fetching cultists:', error);
      setCultists([]);
    } finally {
      setLoading(false);
    }
  }, [address, isConnected, contracts, raccoonCount, config]);

  useEffect(() => {
    fetchCultists();
  }, [fetchCultists]);

  const getCultistById = useCallback((id) => {
    return cultists.find(c => c.id === id);
  }, [cultists]);

  const getCultistsByRarity = useCallback((rarity) => {
    return cultists.filter(c => 
      c.traits?.find(t => t.trait_type === 'Original Rarity' && t.value === rarity)
    );
  }, [cultists]);

  const getCultistsByPower = useCallback((power) => {
    return cultists.filter(c => 
      c.traits?.find(t => t.trait_type === 'Ritual Power' && t.value === power)
    );
  }, [cultists]);

  const canSacrifice = useCallback((cultistId) => {
    const cultist = getCultistById(cultistId);
    return cultist && cultist.traits?.find(t => t.trait_type === 'Cult Status' && t.value === 'Active');
  }, [getCultistById]);

  return {
    cultists,
    loading,
    cultistCount: cultists.length,
    getCultistById,
    getCultistsByRarity,
    getCultistsByPower,
    canSacrifice,
    refetch: fetchCultists,
    refetchBalance,
  };
}