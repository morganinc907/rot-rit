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
  useChainId,
  useWatchContractEvent,
  usePublicClient
} from 'wagmi';
import { encodeFunctionData, keccak256, toHex } from 'viem';
import { toast } from 'react-hot-toast';
import { useContractSDK } from './useContractSDK';
import { STANDARD_ABIS } from '../sdk/contracts';
import canonicalAbis from '../abis/canonical-abis.json';

export function useMawSacrificeSDK(onSacrificeComplete, opts = {}) {
  const { onConversionComplete } = opts;
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
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
    },
  });


  // Track sacrifice vs approval transactions
  const [transactionType, setTransactionType] = useState(null); // 'sacrifice' | 'approval'

  // Event-driven approval status updates
  useWatchContractEvent({
    address: contracts?.Relics,
    abi: STANDARD_ABIS.ERC1155,
    eventName: 'ApprovalForAll',
    args: { account: address, operator: contracts?.MawSacrifice },
    onLogs(logs) {
      // Approval status changed, refetch immediately
      refetchApproval();
    },
    enabled: !!(address && contracts?.Relics && contracts?.MawSacrifice),
  });

  // Watch for new transaction hashes
  useEffect(() => {
    if (hash && !pendingHash) {
      setPendingHash(hash);
    }
  }, [hash]);

  // Handle transaction success - both sacrifice and approval transactions
  useEffect(() => {
    if (isConfirmed && receipt && pendingHash && receipt.transactionHash === pendingHash) {
      
      if (transactionType === 'sacrifice' && onSacrificeComplete && !resultShown && helpers) {
        // Handle sacrifice transaction
        setResultShown(true);

        (async () => {
          try {
            const result = await helpers.parseSacrificeResult(receipt, address);
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
        })();
      } else if (transactionType === 'approval') {
        // Handle approval transaction - force refresh approval status
        console.log('✅ Approval transaction confirmed, refreshing approval status');
        refetchApproval();
      } else if (transactionType === 'conversion') {
        // Handle conversion transaction
        try {
          toast.success('Conversion complete');
        } catch {}
        if (onConversionComplete) {
          onConversionComplete();
        }
      }

      setIsLoading(false);
      setPendingHash(null);
      setTransactionType(null);
    }
  }, [isConfirmed, receipt, onSacrificeComplete, resultShown, helpers, address, refetchApproval, onConversionComplete]);

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
      console.error('❌ Receipt error:', receiptError);
      console.error('❌ Receipt error details:', {
        name: receiptError.name,
        message: receiptError.message,
        cause: receiptError.cause,
        details: receiptError.details,
        shortMessage: receiptError.shortMessage
      });
      toast.error(receiptError.shortMessage || receiptError.message || 'Transaction reverted');
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
  const sacrificeCaps = useCallback(async (amount) => {
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

      // Use chain-first contract address instead of SDK's static address
      // This fixes the "Stale addresses (two MAW deployments)" flagged issue
      const contractAddress = contracts?.MawSacrifice;
      let abi = canonicalAbis.MawSacrifice || [];

      // Add the missing InsufficientBalance error signature that matches 0x670f0045
      // The deployed contract has this error but the ABI is missing it
      const missingError = {
        type: 'error',
        name: 'InsufficientBalance',
        inputs: [
          { name: 'owner', type: 'address' },
          { name: 'tokenId', type: 'uint256' },
          { name: 'currentBalance', type: 'uint256' },
          { name: 'required', type: 'uint256' }
        ]
      };

      // Check if this specific error signature already exists
      const hasDetailedInsufficientBalance = abi.some(item =>
        item.type === 'error' &&
        item.name === 'InsufficientBalance' &&
        item.inputs?.length === 4
      );

      if (!hasDetailedInsufficientBalance) {
        abi = [...abi, missingError];
        console.log('🔧 Added missing InsufficientBalance(address,uint256,uint256,uint256) error to ABI');
      }

      console.log('🔧 Debug state:', {
        publicClient: !!publicClient,
        contracts: !!contracts,
        contractAddress,
        abiLength: abi?.length,
        hasRelics: !!contracts?.Relics
      });

      console.log('📋 Contract call details:', {
        contractAddress,
        expectedAddress: '0x2f7bf97d8a0d955b46ec89d383ba43d847e359b7', // From previous logs
        addressMatch: contractAddress === '0x2f7bf97d8a0d955b46ec89d383ba43d847e359b7',
        functionName: 'sacrifice', // Fixed: using sacrifice instead of sacrificeKeys
        amount: amount,
        amountBigInt: BigInt(amount),
        userAddress: address,
        isApproved: !!isApproved,
        chainId: chainId
      });


      // Comprehensive preflight checks to identify revert reasons
      try {
        console.log('🔍 Running comprehensive preflight checks...');

        // 1. Check pause status
        const [paused, sacrificesPaused] = await Promise.all([
          publicClient.readContract({
            address: contractAddress,
            abi,
            functionName: 'paused',
          }),
          publicClient.readContract({
            address: contractAddress,
            abi,
            functionName: 'sacrificesPaused',
          })
        ]);

        console.log(`⏸️ Contract paused: ${paused}, Sacrifices paused: ${sacrificesPaused}`);

        if (paused) {
          toast.error('Contract is currently paused');
          setIsLoading(false);
          return { success: false, error: 'Contract paused' };
        }

        if (sacrificesPaused) {
          toast.error('Sacrifices are currently paused');
          setIsLoading(false);
          return { success: false, error: 'Sacrifices paused' };
        }

        // 2. Check MAW authorization on Relics - this is critical
        try {
          const trustedMaw = await publicClient.readContract({
            address: contracts.Relics,
            abi: STANDARD_ABIS.ERC1155,
            functionName: 'mawSacrifice',
          });

          console.log(`🔐 Trusted MAW on Relics: ${trustedMaw}, Current MAW: ${contractAddress}`);

          if (trustedMaw.toLowerCase() !== contractAddress.toLowerCase()) {
            toast.error('MAW contract not authorized on Relics contract');
            setIsLoading(false);
            return { success: false, error: 'MAW not authorized' };
          }
        } catch (authError) {
          console.log('⚠️ Could not check MAW authorization:', authError.message);
          // This might be expected if the ABI doesn't have this function
        }

        // 3. Get token ID configuration from the MAW contract
        let keyId, bindingContractId, soulDeedId;

        try {
          // Try to read individual token ID constants
          [keyId, bindingContractId, soulDeedId] = await Promise.all([
            publicClient.readContract({
              address: contractAddress,
              abi,
              functionName: 'RUSTED_KEY',
            }).catch(() => 1n), // Fallback to 1 if function doesn't exist
            publicClient.readContract({
              address: contractAddress,
              abi,
              functionName: 'BINDING_CONTRACT',
            }).catch(() => 8n), // Expected value per tokens.ts
            publicClient.readContract({
              address: contractAddress,
              abi,
              functionName: 'SOUL_DEED',
            }).catch(() => 9n), // Expected value per tokens.ts
          ]);

          console.log('🔑 MAW Contract Token Configuration:');
          console.log(`  RUSTED_KEY (sacrifice token): ${keyId.toString()}`);
          console.log(`  BINDING_CONTRACT: ${bindingContractId.toString()}`);
          console.log(`  SOUL_DEED: ${soulDeedId.toString()}`);

          console.log('🎯 Expected Token Configuration (from tokens.ts):');
          console.log('  RUSTED_CAP (sacrifice): 1');
          console.log('  BINDING_CONTRACT: 9');
          console.log('  SOUL_DEED: 7');

          console.log('✅ Token ID Alignment Check:');
          if (keyId.toString() !== '1') {
            console.log(`  ❌ RUSTED_KEY should be 1, but contract has ${keyId.toString()}`);
          } else {
            console.log('  ✅ RUSTED_KEY matches: 1');
          }
          if (bindingContractId.toString() !== '9') {
            console.log(`  ❌ BINDING_CONTRACT should be 9, but contract has ${bindingContractId.toString()}`);
          } else {
            console.log('  ✅ BINDING_CONTRACT matches: 9');
          }
          if (soulDeedId.toString() !== '7') {
            console.log(`  ❌ SOUL_DEED should be 7, but contract has ${soulDeedId.toString()}`);
          } else {
            console.log('  ✅ SOUL_DEED matches: 7');
          }

        } catch (configError) {
          console.log('⚠️ Could not read contract token configuration:', configError.message);
          keyId = 1n; // From the error we know it expects 1
        }

        // 4. Check user's balance for both potential token IDs
        const [balance0, balance1, keyBalance] = await Promise.all([
          publicClient.readContract({
            address: contracts.Relics,
            abi: STANDARD_ABIS.ERC1155,
            functionName: 'balanceOf',
            args: [address, 0n], // Token ID 0 (what UI thinks are rusted caps)
          }),
          publicClient.readContract({
            address: contracts.Relics,
            abi: STANDARD_ABIS.ERC1155,
            functionName: 'balanceOf',
            args: [address, 1n], // Token ID 1 (what contract expects)
          }),
          publicClient.readContract({
            address: contracts.Relics,
            abi: STANDARD_ABIS.ERC1155,
            functionName: 'balanceOf',
            args: [address, keyId], // Whatever the contract is configured to use
          })
        ]);

        console.log(`📊 User token balances:
        - Token ID 0: ${balance0.toString()}
        - Token ID 1: ${balance1.toString()}
        - Contract keyId ${keyId}: ${keyBalance.toString()}
        Need: ${amount}`);

        if (keyBalance < BigInt(amount)) {
          const suggestion = balance0 > 0n && keyId !== 0n ?
            `You have ${balance0} tokens at ID 0. Contract expects ID ${keyId}. Check token configuration.` :
            `You need ${amount} tokens of ID ${keyId} but only have ${keyBalance}.`;

          toast.error(`Insufficient balance for token ID ${keyId}. ${suggestion}`);
          setIsLoading(false);
          return { success: false, error: 'Insufficient balance' };
        }

      } catch (preflightError) {
        console.log('⚠️ Preflight check failed:', preflightError.message);
        // Continue to simulation to get the exact error
      }

      // Simulate the transaction first to catch revert reasons
      // This addresses the "Simulation Before Write" pattern from SYSTEM_ARCHITECTURE
      try {
        console.log('🧪 Simulating sacrificeKeys transaction...');
        const simulation = await publicClient.simulateContract({
          address: contractAddress,
          abi,
          functionName: 'sacrificeKeys',
          args: [BigInt(amount)],
          account: address,
        });
        console.log('✅ Simulation successful:', simulation);
      } catch (simulationError) {
        console.error('❌ Simulation failed:', simulationError);
        toast.error(`Transaction would fail: ${simulationError.shortMessage || simulationError.message}`);
        setIsLoading(false);
        return { success: false, error: simulationError.message };
      }

      // Use sacrificeKeys with correct canonical ABI
      // This fixes the "ABI/tuple mismatch" flagged issue
      await writeContract({
        address: contractAddress,
        abi,
        functionName: 'sacrificeKeys',
        args: [BigInt(amount)],
        gas: 200000n, // Explicit gas limit
      });

      console.log('✅ writeContract call completed successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Sacrifice keys error:', error);
      console.error('❌ Error details:', {
        name: error.name,
        message: error.message,
        cause: error.cause,
        stack: error.stack
      });
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
      
      const { address: contractAddress, abi } = getContractConfig('MawSacrifice');
      
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
      
      const { address: contractAddress, abi } = getContractConfig('MawSacrifice');
      
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
      
      const { address: contractAddress, abi } = getContractConfig('MawSacrifice');
      
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
      
      const { address: relicsAddress } = getContractConfig('Relics');
      
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

  // NEW CONVERSION FUNCTIONS FOR SIMPLIFIED ECONOMY
  const convertShardsToRustedCaps = useCallback(async (shardAmount) => {
    if (!validateOperation()) {
      return { success: false };
    }

    if (shardAmount < 5 || shardAmount % 5 !== 0) {
      toast.error('Must convert multiples of 5 shards');
      return { success: false };
    }

    // Check approval first
    if (!isApproved) {
      toast.error('Please approve the contract first');
      return { success: false, error: 'Not approved' };
    }

    try {
      setIsLoading(true);
      setResultShown(false);
      setPendingHash(null);
      setTransactionType('conversion');

      const { address: contractAddress, abi } = getContractConfig('MawSacrifice');

      await writeContract({
        address: contractAddress,
        abi,
        functionName: 'convertShardsToRustedCaps',
        args: [BigInt(shardAmount)],
        gas: 200000n,
      });

      return { success: true };
    } catch (error) {
      console.error('Convert shards to caps error:', error);
      toast.error(error?.message || 'Failed to convert shards to caps');
      setIsLoading(false);
      return { success: false, error };
    }
  }, [validateOperation, getContractConfig, writeContract, isApproved]);

  const convertShardsToBinding = useCallback(async (shardAmount) => {
    if (!validateOperation()) {
      return { success: false };
    }

    if (shardAmount < 50 || shardAmount % 50 !== 0) {
      toast.error('Must convert multiples of 50 shards');
      return { success: false };
    }

    // Check approval first
    if (!isApproved) {
      toast.error('Please approve the contract first');
      return { success: false, error: 'Not approved' };
    }

    try {
      setIsLoading(true);
      setResultShown(false);
      setPendingHash(null);
      setTransactionType('conversion');

      const { address: contractAddress, abi } = getContractConfig('MawSacrifice');

      await writeContract({
        address: contractAddress,
        abi,
        functionName: 'convertShardsToBinding',
        args: [BigInt(shardAmount)],
        gas: 200000n,
      });

      return { success: true };
    } catch (error) {
      console.error('Convert shards to binding error:', error);
      toast.error(error?.message || 'Failed to convert shards to binding contract');
      setIsLoading(false);
      return { success: false, error };
    }
  }, [validateOperation, getContractConfig, writeContract, isApproved]);

  const convertShardsToSoulDeed = useCallback(async (shardAmount) => {
    if (!validateOperation()) {
      return { success: false };
    }

    if (shardAmount < 100 || shardAmount % 100 !== 0) {
      toast.error('Must convert multiples of 100 shards');
      return { success: false };
    }

    // Check approval first
    if (!isApproved) {
      toast.error('Please approve the contract first');
      return { success: false, error: 'Not approved' };
    }

    try {
      setIsLoading(true);
      setResultShown(false);
      setPendingHash(null);
      setTransactionType('conversion');

      const { address: contractAddress, abi } = getContractConfig('MawSacrifice');

      await writeContract({
        address: contractAddress,
        abi,
        functionName: 'convertShardsToSoulDeed',
        args: [BigInt(shardAmount)],
        gas: 200000n,
      });

      return { success: true };
    } catch (error) {
      console.error('Convert shards to soul deed error:', error);
      toast.error(error?.message || 'Failed to convert shards to soul deed');
      setIsLoading(false);
      return { success: false, error };
    }
  }, [validateOperation, getContractConfig, writeContract, isApproved]);

  return {
    // Operations
    sacrificeCaps,
    sacrificeForCosmetic,
    sacrificeForDemon,
    convertAshes,
    approveContract,

    // New conversion functions for simplified economy
    convertShardsToRustedCaps,
    convertShardsToBinding,
    convertShardsToSoulDeed,
    
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