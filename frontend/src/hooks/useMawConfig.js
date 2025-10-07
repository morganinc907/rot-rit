import { useReadContract } from 'wagmi';
import useContracts from './useContracts.tsx';
import canonicalAbis from '../abis/canonical-abis.json';

const MAW_ABI = canonicalAbis.MawSacrifice;

/**
 * Hook to read capId and keyId from MAW contract
 * These IDs are set in the MAW contract and used across the system
 */
export function useMawConfig() {
  const { contracts, isSupported, configLoaded } = useContracts();
  const MAW_ADDRESS = contracts?.MawSacrifice;

  // Read capId from MAW
  const { data: capId, isError: capIdError, isLoading: capIdLoading } = useReadContract({
    address: MAW_ADDRESS,
    abi: MAW_ABI,
    functionName: 'capId',
    query: {
      enabled: !!MAW_ADDRESS && isSupported && configLoaded,
    },
  });

  // Read keyId from MAW
  const { data: keyId, isError: keyIdError, isLoading: keyIdLoading } = useReadContract({
    address: MAW_ADDRESS,
    abi: MAW_ABI,
    functionName: 'keyId',
    query: {
      enabled: !!MAW_ADDRESS && isSupported && configLoaded,
    },
  });

  const isLoaded = !capIdLoading && !keyIdLoading && !!capId && !!keyId && configLoaded;

  console.log('🔧 useMawConfig:', {
    MAW_ADDRESS,
    capId: capId?.toString(),
    keyId: keyId?.toString(),
    isLoaded,
    configLoaded,
    capIdError,
    keyIdError
  });

  return {
    capId,
    keyId,
    isLoaded,
    error: capIdError || keyIdError,
  };
}
