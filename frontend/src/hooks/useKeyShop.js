import { useState, useEffect, useCallback } from 'react';
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt, useChainId, useWatchContractEvent } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { toast } from 'react-hot-toast';
import { useContracts } from './useContracts';
import canonicalAbis from '../abis/canonical-abis.json';
import { useMawConfig } from './useMawConfig';

// ⭐ Using canonical KeyShop ABI instead of mock
const KEY_SHOP_ABI = canonicalAbis.KeyShop;

// ⭐ Using canonical Relics ABI instead of mock
const RELICS_ABI = canonicalAbis.Relics;

// ⭐ NO MORE HARDCODED IDs - using chain-first from MAW

export default function useKeyShop() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { contracts, isSupported, loading: contractsLoading } = useContracts();
  const [isLoading, setIsLoading] = useState(false);
  
  // ⭐ Chain-first ID resolution from MAW contract
  const { capId, keyId, isLoaded: mawConfigLoaded } = useMawConfig();
  
  const KEY_SHOP_ADDRESS = contracts?.KeyShop;
  const RELICS_ADDRESS = contracts?.Relics;
  
  
  
  // Read key price
  const { data: keyPriceData, isError: keyPriceError } = useReadContract({
    address: KEY_SHOP_ADDRESS,
    abi: KEY_SHOP_ABI,
    functionName: 'keyPrice',
    query: {
      enabled: isConnected && !!KEY_SHOP_ADDRESS && isSupported,
    },
  });

  // Check if balance query should be enabled - now includes MAW config loaded
  const balanceQueryEnabled = isConnected && !!address && !!RELICS_ADDRESS && isSupported && mawConfigLoaded;
  console.log('🔍 Balance query conditions:');
  console.log('isConnected:', isConnected);
  console.log('address exists:', !!address);
  console.log('RELICS_ADDRESS exists:', !!RELICS_ADDRESS);
  console.log('isSupported:', isSupported);
  console.log('mawConfigLoaded:', mawConfigLoaded);
  console.log('capId from MAW:', capId?.toString());
  console.log('balanceQueryEnabled:', balanceQueryEnabled);

  // Read user's cap balance - using dynamic capId from MAW (event-driven updates)
  const { data: keyBalanceData, refetch: refetchBalance, error: balanceError, isFetching } = useReadContract({
    address: RELICS_ADDRESS,
    abi: RELICS_ABI,
    functionName: 'balanceOf',
    args: address && capId ? [address, capId] : undefined,
    query: {
      enabled: balanceQueryEnabled,
      // ⭐ Removed polling, using event-driven updates instead
      staleTime: 10000, // Cache for 10 seconds between manual refreshes
    },
  });

  // ⭐ Event-driven balance updates: Listen to TransferSingle events
  useWatchContractEvent({
    address: RELICS_ADDRESS,
    abi: RELICS_ABI,
    eventName: 'TransferSingle',
    args: {
      // Listen for transfers TO or FROM the current user involving the capId
      to: address,
    },
    onLogs(logs) {
      console.log('🔥 TransferSingle TO user detected:', logs);
      // Check if this transfer involves our capId
      logs.forEach(log => {
        if (log.args?.id === capId) {
          console.log('✅ Relic balance change detected, refreshing...');
          refetchBalance();
        }
      });
    },
    enabled: balanceQueryEnabled && !!address && !!capId,
  });

  // ⭐ Event-driven balance updates: Listen for transfers FROM user
  useWatchContractEvent({
    address: RELICS_ADDRESS,
    abi: RELICS_ABI,
    eventName: 'TransferSingle',
    args: {
      // Listen for transfers FROM the current user involving the capId
      from: address,
    },
    onLogs(logs) {
      console.log('🔥 TransferSingle FROM user detected:', logs);
      // Check if this transfer involves our capId
      logs.forEach(log => {
        if (log.args?.id === capId) {
          console.log('✅ Relic balance change detected, refreshing...');
          refetchBalance();
        }
      });
    },
    enabled: balanceQueryEnabled && !!address && !!capId,
  });

  // ⭐ Event-driven balance updates: Listen to TransferBatch events
  useWatchContractEvent({
    address: RELICS_ADDRESS,
    abi: RELICS_ABI,
    eventName: 'TransferBatch',
    args: {
      to: address,
    },
    onLogs(logs) {
      console.log('🔥 TransferBatch TO user detected:', logs);
      // Check if any batch transfer involves our capId
      logs.forEach(log => {
        if (log.args?.ids?.includes(capId)) {
          console.log('✅ Relic batch balance change detected, refreshing...');
          refetchBalance();
        }
      });
    },
    enabled: balanceQueryEnabled && !!address && !!capId,
  });

  // ⭐ Event-driven balance updates: Listen for batch transfers FROM user
  useWatchContractEvent({
    address: RELICS_ADDRESS,
    abi: RELICS_ABI,
    eventName: 'TransferBatch',
    args: {
      from: address,
    },
    onLogs(logs) {
      console.log('🔥 TransferBatch FROM user detected:', logs);
      // Check if any batch transfer involves our capId
      logs.forEach(log => {
        if (log.args?.ids?.includes(capId)) {
          console.log('✅ Relic batch balance change detected, refreshing...');
          refetchBalance();
        }
      });
    },
    enabled: balanceQueryEnabled && !!address && !!capId,
  });

  console.log('📊 Balance query status:');
  console.log('isFetching:', isFetching);
  console.log('balanceError:', balanceError);
  console.log('keyBalanceData:', keyBalanceData);

  const { writeContract, data: hash, error: writeError, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const keyPrice = keyPriceData ? parseFloat(formatEther(keyPriceData)) : 0.002;
  const keyBalance = keyBalanceData ? Number(keyBalanceData) : 0;

  const buyKeys = useCallback(async (amount) => {
    if (!address || !isConnected) {
      toast.error('Please connect your wallet');
      return;
    }

    if (amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      setIsLoading(true);
      
      // Check if contracts are available
      if (!KEY_SHOP_ADDRESS || !isSupported) {
        toast.error('Contracts not available on this network');
        return;
      }

      const totalCost = keyPriceData ? keyPriceData * BigInt(amount) : parseEther((amount * keyPrice).toString());

      console.log('🔍 buyKeys params:', {
        address: KEY_SHOP_ADDRESS,
        amount: amount,
        totalCost: totalCost.toString(),
        keyPriceData: keyPriceData?.toString(),
        userAddress: address,
        chainId: chainId,
        isSupported: isSupported,
      });

      writeContract({
        address: KEY_SHOP_ADDRESS,
        abi: KEY_SHOP_ABI,
        functionName: 'buyKeys',
        args: [BigInt(amount)],
        value: totalCost,
        // Add explicit transaction parameters to help MetaMask
        gasLimit: 200000n,
        type: 'legacy', // Use legacy transaction type
      });

    } catch (error) {
      console.error('Buy keys error:', error);
      
      // Try to get more specific error info
      if (error?.cause?.data) {
        console.log('Error data:', error.cause.data);
      }
      if (error?.details) {
        console.log('Error details:', error.details);
      }
      
      toast.error(error?.message || 'Failed to purchase keys');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [address, isConnected, keyPrice, writeContract, refetchBalance, KEY_SHOP_ADDRESS, isSupported]);

  // Handle transaction confirmation
  useEffect(() => {
    if (isConfirmed) {
      toast.success('Keys purchased successfully!');
      
      // Force refresh balance after a short delay
      setTimeout(() => {
        refetchBalance();
      }, 2000);
      
      setIsLoading(false);
    }
  }, [isConfirmed, refetchBalance]);

  // Handle write errors
  useEffect(() => {
    if (writeError) {
      console.error('Write error:', writeError);
      toast.error(writeError.message || 'Transaction failed');
      setIsLoading(false);
    }
  }, [writeError]);

  return {
    keyPrice,
    keyBalance,
    buyKeys,
    isLoading: isLoading || isPending || isConfirming || contractsLoading || !mawConfigLoaded,
    error: keyPriceError || writeError,
    refetchBalance,
    isSupported,
    contracts,
    capId,
    keyId,
    mawConfigLoaded,
  };
}