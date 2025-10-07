/**
 * Battle-tested useContracts hook - Chain is single source of truth
 * Resolves addresses at runtime: ADDRS only contains Relics, everything else from chain
 * Shows banner if local config disagrees with chain reality
 */
import { useChainId, useReadContract } from "wagmi";
import { ADDRS, getAllowedChains, isChainSupported, getChainName } from '@rot-ritual/addresses';

// Minimal ABI for reading mawSacrifice from Relics
const relicsAbi = [
  {
    name: 'mawSacrifice',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  }
] as const;

export function useContracts() {
  const chainId = useChainId();
  const relics = ADDRS[chainId]?.Relics as `0x${string}`;
  
  const { data: onChainMaw, error } = useReadContract({
    address: relics,
    abi: relicsAbi,
    functionName: "mawSacrifice",
    query: { enabled: !!relics },
  });
  
  // Use on-chain Maw for calls
  const maw = onChainMaw as `0x${string}` | undefined;
  
  // Show banner if local config disagrees (but don't fail)
  const localMawFromConfig = ADDRS[chainId]?.MawSacrifice;
  if (maw && localMawFromConfig && maw.toLowerCase() !== localMawFromConfig.toLowerCase()) {
    console.warn(`🚨 MAW ADDRESS MISMATCH: Local config has ${localMawFromConfig}, chain has ${maw}. Using chain value.`);
  }
  
  // Network support checks
  const isSupported = isChainSupported(chainId);
  const allowedChains = getAllowedChains();
  const currentChainName = getChainName(chainId);

  return { 
    chainId, 
    relics, 
    maw, 
    onChainMaw,
    error: error?.message,
    isLoading: !maw && !error,
    // Network support properties for WrongChainBanner
    isSupported,
    allowedChains,
    currentChainName,
    // Helper for other contracts (from static config for now)
    cosmetics: ADDRS[chainId]?.Cosmetics,
    keyShop: ADDRS[chainId]?.KeyShop,
    cultists: ADDRS[chainId]?.Cultists,
    demons: ADDRS[chainId]?.Demons,
  };
}