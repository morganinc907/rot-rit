/**
 * Enhanced KeyShop hook with multicall batching and optimistic UI
 * Provides instant feedback for better UX
 */
import { useState, useCallback, useEffect } from 'react';
import { 
  useAccount, 
  useWriteContract, 
  useWaitForTransactionReceipt, 
  useWatchContractEvent 
} from 'wagmi';
import { parseEther } from 'viem';
import { toast } from 'react-hot-toast';
import { useContracts } from './useContracts';
import { useMulticall } from './useMulticall';

export function useKeyShopOptimistic() {
  const { address, isConnected } = useAccount();
  const { contracts, isSupported, keyShop } = useContracts();
  const { data: batchData, loading: batchLoading, refetch: refetchBatch } = useMulticall();
  
  // Optimistic state
  const [optimisticBalance, setOptimisticBalance] = useState(0);
  const [pendingPurchases, setPendingPurchases] = useState(0);
  
  // Transaction state
  const [isLoading, setIsLoading] = useState(false);
  const [pendingHash, setPendingHash] = useState(null);
  const [successShown, setSuccessShown] = useState(false);
  const [errorShown, setErrorShown] = useState(false);
  
  // Wagmi hooks
  const { writeContract, data: hash, error: writeError, isPending } = useWriteContract();
  const { 
    isLoading: isConfirming, 
    isSuccess: isConfirmed, 
    isError: isReceiptError,
    error: receiptError
  } = useWaitForTransactionReceipt({
    hash: pendingHash,
  });

  // Update optimistic balance when batch data changes
  useEffect(() => {
    if (batchData?.balances?.rustedCaps !== undefined) {
      setOptimisticBalance(batchData.balances.rustedCaps + pendingPurchases);
    }
  }, [batchData?.balances?.rustedCaps, pendingPurchases]);

  // Watch for new transaction hashes
  useEffect(() => {
    if (hash && hash !== pendingHash) {
      setPendingHash(hash);
    }
  }, [hash, pendingHash]);

  // Listen for TransferSingle events to reconcile optimistic state
  useWatchContractEvent({
    address: contracts?.Relics,
    abi: [
      {
        name: 'TransferSingle',
        type: 'event',
        inputs: [
          { indexed: true, name: 'operator', type: 'address' },
          { indexed: true, name: 'from', type: 'address' },
          { indexed: true, name: 'to', type: 'address' },
          { indexed: false, name: 'id', type: 'uint256' },
          { indexed: false, name: 'value', type: 'uint256' }
        ]
      }
    ],
    eventName: 'TransferSingle',
    args: { to: address },
    onLogs(logs) {
      logs.forEach(log => {
        const tokenId = log.args?.id;
        const capId = batchData?.maw?.capId;
        
        // If this is a cap transfer to our address, reconcile optimistic state
        if (tokenId !== undefined && capId !== undefined && Number(tokenId) === capId) {
          console.log('🎯 Cap transfer detected, reconciling optimistic state');
          setPendingPurchases(prev => Math.max(0, prev - Number(log.args.value)));
          refetchBatch(); // Refresh real balance
        }
      });
    },
    enabled: !!address && !!contracts?.Relics && !!batchData?.maw?.capId,
  });

  // Handle transaction success
  useEffect(() => {
    if (isConfirmed && pendingHash && !successShown) {
      console.log('✅ Key purchase transaction confirmed');
      setIsLoading(false);
      setPendingHash(null);
      setSuccessShown(true);
      toast.success('Caps purchased! Ready to sacrifice for cosmetics', {
        duration: 4000,
        style: {
          background: '#10b981',
          color: '#fff',
          fontWeight: 'bold',
          borderRadius: '8px',
        },
      });
    }
  }, [isConfirmed, pendingHash, successShown]);

  // Handle errors
  useEffect(() => {
    if (writeError && !errorShown) {
      console.error('Purchase error:', writeError);
      toast.error('Transaction failed. Please try again.', {
        duration: 4000,
        style: {
          background: '#ef4444',
          color: '#fff',
          fontWeight: 'bold',
          borderRadius: '8px',
        },
      });
      setIsLoading(false);
      setErrorShown(true);
      // Revert optimistic state
      setPendingPurchases(0);
    }
  }, [writeError, errorShown]);

  useEffect(() => {
    if (isReceiptError && receiptError && !errorShown) {
      console.error('Receipt error:', receiptError);
      toast.error('Transaction was reverted. Check your balance and try again.', {
        duration: 4000,
        style: {
          background: '#ef4444',
          color: '#fff',
          fontWeight: 'bold',
          borderRadius: '8px',
        },
      });
      setIsLoading(false);
      setPendingHash(null);
      setErrorShown(true);
      // Revert optimistic state
      setPendingPurchases(0);
    }
  }, [isReceiptError, receiptError, errorShown]);

  // Purchase function with optimistic UI
  const purchaseKeys = useCallback(async (amount) => {
    if (!address || !isConnected) {
      toast.error('Please connect your wallet to continue', {
        style: { background: '#ef4444', color: '#fff', fontWeight: 'bold', borderRadius: '8px' }
      });
      return { success: false };
    }

    if (!isSupported || !contracts?.KeyShop) {
      toast.error('KeyShop not available on this network', {
        style: { background: '#ef4444', color: '#fff', fontWeight: 'bold', borderRadius: '8px' }
      });
      return { success: false };
    }

    if (!batchData?.maw?.keyPrice) {
      toast.error('Cap price not loaded. Please wait and try again.', {
        style: { background: '#ef4444', color: '#fff', fontWeight: 'bold', borderRadius: '8px' }
      });
      return { success: false };
    }

    try {
      const keyPriceWei = BigInt(batchData.maw.keyPrice);
      const totalCost = keyPriceWei * BigInt(amount);

      console.log('🛒 Purchasing keys with optimistic UI:', {
        amount,
        keyPrice: keyPriceWei.toString(),
        totalCost: totalCost.toString()
      });

      // Optimistic update - show pending purchase immediately
      setPendingPurchases(prev => prev + amount);
      setIsLoading(true);
      setSuccessShown(false); // Reset success shown for new transaction
      
      await writeContract({
        address: keyShop ?? contracts?.KeyShop,
        abi: [
          {
            name: 'buyKeys',
            type: 'function',
            stateMutability: 'payable',
            inputs: [{ name: 'amount', type: 'uint256' }],
            outputs: [],
          }
        ],
        functionName: 'buyKeys',
        args: [BigInt(amount)],
        value: totalCost,
      });

      return { success: true };
    } catch (error) {
      console.error('Purchase keys error:', error);
      toast.error('Failed to purchase caps. Please try again.', {
        duration: 4000,
        style: { background: '#ef4444', color: '#fff', fontWeight: 'bold', borderRadius: '8px' }
      });
      setIsLoading(false);
      // Revert optimistic state
      setPendingPurchases(prev => Math.max(0, prev - amount));
      return { success: false, error };
    }
  }, [address, isConnected, isSupported, contracts, batchData, writeContract]);

  return {
    // Data from multicall batch
    capId: batchData?.maw?.capId,
    keyId: batchData?.maw?.keyId,
    keyPrice: batchData?.maw?.keyPrice ? Number(batchData.maw.keyPrice) / 1e18 : null, // Convert from wei to ETH
    
    // Balance with optimistic updates
    capBalance: optimisticBalance,
    realCapBalance: batchData?.balances?.rustedCaps || 0,
    pendingPurchases,
    
    // All relic balances
    balances: batchData?.balances || {},
    
    // State
    loading: batchLoading || isLoading,
    isConfirming,
    isConfirmed,
    error: writeError,
    
    // Actions
    purchaseKeys,
    refetch: refetchBatch,
    
    // Loading states
    batchLoading,
    isPurchasing: isLoading || isPending || isConfirming,
  };
}