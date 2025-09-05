import { useState, useCallback } from 'react';
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt, useChainId } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { toast } from 'react-hot-toast';

// Simple KeyShop ABI
const SIMPLE_KEY_SHOP_ABI = [
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
  {
    name: 'getKeyBalance',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address', internalType: 'address' }],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
  },
];

// Get contract address based on network
const getKeyShopAddress = (chainId) => {
  if (chainId === 84532) { // Base Sepolia
    try {
      const baseSepoliaContracts = require('../contracts-base-sepolia.json');
      return baseSepoliaContracts.keyShop;
    } catch {
      return null;
    }
  }
  return null;
};

export default function useSimpleKeyShop() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [isLoading, setIsLoading] = useState(false);
  
  const keyShopAddress = getKeyShopAddress(chainId);
  
  console.log('=== useSimpleKeyShop DEBUG ===');
  console.log('chainId:', chainId);
  console.log('keyShopAddress:', keyShopAddress);
  console.log('address:', address);
  console.log('isConnected:', isConnected);
  console.log('==============================');
  
  // Read key price
  const { data: keyPriceData } = useReadContract({
    address: keyShopAddress,
    abi: SIMPLE_KEY_SHOP_ABI,
    functionName: 'keyPrice',
    query: {
      enabled: !!keyShopAddress,
    },
  });

  // Read user's key balance
  const { data: keyBalanceData, refetch: refetchBalance } = useReadContract({
    address: keyShopAddress,
    abi: SIMPLE_KEY_SHOP_ABI,
    functionName: 'getKeyBalance',
    args: address ? [address] : undefined,
    query: {
      enabled: !!keyShopAddress && !!address,
    },
  });

  const { writeContract, data: hash, error: writeError, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const keyPrice = keyPriceData ? parseFloat(formatEther(keyPriceData)) : 0.001;
  const keyBalance = keyBalanceData ? Number(keyBalanceData) : 0;

  const buyKeys = useCallback(async (amount) => {
    if (!address || !isConnected) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!keyShopAddress) {
      toast.error('KeyShop contract not available on this network');
      return;
    }

    if (amount <= 0 || amount > 10) {
      toast.error('Please enter amount between 1-10');
      return;
    }

    if (chainId !== 84532) {
      toast.error('Please switch to Base Sepolia network');
      return;
    }

    try {
      setIsLoading(true);
      const totalCost = parseEther((amount * keyPrice).toString());

      console.log('Buying keys:', {
        amount,
        totalCost: totalCost.toString(),
        keyShopAddress
      });

      writeContract({
        address: keyShopAddress,
        abi: SIMPLE_KEY_SHOP_ABI,
        functionName: 'buyKeys',
        args: [BigInt(amount)],
        value: totalCost,
      });

    } catch (error) {
      console.error('Buy keys error:', error);
      toast.error(error?.message || 'Failed to purchase keys');
      setIsLoading(false);
    }
  }, [address, isConnected, keyPrice, writeContract, keyShopAddress, chainId]);

  // Handle transaction success
  if (isConfirmed) {
    toast.success('Keys purchased successfully!');
    refetchBalance();
    setIsLoading(false);
  }

  // Handle write errors
  if (writeError) {
    console.error('Write error:', writeError);
    toast.error(writeError.message || 'Transaction failed');
    setIsLoading(false);
  }

  const isSupported = chainId === 84532;
  const hasContract = !!keyShopAddress && keyShopAddress !== '0x0000000000000000000000000000000000000000';

  return {
    keyPrice,
    keyBalance,
    buyKeys,
    isLoading: isLoading || isPending || isConfirming,
    error: writeError,
    refetchBalance,
    isSupported,
    hasContract,
    keyShopAddress,
    chainId
  };
}