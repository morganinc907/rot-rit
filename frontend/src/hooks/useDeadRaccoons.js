import { useState, useEffect, useCallback } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { useContracts } from './useContracts';

// Raccoons ABI for fetching dead raccoons (state = 2)
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

export default function useDeadRaccoons() {
  const { address, isConnected } = useAccount();
  const { contracts } = useContracts();
  const [deadRaccoons, setDeadRaccoons] = useState([]);
  const [loading, setLoading] = useState(false);

  // Read raccoon balance
  const { data: raccoonCount, refetch: refetchBalance } = useReadContract({
    address: contracts?.Raccoons,
    abi: RACCOONS_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: isConnected && !!address && !!contracts?.Raccoons,
    },
  });

  const fetchDeadRaccoons = useCallback(async () => {
    if (!address || !isConnected || !contracts?.Raccoons) {
      setDeadRaccoons([]);
      return;
    }

    setLoading(true);

    try {
      const count = raccoonCount ? Number(raccoonCount) : 0;
      
      if (count === 0) {
        setDeadRaccoons([]);
        setLoading(false);
        return;
      }

      const deadRaccoonData = [];
      
      // Check each raccoon's state to find dead ones (state = 2)
      for (let i = 0; i < count; i++) {
        try {
          // For now, return empty array since we might not have dead raccoons yet
          // When we have real dead raccoons, this would check each raccoon's state
          // Similar to how useCultists works but checking for state === 2
        } catch (error) {
          console.error(`Error checking raccoon ${i} state:`, error);
        }
      }

      setDeadRaccoons(deadRaccoonData);
    } catch (error) {
      console.error('Error fetching dead raccoons:', error);
      setDeadRaccoons([]);
    } finally {
      setLoading(false);
    }
  }, [address, isConnected, contracts?.Raccoons, raccoonCount]);

  useEffect(() => {
    fetchDeadRaccoons();
  }, [fetchDeadRaccoons]);

  const getDeadRaccoonById = useCallback((id) => {
    return deadRaccoons.find(r => r.id === id);
  }, [deadRaccoons]);

  return {
    deadRaccoons,
    loading,
    deadRaccoonCount: deadRaccoons.length,
    getDeadRaccoonById,
    refetch: fetchDeadRaccoons,
    refetchBalance,
  };
}