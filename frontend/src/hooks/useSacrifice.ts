/**
 * Battle-tested sacrifice hook with simulation-before-write pattern
 * Uses chain-first architecture and prevents failed transactions
 */
import { useState, useCallback } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useConfig } from 'wagmi';
import { simulateContract } from 'wagmi/actions';
import { toast } from 'react-hot-toast';
import { useContracts } from './useContracts';
import { useMawConfig } from './useMawConfig';
import { useRelicBalances } from './useRelicBalances';

// Minimal ABI for sacrifice operations
const mawAbi = [
  { name: "sacrificeKeys", type: "function", stateMutability: "nonpayable", inputs: [{ type: "uint256" }], outputs: [] },
  { name: "sacrificeCaps", type: "function", stateMutability: "nonpayable", inputs: [{ type: "uint256" }], outputs: [] },
  { name: "convertShardsToRustedCaps", type: "function", stateMutability: "nonpayable", inputs: [{ type: "uint256" }], outputs: [] },
] as const;

export function useSacrifice() {
  const { address, isConnected } = useAccount();
  const { maw } = useContracts();
  const { isLoaded: configLoaded } = useMawConfig();
  const { caps, canSacrifice, shards, canConvert } = useRelicBalances();
  const wagmiConfig = useConfig();
  
  const [isLoading, setIsLoading] = useState(false);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);

  // Transaction receipt watching
  const { data: receipt, isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash: lastTxHash as `0x${string}`,
  });

  /**
   * Sacrifice Keys/Caps - simulates first to prevent failures
   */
  const sacrificeKeys = useCallback(async (amount: number) => {
    if (!isConnected) {
      toast.error('Please connect wallet');
      return { success: false, error: 'Not connected' };
    }

    if (!maw || !configLoaded) {
      toast.error('Contract not ready - check network');
      return { success: false, error: 'Contract not ready' };
    }

    if (amount < 1 || amount > 10) {
      toast.error('Amount must be between 1 and 10');
      return { success: false, error: 'Invalid amount' };
    }

    if (!canSacrifice) {
      toast.error(`Insufficient caps (need ${amount}, have ${Number(caps)})`);
      return { success: false, error: 'Insufficient balance' };
    }

    try {
      setIsLoading(true);

      // STEP 1: Simulate first to catch reverts before sending
      console.log('[Sacrifice] Simulating sacrificeKeys...', { amount, maw });
      
      const { request } = await simulateContract(wagmiConfig, {
        address: maw,
        abi: mawAbi,
        functionName: 'sacrificeKeys',
        args: [amount],
      });

      console.log('[Sacrifice] Simulation successful, executing...');

      // STEP 2: Execute the transaction
      const hash = await writeContract(request);
      setLastTxHash(hash);
      
      toast.success(`Key sacrifice submitted! Hash: ${hash.slice(0, 10)}...`);
      
      return { success: true, hash, amount };
      
    } catch (error: any) {
      console.error('Key sacrifice error:', error);
      
      // Better error messages based on simulation failures
      let errorMessage = error.shortMessage || error.message || 'Transaction failed';
      
      if (errorMessage.includes('InsufficientBalance')) {
        errorMessage = `Not enough caps (need ${amount})`;
      } else if (errorMessage.includes('SacrificesPaused')) {
        errorMessage = 'Sacrifices are currently paused';
      } else if (errorMessage.includes('NotAuthorized')) {
        errorMessage = 'Contract authorization issue - contact support';
      }
      
      toast.error(`Key sacrifice failed: ${errorMessage}`);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [maw, configLoaded, canSacrifice, caps, isConnected, wagmiConfig]);

  /**
   * Convert Shards to Caps - simulated first
   */
  const convertShards = useCallback(async (shardAmount: number) => {
    if (!isConnected) {
      toast.error('Please connect wallet');
      return { success: false, error: 'Not connected' };
    }

    if (!maw || !configLoaded) {
      toast.error('Contract not ready');
      return { success: false, error: 'Contract not ready' };
    }

    if (shardAmount < 5 || shardAmount % 5 !== 0) {
      toast.error('Shard amount must be multiple of 5');
      return { success: false, error: 'Invalid amount' };
    }

    if (!canConvert || Number(shards) < shardAmount) {
      toast.error(`Insufficient shards (need ${shardAmount}, have ${Number(shards)})`);
      return { success: false, error: 'Insufficient balance' };
    }

    try {
      setIsLoading(true);

      // Simulate first
      console.log('[Convert] Simulating convertShardsToRustedCaps...', { shardAmount });
      
      const { request } = await simulateContract(wagmiConfig, {
        address: maw,
        abi: mawAbi,
        functionName: 'convertShardsToRustedCaps',
        args: [shardAmount],
      });

      console.log('[Convert] Simulation successful, executing...');

      // Execute
      const hash = await writeContract(request);
      setLastTxHash(hash);
      
      const capsToReceive = shardAmount / 5;
      toast.success(`Converting ${shardAmount} shards to ${capsToReceive} caps! Hash: ${hash.slice(0, 10)}...`);
      
      return { success: true, hash, shardAmount, capsToReceive };
      
    } catch (error: any) {
      console.error('Shard conversion error:', error);
      
      let errorMessage = error.shortMessage || error.message || 'Transaction failed';
      
      if (errorMessage.includes('InsufficientBalance')) {
        errorMessage = `Not enough shards (need ${shardAmount})`;
      } else if (errorMessage.includes('ConversionsPaused')) {
        errorMessage = 'Conversions are currently paused';
      }
      
      toast.error(`Shard conversion failed: ${errorMessage}`);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [maw, configLoaded, canConvert, shards, isConnected, wagmiConfig]);

  const { writeContractAsync: writeContract } = useWriteContract();

  return {
    // Actions
    sacrificeKeys,
    convertShards,
    
    // State
    isLoading: isLoading || isConfirming,
    lastTxHash,
    receipt,
    
    // Derived state for UI
    canSacrifice,
    canConvert,
    capsBalance: Number(caps),
    shardsBalance: Number(shards),
    
    // Config info
    isReady: !!maw && configLoaded,
    contractAddress: maw,
    
    // Connection
    isConnected,
  };
}