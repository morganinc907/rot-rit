/**
 * Battle-tested chain-first balance reading - follows established pattern
 * Uses configurable token IDs from MAW as source of truth
 */
import { useAccount, useReadContract, useWatchContractEvent } from "wagmi";
import { useEffect } from "react";
import { useContracts } from "./useContracts";
import { useMawConfig } from "./useMawConfig";

// Minimal ABI for reading balances
const relicsAbi = [
  {
    name: 'balanceOfBatch',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'accounts', type: 'address[]' },
      { name: 'ids', type: 'uint256[]' },
    ],
    outputs: [{ name: '', type: 'uint256[]' }],
  },
  {
    name: 'TransferSingle',
    type: 'event',
    inputs: [
      { name: 'operator', type: 'address', indexed: true },
      { name: 'from', type: 'address', indexed: true },
      { name: 'to', type: 'address', indexed: true },
      { name: 'id', type: 'uint256', indexed: false },
      { name: 'value', type: 'uint256', indexed: false },
    ],
  },
  {
    name: 'TransferBatch',
    type: 'event',
    inputs: [
      { name: 'operator', type: 'address', indexed: true },
      { name: 'from', type: 'address', indexed: true },
      { name: 'to', type: 'address', indexed: true },
      { name: 'ids', type: 'uint256[]', indexed: false },
      { name: 'values', type: 'uint256[]', indexed: false },
    ],
  },
] as const;

export function useRelicBalances() {
  const { address: account } = useAccount();
  const { relics } = useContracts();
  const { capId, keyId, fragId, shardId, isLoaded } = useMawConfig();

  // Build token ID array from chain config (source of truth)
  const ids = isLoaded ? [capId, keyId, fragId, shardId] : [];
  const owners = account && isLoaded ? Array(ids.length).fill(account) : [];
  
  const { data, refetch } = useReadContract({
    address: relics,
    abi: relicsAbi,
    functionName: "balanceOfBatch",
    args: [owners, ids],
    query: {
      enabled: !!account && !!relics && isLoaded,
      refetchOnWindowFocus: true,
      staleTime: 30000,
    },
  });

  // Auto-refresh on transfers that affect the user
  useWatchContractEvent({
    address: relics,
    abi: relicsAbi,
    eventName: "TransferSingle",
    onLogs: (logs) => {
      if (!account) return;
      for (const l of logs) {
        const { to, from } = l.args as any;
        if ((to?.toLowerCase?.() === account.toLowerCase()) || (from?.toLowerCase?.() === account.toLowerCase())) {
          refetch();
          break;
        }
      }
    },
    enabled: !!relics && !!account,
  });

  useWatchContractEvent({
    address: relics,
    abi: relicsAbi,
    eventName: "TransferBatch", 
    onLogs: (logs) => {
      if (!account) return;
      for (const l of logs) {
        const { to, from } = l.args as any;
        if ((to?.toLowerCase?.() === account.toLowerCase()) || (from?.toLowerCase?.() === account.toLowerCase())) {
          refetch();
          break;
        }
      }
    },
    enabled: !!relics && !!account,
  });

  // Listen for manual balance refresh events
  useEffect(() => {
    const handleForceRefresh = () => {
      console.log('🔄 Force refreshing balances due to custom event');
      refetch();
    };

    window.addEventListener('forceBalanceRefresh', handleForceRefresh);
    return () => window.removeEventListener('forceBalanceRefresh', handleForceRefresh);
  }, [refetch]);

  const balances = new Map<bigint, bigint>();
  if (Array.isArray(data) && isLoaded) {
    data.forEach((bn, i) => balances.set(ids[i], BigInt(bn as any)));
  }

  // Chain-aligned helper functions using actual config
  const caps = isLoaded ? (balances.get(capId) ?? 0n) : 0n;
  const keys = isLoaded ? (balances.get(keyId) ?? 0n) : 0n;
  const fragments = isLoaded ? (balances.get(fragId) ?? 0n) : 0n;
  const shards = isLoaded ? (balances.get(shardId) ?? 0n) : 0n;

  return {
    balances,
    caps,
    keys,
    fragments,
    shards,
    
    // Helper functions using configured token IDs
    canSacrifice: caps > 0n,
    canConvert: shards >= 5n, // 5 shards -> 1 cap
    
    // Chain state
    isLoaded,
    relicsAddress: relics,
    account,
  };
}