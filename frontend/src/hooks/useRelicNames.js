/**
 * Relic Names Hook
 * Fetches and caches human-readable names for relic token IDs
 */
import { useReadContracts, useChainId } from 'wagmi';
import { useMemo } from 'react';
import { ADDRS } from '@rot-ritual/addresses';
import canonicalAbis from '../abis/canonical-abis.json';

export function useRelicNames(tokenIds = []) {
  const chainId = useChainId();
  const addresses = ADDRS[chainId];

  // Create contract calls for each unique token ID
  const contracts = useMemo(() => {
    if (!addresses?.MawSacrifice || !tokenIds.length) return [];
    
    // Remove duplicates and create contracts array
    const uniqueIds = [...new Set(tokenIds)];
    return uniqueIds.map(tokenId => ({
      address: addresses.MawSacrifice,
      abi: canonicalAbis.MawSacrifice,
      functionName: 'idLabel',
      args: [tokenId],
    }));
  }, [addresses?.MawSacrifice, tokenIds]);

  // Fetch all names at once
  const { data: namesData, isLoading, error } = useReadContracts({
    contracts,
    query: {
      enabled: contracts.length > 0,
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    }
  });

  // Create a mapping of tokenId to name
  const nameMapping = useMemo(() => {
    if (!namesData || !tokenIds.length) return {};
    
    const uniqueIds = [...new Set(tokenIds)];
    const mapping = {};
    
    uniqueIds.forEach((tokenId, index) => {
      const result = namesData[index];
      if (result && result.status === 'success' && result.result) {
        mapping[tokenId] = result.result;
      } else {
        // Fallback to generic name if contract call fails
        mapping[tokenId] = `Relic ${tokenId}`;
      }
    });
    
    return mapping;
  }, [namesData, tokenIds]);

  // Helper function to get name for a specific token ID
  const getRelicName = (tokenId) => {
    return nameMapping[tokenId] || `Relic ${tokenId}`;
  };

  // Helper function to format display with ID and name
  const formatRelicDisplay = (tokenId) => {
    const name = getRelicName(tokenId);
    return `#${tokenId} ${name}`;
  };

  return {
    nameMapping,
    getRelicName,
    formatRelicDisplay,
    isLoading,
    error,
    hasNames: Object.keys(nameMapping).length > 0
  };
}