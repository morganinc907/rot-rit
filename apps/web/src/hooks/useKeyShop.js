import { useState, useEffect, useCallback } from 'react';
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt, useChainId } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { toast } from 'react-hot-toast';
import useContracts from './useContracts.tsx';

// Mock ABI - replace with real KeyShop ABI
const KEY_SHOP_ABI = [
  {
    name: 'keyPrice',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
  },
  {
    name: 'buyKeys',
    type: 'function',
    stateMutability: 'payable',
    inputs: [{ name: 'amount', type: 'uint256', internalType: 'uint256' }],
    outputs: [],
  },
];

const RELICS_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'account', type: 'address', internalType: 'address' },
      { name: 'id', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
  },
];

const RUSTED_CAP_ID = 0; // Updated from RUSTED_KEY_ID = 1 to match contract RUSTED_CAP

export default function useKeyShop() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { contracts, isSupported, loading: contractsLoading } = useContracts();
  const [isLoading, setIsLoading] = useState(false);
  
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

  // Check if balance query should be enabled
  const balanceQueryEnabled = isConnected && !!address && !!RELICS_ADDRESS && isSupported;
  console.log('🔍 Balance query conditions:');
  console.log('isConnected:', isConnected);
  console.log('address exists:', !!address);
  console.log('RELICS_ADDRESS exists:', !!RELICS_ADDRESS);
  console.log('isSupported:', isSupported);
  console.log('balanceQueryEnabled:', balanceQueryEnabled);

  // Read user's key balance
  const { data: keyBalanceData, refetch: refetchBalance, error: balanceError, isFetching } = useReadContract({
    address: RELICS_ADDRESS,
    abi: RELICS_ABI,
    functionName: 'balanceOf',
    args: address ? [address, RUSTED_CAP_ID] : undefined,
    query: {
      enabled: balanceQueryEnabled,
      refetchInterval: 5000, // Refetch every 5 seconds
      staleTime: 0, // Always consider data stale
    },
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
    isLoading: isLoading || isPending || isConfirming || contractsLoading,
    error: keyPriceError || writeError,
    refetchBalance,
    isSupported,
    contracts,
  };
}