/**
 * Simplified Maw Sacrifice Hook - Debug Version
 * Removes complex state management that might cause issues
 */

import { useState, useCallback } from 'react';
import { useWriteContract, useAccount } from 'wagmi';
import { toast } from 'react-hot-toast';
import { useMaw, useRelics } from '../contracts';

export function useMawSacrificeSimple() {
  const { address, isConnected } = useAccount();
  const mawContract = useMaw();
  const relicsContract = useRelics();
  
  const [isLoading, setIsLoading] = useState(false);
  
  // Fresh writeContract hook instance for each call
  const { writeContractAsync } = useWriteContract();

  const sacrificeKeys = useCallback(async (amount = 1) => {
    if (!isConnected) {
      toast.error('Please connect wallet');
      return { success: false, error: 'Not connected' };
    }

    if (!mawContract.address) {
      toast.error('Contract not loaded');
      return { success: false, error: 'Contract not loaded' };
    }

    if (amount < 1 || amount > 10) {
      toast.error('Amount must be between 1 and 10');
      return { success: false, error: 'Invalid amount' };
    }

    try {
      setIsLoading(true);
      
      console.log('🔑 Sacrificing keys:', {
        amount,
        contract: mawContract.address,
        user: address
      });

      const hash = await writeContractAsync({
        address: mawContract.address,
        abi: mawContract.abi,
        functionName: 'sacrifice',
        args: [amount],
      });
      
      toast.success(`Key sacrifice submitted! Hash: ${hash.slice(0, 10)}...`);
      setIsLoading(false);
      
      return { success: true, hash, amount };
      
    } catch (error) {
      console.error('Key sacrifice error:', error);
      const errorMessage = error.shortMessage || error.message || 'Transaction failed';
      toast.error(`Key sacrifice failed: ${errorMessage}`);
      setIsLoading(false);
      return { success: false, error: errorMessage };
    }
  }, [mawContract, address, isConnected, writeContractAsync]);

  const sacrificeCosmetics = useCallback(async (fragments, masks = 0) => {
    if (!isConnected) {
      toast.error('Please connect wallet');
      return { success: false, error: 'Not connected' };
    }

    if (!mawContract.address) {
      toast.error('Contract not loaded');
      return { success: false, error: 'Contract not loaded' };
    }

    const frags = Number(fragments);
    const msks = Number(masks);

    if (frags < 1 || frags > 3) {
      toast.error('Fragments must be between 1 and 3');
      return { success: false, error: 'Invalid fragments' };
    }

    if (msks > 3) {
      toast.error('Masks cannot exceed 3');
      return { success: false, error: 'Invalid masks' };
    }

    try {
      setIsLoading(true);
      
      console.log('🎨 Sacrificing cosmetics:', {
        fragments: frags,
        masks: msks,
        contract: mawContract.address,
        user: address
      });

      const hash = await writeContractAsync({
        address: mawContract.address,
        abi: mawContract.abi,
        functionName: 'sacrificeForCosmetic',
        args: [frags, msks],
      });
      
      toast.success(`Cosmetic sacrifice submitted! Hash: ${hash.slice(0, 10)}...`);
      setIsLoading(false);
      
      return { success: true, hash, fragments: frags, masks: msks };
      
    } catch (error) {
      console.error('Cosmetic sacrifice error:', error);
      const errorMessage = error.shortMessage || error.message || 'Transaction failed';
      toast.error(`Cosmetic sacrifice failed: ${errorMessage}`);
      setIsLoading(false);
      return { success: false, error: errorMessage };
    }
  }, [mawContract, address, isConnected, writeContractAsync]);

  return {
    isLoading,
    sacrificeKeys,
    sacrificeCosmetics,
    contractAddress: mawContract.address,
    isConnected,
  };
}