import { useState, useEffect } from 'react';
import { useAccount, useChainId } from 'wagmi';

// Import contract addresses based on environment
const getContractAddresses = (chainId) => {
  if (chainId === 1337) {
    // Local development - load from deploy script output
    try {
      const localContracts = require('../contracts-local.json');
      return localContracts;
    } catch (error) {
      console.warn('Local contracts not found. Run `npm run deploy:local` first.');
      return null;
    }
  }
  
  if (chainId === 84532) {
    // Base Sepolia - return the newly deployed contract addresses
    return {
      relics: "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b",
      raccoons: "0x6DB1C2d60579679A82C3Ac39cf7097B442E1Aa9f",
      cultists: "0x2D7cD25A014429282062298d2F712FA7983154B9",
      demons: "0xf830dcC09ba6BB0Eb575aD06E369f3483A65c5bF",
      cosmetics: "0x8184FdB709f6B810d94d4Ed2b6196866EF604e68",
      keyShop: "0x9Bd1651f1f8aB416A72f094fB60BbC1737B67DB6",
      mawSacrifice: "0xf65B16c49E505F5BC5c941081c2FA213f8D15D2f",
      rituals: "0xf65B16c49E505F5BC5c941081c2FA213f8D15D2f", // Same as mawSacrifice
      raccoonRenderer: "0x3eE467d8Dc8Fdf26dFC17dA8630EE1078aEd3A85",
      ritualReadAggregator: "0xe14830B91Bf666E51305a89C1196d0e88bad98a2",
      chainId: 84532,
      keyPrice: "0.002",
      raccoonPrice: "0.0" // Free minting
    };
  }
  
  return null;
};

export default function useContracts() {
  const chainId = useChainId();
  const { isConnected } = useAccount();
  const [contracts, setContracts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  useEffect(() => {
    const loadContracts = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const addresses = getContractAddresses(chainId);
        
        if (!addresses) {
          setError(`Unsupported network: ${chainId}`);
          setContracts(null);
          return;
        }
        
        // Validate that addresses are set
        const missingAddresses = Object.entries(addresses)
          .filter(([key, value]) => !value && key !== 'chainId' && key !== 'blockNumber' && key !== 'keyPrice' && key !== 'raccoonPrice')
          .map(([key]) => key);
          
        if (missingAddresses.length > 0) {
          setError(`Missing contract addresses: ${missingAddresses.join(', ')}`);
          setContracts(null);
          return;
        }
        
        setContracts(addresses);
      } catch (err) {
        setError(err.message);
        setContracts(null);
      } finally {
        setLoading(false);
      }
    };

    loadContracts();
  }, [chainId]);

  const isSupported = contracts !== null;
  const isLocal = chainId === 1337;
  const isTestnet = chainId === 84532;

  return {
    contracts,
    loading,
    error,
    isSupported,
    isLocal,
    isTestnet,
    chainId,
    network: isLocal ? 'Local' : isTestnet ? 'Base Sepolia' : 'Unknown'
  };
}