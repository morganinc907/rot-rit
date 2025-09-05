import { useAccount, useReadContract } from "wagmi";
import useContracts from "./useContracts.tsx";

/**
 * Hook for reading NFT balances with all relics
 */

// Same ABI structure as useKeyShop
const RELICS_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'account', type: 'address', internalType: 'address' },
      { name: 'id', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
  },
];

const RELIC_CATALOG = {
  0: { name: "Rusted Cap", rarity: "common" },        // 11 tokens - sacrificeable
  2: { name: "Lantern Fragment", rarity: "uncommon" }, // 1 token
  3: { name: "Worm-eaten Mask", rarity: "rare" },     // 11 tokens
  5: { name: "Ash Vial", rarity: "rare" },            // 4 tokens
  6: { name: "Glass Shards", rarity: "cosmetic" },    // 6 tokens - convertible to rusted caps
  7: { name: "Soul Deed", rarity: "puzzle" },         // 3 tokens - boolean flag for rare demon
  8: { name: "Bone Dagger", rarity: "rare" },         // 10 tokens
  9: { name: "Binding Contract", rarity: "puzzle" },  // 4 tokens - boolean flag for legendary demon
};

export default function useNFTBalances() {
  const { address } = useAccount();
  const { contracts, isSupported } = useContracts();

  const RELICS_ADDRESS = contracts?.Relics;


  // Read balance for all relic types
  const relicIds = Object.keys(RELIC_CATALOG).map(Number);
  
  const relicQueries = relicIds.map(id => 
    useReadContract({
      address: RELICS_ADDRESS,
      abi: RELICS_ABI,
      functionName: 'balanceOf',
      args: address ? [address, id] : undefined,
      query: {
        enabled: !!address && !!RELICS_ADDRESS && isSupported,
        refetchInterval: 5000,
        staleTime: 0,
      },
    })
  );

  // Build relics array from all the queries
  const relics = [];
  relicQueries.forEach((query, index) => {
    const relicId = relicIds[index];
    const balance = query.data ? Number(query.data) : 0;
    
    if (balance > 0) {
      relics.push({
        id: relicId,
        quantity: balance,
        name: RELIC_CATALOG[relicId].name,
        rarity: RELIC_CATALOG[relicId].rarity
      });
    }
  });


  // Refetch function for all queries
  const refetchAll = () => {
    relicQueries.forEach(query => query.refetch?.());
  };

  return {
    raccoons: [],
    demons: [],
    relics,
    loading: false,
    refetch: refetchAll,
  };
}