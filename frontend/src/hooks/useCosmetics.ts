import { useReadContract } from 'wagmi';
import { useContracts } from './useContracts';

// Hook to get Cosmetics address from MAW contract (chain-first pattern)
export function useCosmeticsAddress() {
  const { contracts } = useContracts();
  const mawAddress = contracts?.MawSacrifice;

  // Get cosmetics address from MAW contract
  const { data: cosmeticsAddress, isLoading, error } = useReadContract({
    address: mawAddress,
    abi: [
      {
        name: 'cosmetics',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'address' }],
      },
    ],
    functionName: 'cosmetics',
    query: { 
      enabled: !!mawAddress,
      staleTime: 60000, // Cache for 1 minute
    },
  });

  if (!mawAddress) {
    console.log('⚠️ MAW address not available');
    return { address: undefined, isLoading: true, error: 'MAW not available' };
  }

  if (error) {
    console.error('❌ Error fetching cosmetics address from MAW:', error);
  }

  if (cosmeticsAddress) {
    console.log('✅ Cosmetics address from chain:', cosmeticsAddress);
  }

  return {
    address: cosmeticsAddress as `0x${string}` | undefined,
    isLoading,
    error: error?.message,
  };
}

export default useCosmeticsAddress;