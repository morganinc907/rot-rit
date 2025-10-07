/**
 * Enhanced NFT Balances hook using SDK
 * Provides type-safe, consistent relic balance tracking
 */

import { useAccount, useReadContract } from "wagmi";
import { useContractSDK } from "./useContractSDK";
import { STANDARD_ABIS, RELIC_CATALOG, getRelicInfo } from "../sdk/contracts";

export default function useNFTBalances() {
  const { address } = useAccount();
  const { contracts, isSupported } = useContractSDK();

  const RELICS_ADDRESS = contracts?.Relics;

  // Get all relic IDs from catalog
  const relicIds = Object.keys(RELIC_CATALOG).map(Number);
  
  // Create balance queries for each relic type
  const relicQueries = relicIds.map(id => 
    useReadContract({
      address: RELICS_ADDRESS,
      abi: STANDARD_ABIS.ERC1155,
      functionName: 'balanceOf',
      args: address ? [address, id] : undefined,
      query: {
        enabled: !!address && !!RELICS_ADDRESS && isSupported,
        refetchInterval: 5000,
        staleTime: 0,
      },
    })
  );

  // Build relics array with enhanced information
  const relics = [];
  relicQueries.forEach((query, index) => {
    const relicId = relicIds[index];
    const balance = query.data ? Number(query.data) : 0;
    
    if (balance > 0) {
      const relicInfo = getRelicInfo(relicId);
      relics.push({
        id: relicId,
        quantity: balance,
        ...relicInfo
      });
    }
  });

  // Refetch function for all queries
  const refetchAll = () => {
    relicQueries.forEach(query => query.refetch?.());
  };

  // Loading state - true if any query is loading
  const loading = relicQueries.some(query => query.isLoading);

  return {
    raccoons: [], // Not implemented yet
    demons: [],   // Not implemented yet
    relics,
    loading,
    refetch: refetchAll,
    
    // Additional SDK helpers
    getRelicBalance: (relicId) => {
      const relic = relics.find(r => r.id === relicId);
      return relic ? relic.quantity : 0;
    },
    
    getRelicsByRarity: (rarity) => {
      return relics.filter(r => r.rarity === rarity);
    },
    
    getRelicsByType: (type) => {
      return relics.filter(r => r.type === type);
    }
  };
}