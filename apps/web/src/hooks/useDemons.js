import { useState, useEffect, useCallback } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import useContracts from './useContracts.tsx';

// Demons ABI for fetching demons
const DEMONS_ABI = [
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

export default function useDemons() {
  const { address, isConnected } = useAccount();
  const { contracts } = useContracts();
  const [demons, setDemons] = useState([]);
  const [loading, setLoading] = useState(false);

  // Read demon balance
  const { data: demonCount, refetch: refetchBalance } = useReadContract({
    address: contracts?.Demons,
    abi: DEMONS_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: isConnected && !!address && !!contracts?.Demons,
    },
  });

  const fetchDemons = useCallback(async () => {
    if (!address || !isConnected || !contracts?.Demons) {
      setDemons([]);
      return;
    }

    setLoading(true);

    try {
      const count = demonCount ? Number(demonCount) : 0;
      
      if (count === 0) {
        setDemons([]);
        setLoading(false);
        return;
      }

      const demonData = [];
      
      for (let i = 0; i < count; i++) {
        try {
          // This would call the actual contract to get token IDs
          // For now, using mock data since we don't have real demons yet
          const tokenId = i + 1; // Mock token ID
          
          const demonInfo = {
            id: tokenId,
            name: `Demon #${tokenId}`,
            image: '/demon.png', // Default demon image
            traits: [
              { trait_type: 'Type', value: 'Demon' },
              { trait_type: 'Power', value: ['Weak', 'Medium', 'Strong'][Math.floor(Math.random() * 3)] },
            ],
          };
          
          demonData.push(demonInfo);
        } catch (error) {
          console.error(`Error fetching demon ${i}:`, error);
        }
      }

      setDemons(demonData);
    } catch (error) {
      console.error('Error fetching demons:', error);
      setDemons([]);
    } finally {
      setLoading(false);
    }
  }, [address, isConnected, contracts?.Demons, demonCount]);

  useEffect(() => {
    fetchDemons();
  }, [fetchDemons]);

  const getDemonById = useCallback((id) => {
    return demons.find(d => d.id === id);
  }, [demons]);

  return {
    demons,
    loading,
    demonCount: demons.length,
    getDemonById,
    refetch: fetchDemons,
    refetchBalance,
  };
}