/**
 * Enhanced Maw Sacrifice Hook using Contract SDK
 * Provides reliable, type-safe sacrifice operations with proper state management
 */

import { useState, useCallback, useEffect } from 'react';
import { 
  useAccount, 
  useWriteContract, 
  useWaitForTransactionReceipt, 
  useReadContract,
  useChainId 
} from 'wagmi';
import { encodeFunctionData, keccak256, toHex } from 'viem';
import { toast } from 'react-hot-toast';
import { useContractSDK } from './useContractSDK';
import { STANDARD_ABIS } from '../sdk/contracts';

export function useMawSacrificeSDK(onSacrificeComplete) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { contracts, getContractConfig, helpers, isReady } = useContractSDK();
  
  // Transaction state
  const [isLoading, setIsLoading] = useState(false);
  const [resultShown, setResultShown] = useState(false);
  const [pendingHash, setPendingHash] = useState(null);
  
  // Wagmi hooks
  const { writeContract, data: hash, error: writeError, isPending } = useWriteContract();
  const { 
    isLoading: isConfirming, 
    isSuccess: isConfirmed, 
    isError: isReceiptError, 
    error: receiptError, 
    data: receipt 
  } = useWaitForTransactionReceipt({
    hash: pendingHash,
    chainId,
  });

  // Check approval status
  const { data: isApproved, refetch: refetchApproval, error: approvalError } = useReadContract({
    address: contracts?.Relics,
    abi: STANDARD_ABIS.ERC1155,
    functionName: 'isApprovedForAll',
    args: address && contracts?.MawSacrifice ? [address, contracts.MawSacrifice] : undefined,
    query: {
      enabled: !!(address && contracts?.Relics && contracts?.MawSacrifice),
      refetchInterval: 5000,
    },
  });


  // Track sacrifice vs approval transactions
  const [transactionType, setTransactionType] = useState(null); // 'sacrifice' | 'approval'

  // Watch for new transaction hashes
  useEffect(() => {
    if (hash && hash !== pendingHash) {
      setPendingHash(hash);
    }
  }, [hash, pendingHash]);

  // Handle transaction success - both sacrifice and approval transactions
  useEffect(() => {
    if (isConfirmed && receipt && pendingHash && receipt.transactionHash === pendingHash) {
      
      if (transactionType === 'sacrifice' && onSacrificeComplete && !resultShown && helpers) {
        // Handle sacrifice transaction
        setResultShown(true);
        
        try {
          const result = helpers.parseSacrificeResult(receipt, address);
          onSacrificeComplete(result);
        } catch (error) {
          console.error('Failed to parse sacrifice result:', error);
          onSacrificeComplete({
            success: false,
            message: 'Transaction completed but failed to parse results',
            rewards: [],
            burned: []
          });
        }
      } else if (transactionType === 'approval') {
        // Handle approval transaction - force refresh approval status
        console.log('✅ Approval transaction confirmed, refreshing approval status');
        refetchApproval();
      }
      
      setIsLoading(false);
      setPendingHash(null);
      setTransactionType(null);
    }
  }, [isConfirmed, receipt, onSacrificeComplete, resultShown, helpers, pendingHash, transactionType, refetchApproval]);

  // Handle errors
  useEffect(() => {
    if (writeError) {
      console.error('Write error:', writeError);
      toast.error(writeError.message || 'Transaction failed');
      setIsLoading(false);
    }
  }, [writeError]);

  useEffect(() => {
    if (isReceiptError && receiptError) {
      console.error('Receipt error:', receiptError);
      toast.error(receiptError.message || 'Transaction reverted');
      setIsLoading(false);
      setPendingHash(null);
    }
  }, [isReceiptError, receiptError]);

  // Handle stuck transactions
  useEffect(() => {
    if (pendingHash && !isConfirming && !isConfirmed && !isReceiptError) {
      console.error('Transaction stopped confirming without success or error');
      toast.error('Transaction failed to confirm');
      setIsLoading(false);
      setPendingHash(null);
    }
  }, [pendingHash, isConfirming, isConfirmed, isReceiptError]);

  // Validation helper
  const validateOperation = useCallback(() => {
    if (!address || !isConnected) {
      toast.error('Please connect your wallet');
      return false;
    }

    if (!isReady) {
      toast.error('Contracts not available on this network');
      return false;
    }

    if (!isApproved) {
      toast.error('Please approve the contract to spend your relics first');
      return false;
    }

    return true;
  }, [address, isConnected, isReady, isApproved]);

  // Core sacrifice operations
  const sacrificeKeys = useCallback(async (amount) => {
    if (!validateOperation()) {
      return { success: false };
    }

    // Validate parameters
    const validation = helpers?.validateSacrifice('keys', { amount });
    if (!validation?.valid) {
      toast.error(validation?.errors[0] || 'Invalid parameters');
      return { success: false };
    }

    try {
      setIsLoading(true);
      setResultShown(false);
      setPendingHash(null); // Clear any previous pending transaction
      setTransactionType('sacrifice'); // Mark as sacrifice transaction
      
      const { address: contractAddress, abi } = getContractConfig('mawSacrifice');
      
      await writeContract({
        address: contractAddress,
        abi,
        functionName: 'sacrifice',
        args: [BigInt(amount)],
        gas: 200000n, // Explicit gas limit
      });
      
      return { success: true };
    } catch (error) {
      console.error('Sacrifice keys error:', error);
      toast.error(error?.message || 'Failed to sacrifice keys');
      setIsLoading(false);
      return { success: false, error };
    }
  }, [validateOperation, helpers, getContractConfig, writeContract]);

  const sacrificeForCosmetic = useCallback(async (fragments, masks) => {
    if (!validateOperation()) {
      return { success: false };
    }

    const validation = helpers?.validateSacrifice('cosmetic', { fragments, masks });
    if (!validation?.valid) {
      toast.error(validation?.errors[0] || 'Invalid parameters');
      return { success: false };
    }

    try {
      setIsLoading(true);
      setResultShown(false);
      setTransactionType('sacrifice'); // Mark as sacrifice transaction
      
      const { address: contractAddress, abi } = getContractConfig('mawSacrifice');
      
      await writeContract({
        address: contractAddress,
        abi,
        functionName: 'sacrificeForCosmetic',
        args: [BigInt(fragments), BigInt(masks)],
      });
      
      return { success: true };
    } catch (error) {
      console.error('Cosmetic sacrifice error:', error);
      toast.error(error?.message || 'Failed to perform cosmetic ritual');
      setIsLoading(false);
      return { success: false, error };
    }
  }, [validateOperation, helpers, getContractConfig, writeContract]);

  const sacrificeForDemon = useCallback(async (daggers, vials, useBindingContract, useSoulDeed, cultistTokenId) => {
    if (!validateOperation()) {
      return { success: false };
    }

    const validation = helpers?.validateSacrifice('demon', { 
      daggers, vials, useBindingContract, useSoulDeed, cultistTokenId 
    });
    if (!validation?.valid) {
      toast.error(validation?.errors[0] || 'Invalid parameters');
      return { success: false };
    }

    try {
      setIsLoading(true);
      setResultShown(false);
      setTransactionType('sacrifice'); // Mark as sacrifice transaction
      
      const { address: contractAddress, abi } = getContractConfig('mawSacrifice');
      
      await writeContract({
        address: contractAddress,
        abi,
        functionName: 'sacrificeForDemon',
        args: [
          BigInt(daggers),
          BigInt(vials),
          useBindingContract,
          useSoulDeed,
          BigInt(cultistTokenId)
        ],
      });
      
      return { success: true };
    } catch (error) {
      console.error('Demon sacrifice error:', error);
      toast.error(error?.message || 'Failed to perform demon ritual');
      setIsLoading(false);
      return { success: false, error };
    }
  }, [validateOperation, helpers, getContractConfig, writeContract]);

  const convertAshes = useCallback(async () => {
    if (!validateOperation()) {
      return { success: false };
    }

    try {
      setIsLoading(true);
      setResultShown(false);
      setTransactionType('sacrifice'); // Mark as sacrifice transaction
      
      const { address: contractAddress, abi } = getContractConfig('mawSacrifice');
      
      await writeContract({
        address: contractAddress,
        abi,
        functionName: 'convertAshes',
        args: [],
      });
      
      return { success: true };
    } catch (error) {
      console.error('Convert ashes error:', error);
      toast.error(error?.message || 'Failed to convert ashes');
      setIsLoading(false);
      return { success: false, error };
    }
  }, [validateOperation, getContractConfig, writeContract]);

  // Approval operation
  const approveContract = useCallback(async () => {
    if (!address || !isConnected) {
      toast.error('Please connect your wallet');
      return { success: false };
    }

    if (!isReady) {
      toast.error('Contracts not available on this network');
      return { success: false };
    }

    try {
      setIsLoading(true);
      setResultShown(false);
      setTransactionType('approval'); // Mark as approval transaction
      
      const { address: relicsAddress } = getContractConfig('relics');
      
      await writeContract({
        address: relicsAddress,
        abi: STANDARD_ABIS.ERC1155,
        functionName: 'setApprovalForAll',
        args: [contracts.MawSacrifice, true],
      });
      
      return { success: true };
    } catch (error) {
      console.error('Approval error:', error);
      toast.error(error?.message || 'Failed to approve contract');
      setIsLoading(false);
      return { success: false, error };
    }
  }, [address, isConnected, isReady, getContractConfig, writeContract, contracts]);

  return {
    // Operations
    sacrificeKeys,
    sacrificeForCosmetic,
    sacrificeForDemon,
    convertAshes,
    approveContract,
    
    // State
    isApproved: !!isApproved,
    isLoading: isLoading || isPending || isConfirming,
    isConfirmed,
    error: writeError,
    
    // Helpers
    refetchApproval,
    validateOperation,
    
    // SDK helpers
    helpers,
    contracts,
  };
}