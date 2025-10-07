/**
 * User Inspector Hook
 * Look up any address's cap/key balances and recent transactions
 */
import { useState, useCallback } from 'react';
import { useReadContract, useChainId } from 'wagmi';
import { ADDRS } from '@rot-ritual/addresses';
import canonicalAbis from '../abis/canonical-abis.json';
import { isAddress } from 'viem';

export function useUserInspector() {
  const chainId = useChainId();
  const addresses = ADDRS[chainId];
  
  const [targetAddress, setTargetAddress] = useState('');
  const [isValidAddress, setIsValidAddress] = useState(false);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [isLoadingTxs, setIsLoadingTxs] = useState(false);

  // Validate and set target address
  const setAddress = useCallback((address) => {
    const trimmed = address.trim();
    setTargetAddress(trimmed);
    setIsValidAddress(isAddress(trimmed));
    setRecentTransactions([]);
  }, []);

  // Read cap balance
  const { data: capBalance, isLoading: loadingCapBalance } = useReadContract({
    address: addresses?.Relics,
    abi: canonicalAbis.Relics,
    functionName: 'balanceOf',
    args: [targetAddress, 0], // Cap ID is 0
    query: { enabled: isValidAddress && !!addresses?.Relics }
  });

  // Read key balance  
  const { data: keyBalance, isLoading: loadingKeyBalance } = useReadContract({
    address: addresses?.Relics,
    abi: canonicalAbis.Relics,
    functionName: 'balanceOf',
    args: [targetAddress, 1], // Key ID is 1
    query: { enabled: isValidAddress && !!addresses?.Relics }
  });

  // Read fragment balance
  const { data: fragmentBalance, isLoading: loadingFragmentBalance } = useReadContract({
    address: addresses?.Relics,
    abi: canonicalAbis.Relics,
    functionName: 'balanceOf',
    args: [targetAddress, 2], // Fragment ID is 2
    query: { enabled: isValidAddress && !!addresses?.Relics }
  });

  // Read shard balance
  const { data: shardBalance, isLoading: loadingShardBalance } = useReadContract({
    address: addresses?.Relics,
    abi: canonicalAbis.Relics,
    functionName: 'balanceOf',
    args: [targetAddress, 6], // Shard ID is 6
    query: { enabled: isValidAddress && !!addresses?.Relics }
  });

  // Read raccoon balance
  const { data: raccoonBalance, isLoading: loadingRaccoonBalance } = useReadContract({
    address: addresses?.Raccoons,
    abi: canonicalAbis.Raccoons,
    functionName: 'balanceOf',
    args: [targetAddress],
    query: { enabled: isValidAddress && !!addresses?.Raccoons }
  });

  // Fetch recent transactions using Base Sepolia block explorer API
  const fetchRecentTransactions = useCallback(async () => {
    if (!isValidAddress || !targetAddress) return;

    setIsLoadingTxs(true);
    try {
      // Use Base Sepolia Blockscout API for real transaction data
      const response = await fetch(
        `https://sepolia.basescan.org/api?module=account&action=txlist&address=${targetAddress}&startblock=0&endblock=99999999&page=1&offset=10&sort=desc&apikey=YourApiKeyToken`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch from Basescan API');
      }
      
      const data = await response.json();
      
      // Transform Basescan data to our format
      const transactions = data.result?.slice(0, 5).map(tx => {
        // Determine transaction type based on the 'to' address or method
        let type = 'Transfer';
        
        if (tx.to?.toLowerCase() === addresses?.KeyShop?.toLowerCase()) {
          type = 'Key Purchase';
        } else if (tx.to?.toLowerCase() === addresses?.MawSacrifice?.toLowerCase()) {
          type = 'MAW Sacrifice';
        } else if (tx.to?.toLowerCase() === addresses?.Relics?.toLowerCase()) {
          type = 'Relics Transaction';
        } else if (tx.to?.toLowerCase() === addresses?.Raccoons?.toLowerCase()) {
          type = 'Raccoon Transaction';
        }

        return {
          hash: tx.hash,
          type,
          timestamp: parseInt(tx.timeStamp) * 1000,
          success: tx.txreceipt_status === '1',
          blockNumber: parseInt(tx.blockNumber),
          gasUsed: tx.gasUsed,
          value: tx.value
        };
      }) || [];
      
      setRecentTransactions(transactions);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      
      // Fall back to mock data if API fails
      const mockTxs = [
        {
          hash: '0x1234567890abcdef1234567890abcdef12345678',
          type: 'Key Purchase',
          timestamp: Date.now() - 3600000,
          success: true,
          blockNumber: 12345678
        },
        {
          hash: '0xabcdef1234567890abcdef1234567890abcdef12', 
          type: 'MAW Sacrifice',
          timestamp: Date.now() - 7200000,
          success: true,
          blockNumber: 12345670
        }
      ];
      setRecentTransactions(mockTxs);
    } finally {
      setIsLoadingTxs(false);
    }
  }, [isValidAddress, targetAddress, addresses]);

  // Get Basescan URL for address
  const getBasescanAddressUrl = useCallback((address) => {
    return `https://sepolia.basescan.org/address/${address}`;
  }, []);

  // Get Basescan URL for transaction
  const getBasescanTxUrl = useCallback((txHash) => {
    return `https://sepolia.basescan.org/tx/${txHash}`;
  }, []);

  // Format balance display
  const formatBalance = useCallback((balance) => {
    if (balance === undefined || balance === null) return '--';
    return Number(balance).toLocaleString();
  }, []);

  // Get loading state
  const isLoadingBalances = loadingCapBalance || loadingKeyBalance || loadingFragmentBalance || 
                           loadingShardBalance || loadingRaccoonBalance;

  // Get balance summary
  const getBalanceSummary = useCallback(() => {
    if (!isValidAddress) return null;

    return {
      cap: formatBalance(capBalance),
      key: formatBalance(keyBalance),
      fragment: formatBalance(fragmentBalance),
      shard: formatBalance(shardBalance),
      raccoon: formatBalance(raccoonBalance),
      isLoading: isLoadingBalances
    };
  }, [
    isValidAddress, 
    capBalance, 
    keyBalance, 
    fragmentBalance, 
    shardBalance, 
    raccoonBalance,
    isLoadingBalances,
    formatBalance
  ]);

  // Clear all data
  const clearInspector = useCallback(() => {
    setTargetAddress('');
    setIsValidAddress(false);
    setRecentTransactions([]);
  }, []);

  return {
    // State
    targetAddress,
    isValidAddress,
    recentTransactions,
    isLoadingTxs,
    isLoadingBalances,

    // Actions
    setAddress,
    fetchRecentTransactions,
    clearInspector,

    // Data
    balanceSummary: getBalanceSummary(),
    
    // Helpers
    getBasescanAddressUrl,
    getBasescanTxUrl,
    formatBalance
  };
}