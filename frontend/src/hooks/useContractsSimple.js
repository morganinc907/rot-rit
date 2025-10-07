/**
 * Simplified contracts hook using SDK
 * Drop-in replacement for existing useContracts hook
 */

import { useContractSDK } from './useContractSDK';

export default function useContracts() {
  const { contracts, isSupported } = useContractSDK();
  
  return {
    contracts,
    isSupported,
  };
}