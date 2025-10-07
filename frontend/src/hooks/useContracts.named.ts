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

// Minimal ABI for reading cosmetics address from MAW
const mawAbi = [
  {
    name: 'cosmetics',
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

  // Chain-first: Read cosmetics address from MAW contract
  const { data: onChainCosmetics } = useReadContract({
    address: maw,
    abi: mawAbi,
    functionName: "cosmetics",
    query: { enabled: !!maw },
  });

  const cosmetics = onChainCosmetics as `0x${string}` | undefined;
  
  // Show banner if local config disagrees (but don't fail)
  const localMawFromConfig = ADDRS[chainId]?.MawSacrifice;
  if (maw && localMawFromConfig && maw.toLowerCase() !== localMawFromConfig.toLowerCase()) {
    console.warn(`🚨 MAW ADDRESS MISMATCH: Local config has ${localMawFromConfig}, chain has ${maw}. Using chain value.`);
  }

  // Validate cosmetics address against static config
  const localCosmeticsFromConfig = ADDRS[chainId]?.Cosmetics;
  if (cosmetics && localCosmeticsFromConfig && cosmetics.toLowerCase() !== localCosmeticsFromConfig.toLowerCase()) {
    console.warn(`🚨 COSMETICS ADDRESS MISMATCH: Local config has ${localCosmeticsFromConfig}, chain has ${cosmetics}. Using chain value.`);
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
    // Chain-first: Cosmetics address from MAW contract
    cosmetics: cosmetics || ADDRS[chainId]?.Cosmetics, // Fallback to static if chain read fails
    keyShop: ADDRS[chainId]?.KeyShop,
    cultists: ADDRS[chainId]?.Cultists,
    demons: ADDRS[chainId]?.Demons,
    raccoons: ADDRS[chainId]?.Raccoons,
  };
}