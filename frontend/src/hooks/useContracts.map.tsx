import { useState, useEffect } from 'react';
import { useAccount, useChainId, usePublicClient } from 'wagmi';
import { getRelicsAddress, getAllAddresses, validateStaticAddresses } from '../sdk/contracts';
import { CHAIN } from '@rot-ritual/addresses';
import canonicalAbis from '../abis/canonical-abis.json';

export default function useContracts() {
  const chainId = useChainId();
  const { isConnected } = useAccount();
  const publicClient = usePublicClient();
  const [contracts, setContracts] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadContracts = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Only support Base Sepolia for now
        if (chainId !== CHAIN.BASE_SEPOLIA) {
          setError(`Unsupported network: ${chainId}. Please switch to Base Sepolia.`);
          setContracts(null);
          return;
        }

        // Ensure we have a public client
        if (!publicClient) {
          setError('No public client available');
          setContracts(null);
          return;
        }

        // Get static addresses (these are trusted bootstrap addresses)
        const addresses = getAllAddresses(chainId);
        const relicsAddress = getRelicsAddress(chainId);
        
        console.log('🔍 [Chain-First] Reading MAW address from Relics contract...');
        
        // ⭐ CHAIN-FIRST: Read MAW address from Relics contract
        const mawAddress = await publicClient.readContract({
          address: relicsAddress as `0x${string}`,
          abi: canonicalAbis.Relics,
          functionName: 'mawSacrifice',
        }) as `0x${string}`;
        
        console.log('✅ [Chain-First] MAW address resolved from chain:', mawAddress);

        // Validate that we got a valid address
        if (!mawAddress || mawAddress === '0x0000000000000000000000000000000000000000') {
          throw new Error('Invalid MAW address returned from Relics contract');
        }

        console.log('🔍 [Chain-First] Reading Cosmetics address from MAW contract...');

        // ⭐ CHAIN-FIRST: Read Cosmetics address from MAW contract
        const cosmeticsAddress = await publicClient.readContract({
          address: mawAddress as `0x${string}`,
          abi: canonicalAbis.MawSacrifice,
          functionName: 'cosmetics',
        }) as `0x${string}`;

        console.log('✅ [Chain-First] Cosmetics address resolved from MAW:', cosmeticsAddress);

        // Validate that we got a valid cosmetics address
        if (!cosmeticsAddress || cosmeticsAddress === '0x0000000000000000000000000000000000000000') {
          throw new Error('Invalid Cosmetics address returned from MAW contract');
        }

        // 🔍 Phase 3: Validate static addresses against chain-first resolution
        validateStaticAddresses({
          mawAddress,
          relicsAddress,
          chainId
        });
        
        const contractConfig = {
          Relics: relicsAddress,
          Raccoons: addresses.Raccoons,
          Cultists: addresses.Cultists,
          Demons: addresses.Demons,
          Cosmetics: cosmeticsAddress, // ⭐ Chain-resolved from MAW, not static
          KeyShop: addresses.KeyShop,
          MawSacrifice: mawAddress, // ⭐ Chain-resolved, not static
          rituals: mawAddress, // Same as mawSacrifice
          raccoonRenderer: addresses.RaccoonRenderer,
          ritualReadAggregator: addresses.RitualReadAggregator,
          chainId: CHAIN.BASE_SEPOLIA,
          keyPrice: "0.002",
          raccoonPrice: "0.0" // Free minting
        };
        
        setContracts(contractConfig);
      } catch (err: any) {
        console.error('Contract loading error:', err);
        setError(err.message);
        setContracts(null);
      } finally {
        setLoading(false);
      }
    };

    loadContracts();
  }, [chainId, publicClient]);

  const isSupported = contracts !== null;
  const isTestnet = chainId === CHAIN.BASE_SEPOLIA;

  return {
    contracts,
    loading,
    error,
    isSupported,
    isLocal: false, // No longer supporting local
    isTestnet,
    chainId,
    network: isTestnet ? 'Base Sepolia' : 'Unsupported'
  };
}