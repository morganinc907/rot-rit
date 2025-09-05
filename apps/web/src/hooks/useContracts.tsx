import { useState, useEffect } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { getMawAddress, getRelicsAddress, getAllAddresses } from '../sdk/contracts';
import { CHAIN } from '@rot-ritual/addresses';

export default function useContracts() {
  const chainId = useChainId();
  const { isConnected } = useAccount();
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

        // Get all addresses with runtime guards
        const addresses = getAllAddresses(chainId);
        const mawAddress = getMawAddress(chainId); // This will log and guard against old address
        const relicsAddress = getRelicsAddress(chainId);
        
        const contractConfig = {
          Relics: relicsAddress,
          Raccoons: addresses.Raccoons,
          Cultists: addresses.Cultists,
          Demons: addresses.Demons,
          Cosmetics: addresses.Cosmetics,
          KeyShop: addresses.KeyShop,
          MawSacrifice: mawAddress,
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
  }, [chainId]);

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