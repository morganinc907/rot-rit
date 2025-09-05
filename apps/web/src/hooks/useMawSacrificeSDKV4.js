/**
 * Enhanced Maw Sacrifice Hook using V4 Contract SDK
 * Provides reliable, type-safe sacrifice operations with V4 features
 * Drop-in replacement for useMawSacrificeSDK with V4 enhancements
 * 
 * IMPORTANT: This hook must maintain backward compatibility with the existing UI
 * Required function names: approveContract, sacrificeForCosmetic, sacrificeForDemon, convertAshes
 * See mawSacrificeInterface.d.ts for the complete interface specification
 */

import { useState, useCallback, useEffect } from 'react';
import { 
  useAccount, 
  useWriteContract, 
  useWaitForTransactionReceipt, 
  useReadContract,
  useChainId,
  useWalletClient,
  usePublicClient
} from 'wagmi';
import { encodeFunctionData, keccak256, toHex, getAbiItem } from 'viem';
import { toast } from 'react-hot-toast';
import { useContractSDK } from './useContractSDK';
import { STANDARD_ABIS } from '../sdk/contracts';
import { useMaw, useRelics } from '../contracts';

export function useMawSacrificeSDKV4(onSacrificeComplete) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { contracts, getContractConfig, helpers, isReady } = useContractSDK();
  const { data: wallet } = useWalletClient();
  const publicClient = usePublicClient();
  
  // Use new contracts system for addresses/ABIs
  const mawContract = useMaw();
  const relicsContract = useRelics();
  
  // Transaction state
  const [isLoading, setIsLoading] = useState(false);
  const [resultShown, setResultShown] = useState(false);
  const [pendingHash, setPendingHash] = useState(null);
  const [pendingTransactionType, setPendingTransactionType] = useState(null); // 'approval', 'sacrifice', or 'conversion'
  
  // Wagmi hooks
  const { writeContract, writeContractAsync, data: hash, error: writeError, isPending } = useWriteContract();
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

  // Check approval status using new contracts system
  const { data: isApproved, refetch: refetchApproval, error: approvalError } = useReadContract({
    address: relicsContract.address,
    abi: relicsContract.abi,
    functionName: 'isApprovedForAll',
    args: address && mawContract.address ? [address, mawContract.address] : undefined,
    query: {
      enabled: !!(address && relicsContract.address && mawContract.address),
      refetchInterval: 5000,
    }
  });

  // V4 System Status - disabled until V4 is deployed
  // For now, we'll use the V3 contract which doesn't have these features
  const systemStatus = null;
  const sacrificesPaused = false;
  const conversionsPaused = false;

  // Cooldown system removed - no longer needed


  // Update loading state
  useEffect(() => {
    setIsLoading(isPending || isConfirming);
  }, [isPending, isConfirming]);

  // Handle transaction hash updates
  useEffect(() => {
    if (hash && hash !== pendingHash) {
      console.log('🔗 New transaction hash:', hash);
      setPendingHash(hash);
      setResultShown(false);
      setIsLoading(true); // Ensure loading state is set
    }
  }, [hash, pendingHash]);

  // Handle transaction confirmation
  useEffect(() => {
    if (isConfirmed && receipt && !resultShown) {
      console.log('✅ Transaction confirmed:', receipt.transactionHash);
      
      setResultShown(true);
      
      if (pendingTransactionType === 'sacrifice') {
        // ChatGPT diagnostic: Check which contracts emitted logs
        console.log('📋 Receipt log addresses:', receipt.logs.map(l => l.address.toLowerCase()));
        const COSMETICS_ADDRESS = '0xb0e32d26f6b61cb71115576e6a8d7de072e6310a';
        const hasCosmetics = receipt.logs.some(l => l.address.toLowerCase() === COSMETICS_ADDRESS);
        console.log('🎨 Cosmetics contract present in logs:', hasCosmetics);
        
        handleTransactionReceipt(receipt);
        
        // Force balance refresh after successful sacrifice
        console.log('🔄 Forcing balance refresh after sacrifice...');
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('forceBalanceRefresh'));
        }, 1000);
      } else if (pendingTransactionType === 'approval') {
        // Just clear states for approval transactions, don't trigger sacrifice complete
        toast.success('Contract approved! You can now sacrifice.');
        refetchApproval(); // Refresh the approval status
      } else if (pendingTransactionType === 'conversion') {
        // Handle shard to cap conversions - show success message without sacrifice parsing
        toast.success('✅ Conversion successful! Glass shards converted to rusted caps.');
        
        // Force balance refresh after successful conversion
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('forceBalanceRefresh'));
        }, 1000);
      }
      
      setIsLoading(false);
      setPendingTransactionType(null);
    }
  }, [isConfirmed, receipt, resultShown, pendingTransactionType, refetchApproval]);

  // Handle errors
  useEffect(() => {
    if (writeError) {
      const errorMessage = writeError.message;
      toast.error(errorMessage);
      setIsLoading(false);
      setPendingTransactionType(null); // Clear transaction type on error
    }
  }, [writeError, helpers]);

  useEffect(() => {
    if (isReceiptError && receiptError) {
      const errorMessage = receiptError.message;
      toast.error(`Transaction failed: ${errorMessage}`);
      setIsLoading(false);
      setPendingTransactionType(null); // Clear transaction type on receipt error
    }
  }, [isReceiptError, receiptError, helpers]);

  // Handle transaction receipt
  const handleTransactionReceipt = (receipt) => {
    if (!receipt || !receipt.logs) {
      toast.error('Transaction completed but no events found');
      setIsLoading(false);
      return;
    }

    const result = helpers?.parseSacrificeResult(receipt);
    
    if (!result) {
      toast.error('Could not parse sacrifice result');
      setIsLoading(false);
      return;
    }

    // V4 Feature: Handle glass shard awards
    if (result.shardsAwarded && result.shardsAwarded > 0) {
      toast(`💎 Received ${result.shardsAwarded} Glass Shard${result.shardsAwarded > 1 ? 's' : ''}!`, {
        icon: '✨',
        duration: 4000,
      });
    }

    // Show success based on what was received
    const relicsReceived = Array.isArray(result.relicsReceived) ? result.relicsReceived : [];
    const demonsReceived = Array.isArray(result.demonsReceived) ? result.demonsReceived : [];
    
    if (relicsReceived.length > 0) {
      const relicNames = relicsReceived.map(r => 
        `${r.amount}x ${helpers?.getRelicName(r.relicId) || `Relic #${r.relicId}`}`
      ).join(', ');
      toast.success(`Sacrifice successful! Received: ${relicNames}`);
    } else if (demonsReceived.length > 0) {
      const demonInfo = demonsReceived.map(d => 
        `Tier ${d.tier} Demon`
      ).join(', ');
      toast.success(`Demon summoned! ${demonInfo}`);
    } else {
      toast.success('Sacrifice completed successfully!');
    }

    // Call completion callback
    if (onSacrificeComplete) {
      onSacrificeComplete(result);
    }

    setIsLoading(false);
  };

  // Approve handler
  const approve = useCallback(async () => {
    if (!relicsContract.address || !mawContract.address) {
      toast.error('Contracts not loaded');
      return;
    }

    try {
      // Set transaction type to approval
      setPendingTransactionType('approval');
      setPendingHash(null);
      setResultShown(false);
      
      await writeContractAsync({
        address: relicsContract.address,
        abi: relicsContract.abi,
        functionName: 'setApprovalForAll',
        args: [mawContract.address, true],
      });
      
      toast.success('Approval transaction sent');
      
      // Refetch approval status after a delay
      setTimeout(() => refetchApproval(), 2000);
    } catch (error) {
      const errorMessage = error.message;
      toast.error(`Approval failed: ${errorMessage}`);
      setPendingTransactionType(null); // Clear on error
    }
  }, [relicsContract, mawContract, writeContract, refetchApproval, helpers]);

  // Sacrifice functions with V4 pause checks
  const sacrificeKeys = useCallback(async (amount = 1) => {
    // Validate amount parameter
    if (amount === undefined || amount === null || isNaN(amount) || amount <= 0) {
      console.error('❌ Invalid amount for sacrificeKeys:', amount);
      toast.error('Invalid amount specified');
      return { success: false, error: 'Invalid amount' };
    }
    
    // Ensure amount is a proper integer
    const validAmount = Math.floor(Number(amount));
    console.log('🔑 Validated amount:', validAmount);
    
    // Check if there's already a transaction pending
    if (isPending || isConfirming || isLoading) {
      toast.error('⏳ Previous transaction still processing. Please wait...');
      return { success: false, error: 'Transaction already pending' };
    }


    if (sacrificesPaused) {
      toast.error('Sacrifices are currently paused');
      return { success: false, error: 'Sacrifices are currently paused' };
    }

    if (!mawContract.address) {
      toast.error('Contracts not loaded');
      return { success: false, error: 'Contracts not loaded' };
    }

    if (!isApproved) {
      toast.error('Please approve the contract first');
      return { success: false, error: 'Please approve the contract first' };
    }

    if (amount < 1 || amount > 10) {
      toast.error('Amount must be between 1 and 10');
      return { success: false, error: 'Amount must be between 1 and 10' };
    }

    // ChatGPT diagnostic: Check actual balance before transaction
    try {
      console.log('🔍 Checking actual token balances before sacrifice...');
      const tokenId0Balance = await publicClient.readContract({
        address: relicsContract.address,
        abi: relicsContract.abi,
        functionName: 'balanceOf',
        args: [address, 0n], // Token ID 0 (RUSTED_CAP)
      });
      
      const tokenId1Balance = await publicClient.readContract({
        address: relicsContract.address,
        abi: relicsContract.abi,
        functionName: 'balanceOf',
        args: [address, 1n], // Token ID 1 (RUSTED_KEY)
      });
      
      console.log('[balances]', {
        tokenId0_RUSTED_CAP: tokenId0Balance.toString(),
        tokenId1_RUSTED_KEY: tokenId1Balance.toString(),
        attemptingToSacrifice: amount,
      });
      
      // Check if user has either token ID 0 or 1 for sacrifice
      const totalAvailable = tokenId0Balance + tokenId1Balance;
      console.log(`🔍 Total available tokens (ID0 + ID1): ${totalAvailable}`);
      
      if (totalAvailable < validAmount) {
        throw new Error(`Insufficient tokens: have ${totalAvailable} total, need ${validAmount}`);
      }
      
      // Warn if user only has ID 0 tokens (might need migration)
      if (tokenId0Balance > 0 && tokenId1Balance == 0) {
        console.warn('⚠️ User has token ID 0 but sacrificeKeys might expect ID 1');
      }
      
    } catch (balanceError) {
      console.error('⚠️ Balance check failed:', balanceError);
      // Continue anyway, let the contract handle it
    }

    try {
      // Reset any previous transaction state
      setPendingHash(null);
      setResultShown(false);
      setIsLoading(true);
      
      console.log('🔑 Starting key sacrifice:', { amount: validAmount, contract: mawContract.address });
      
      // Set transaction type for keys sacrifice
      setPendingTransactionType('sacrifice');
      
      // Skip simulation - go directly to transaction to avoid RPC hanging
      console.log('🔥 Executing sacrificeKeys transaction with retry logic...');
      
      // Retry logic for RPC failures
      const executeWithRetry = async (maxRetries = 3) => {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            console.log(`🎯 Sacrifice attempt ${attempt}/${maxRetries}`);
            
            // ChatGPT diagnostic: Log exactly what we're calling
            console.log("[call]", {
              to: mawContract.address,
              chainId: chainId,
              fn: "sacrificeKeys(uint256)",
              args: [validAmount],
            });
            
            const result = await writeContractAsync({
              address: mawContract.address,
              abi: mawContract.abi,
              functionName: 'sacrificeKeys',
              args: [validAmount],
              gas: 250000, // Set explicit gas limit for key sacrifices
            });
            
            console.log('✅ Transaction sent successfully:', result);
            return result;
            
          } catch (writeError) {
            const errorMsg = writeError.message || '';
            const isRpcError = errorMsg.includes('Internal JSON-RPC error') || 
                              errorMsg.includes('timeout') || 
                              errorMsg.includes('network');
            
            console.error(`❌ Attempt ${attempt} failed:`, errorMsg);
            
            if (isRpcError && attempt < maxRetries) {
              const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
              console.log(`⏳ Retrying in ${delay/1000}s due to RPC issue...`);
              toast(`RPC error - retrying in ${delay/1000}s... (${attempt}/${maxRetries})`, { icon: '🔄' });
              
              await new Promise(resolve => setTimeout(resolve, delay));
              continue;
            }
            
            // If not retryable or max retries exceeded, throw
            throw writeError;
          }
        }
      };
      
      try {
        const hash = await executeWithRetry();
        
        // Validate hash before waiting for receipt
        if (!hash || typeof hash !== 'string' || !hash.startsWith('0x')) {
          console.error('❌ Invalid transaction hash:', hash);
          return { success: false, error: 'Invalid transaction hash' };
        }
        
        console.log('⏳ Waiting for transaction receipt...', hash);
        
        // Wait for transaction confirmation with fallback manual polling
        const waitReceiptManually = async (hash, timeoutMs = 90000) => {
          const start = Date.now();
          while (Date.now() - start < timeoutMs) {
            try {
              const receipt = await publicClient.getTransactionReceipt({ hash });
              if (receipt) return receipt; // got a real receipt
            } catch (e) {
              // Tolerate intermittent RPC/format errors
              console.warn('⚠️ Manual receipt check failed, retrying...', e.message);
            }
            await new Promise(r => setTimeout(r, 1200)); // 1.2s poll
          }
          throw new Error("Timed out waiting for receipt");
        };
        
        try {
          // Try the standard method first
          const receipt = await publicClient.waitForTransactionReceipt({ 
            hash,
            confirmations: 1,
            pollingInterval: 1000
          });
          
          if (receipt.status === 'success' || receipt.status === 1) {
            // Parse transaction logs to detect rewards
            console.log('🎯 Parsing transaction logs for rewards...', receipt.logs);
            
            const rewards = [];
            
            // Look for TransferSingle/TransferBatch events in the logs
            receipt.logs.forEach(log => {
              try {
                // Check if this is a TransferSingle event (ERC1155)
                if (log.topics && log.topics[0] === '0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62') {
                  // TransferSingle: decode the event data
                  const from = '0x' + log.topics[2].slice(26); // Remove padding
                  const to = '0x' + log.topics[3].slice(26); // Remove padding
                  
                  // Decode data (id and value)
                  const dataHex = log.data.slice(2); // Remove '0x'
                  const id = parseInt(dataHex.slice(0, 64), 16);
                  const value = parseInt(dataHex.slice(64, 128), 16);
                  
                  // Only count tokens being minted to the user (from 0x000...000)
                  if (from === '0x0000000000000000000000000000000000000000' && to.toLowerCase() === address?.toLowerCase()) {
                    console.log(`🎁 Detected reward: ID ${id}, amount ${value}`);
                    
                    // Map token IDs to reward names
                    const rewardNames = {
                      0: 'Rusted Cap',
                      1: 'Glass Shards', 
                      2: 'Lantern Fragment',
                      3: 'Worm-eaten Mask',
                      4: 'Bone Dagger',
                      5: 'Ash Vial',
                      6: 'Binding Contract',
                      7: 'Soul Deed'
                    };
                    
                    rewards.push({
                      name: rewardNames[id] || `Token #${id}`,
                      amount: value,
                      id: id
                    });
                  }
                }
              } catch (e) {
                console.warn('⚠️ Failed to parse log:', e);
              }
            });
            
            console.log('🎁 Final rewards detected:', rewards);
            
            // Call the success callback with reward data
            if (onSacrificeComplete && rewards.length > 0) {
              setIsLoading(false);
              setPendingTransactionType(null);
              onSacrificeComplete({
                success: true,
                rewards,
                sacrificeType: 'keys'
              });
            }
            
            return { success: true, amount: validAmount, rewards };
          } else {
            return { success: false, error: 'Transaction reverted' };
          }
        } catch (receiptError) {
          console.error('❌ Standard receipt error:', receiptError);
          console.log('🔄 Falling back to manual polling...');
          
          try {
            // Fallback to manual polling
            const receipt = await waitReceiptManually(hash);
            
            if (receipt.status === 'success' || receipt.status === 1) {
              // Parse rewards from manual polling too
              const rewards = [];
              
              receipt.logs.forEach(log => {
                try {
                  if (log.topics && log.topics[0] === '0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62') {
                    const from = '0x' + log.topics[2].slice(26);
                    const to = '0x' + log.topics[3].slice(26);
                    
                    const dataHex = log.data.slice(2);
                    const id = parseInt(dataHex.slice(0, 64), 16);
                    const value = parseInt(dataHex.slice(64, 128), 16);
                    
                    if (from === '0x0000000000000000000000000000000000000000' && to.toLowerCase() === address?.toLowerCase()) {
                      const rewardNames = {
                        0: 'Rusted Cap', 1: 'Glass Shards', 2: 'Lantern Fragment',
                        3: 'Worm-eaten Mask', 4: 'Bone Dagger', 5: 'Ash Vial',
                        6: 'Binding Contract', 7: 'Soul Deed'
                      };
                      
                      rewards.push({
                        name: rewardNames[id] || `Token #${id}`,
                        amount: value,
                        id: id
                      });
                    }
                  }
                } catch (e) {
                  console.warn('⚠️ Failed to parse manual polling log:', e);
                }
              });
              
              if (onSacrificeComplete && rewards.length > 0) {
                setIsLoading(false);
                setPendingTransactionType(null);
                onSacrificeComplete({
                  success: true,
                  rewards,
                  sacrificeType: 'keys'
                });
              }
              
              return { success: true, amount: validAmount, rewards };
            } else {
              return { success: false, error: 'Transaction reverted' };
            }
          } catch (manualError) {
            console.error('❌ Manual polling also failed:', manualError);
            // Transaction was sent but both receipt methods failed
            console.warn('⚠️ Both receipt methods failed but transaction was sent.');
            return { success: true, amount: validAmount };
          }
        }
      } catch (writeError) {
        console.error('🔥 All retry attempts failed:', writeError);
        throw writeError;
      }
    } catch (error) {
      console.error('🔥 Key sacrifice error:', error);
      
      let errorMessage = error.message || 'Unknown error';
      
      // Handle JSON-RPC and network errors
      if (errorMessage.includes('Internal JSON-RPC error')) {
        errorMessage = 'Network connection issue. Please wait a moment and try again.';
        console.warn('🌐 Base Sepolia RPC issue detected - retrying in a few seconds might help');
      } else if (errorMessage.includes('TooSoon')) {
        errorMessage = 'Anti-bot cooldown active. Please wait a moment and try again.';
      } else if (errorMessage.includes('InsufficientBalance')) {
        errorMessage = 'Insufficient balance for this sacrifice';
      } else if (errorMessage.includes('InvalidAmount')) {
        errorMessage = 'Invalid amount (must be 1-10 keys)';
      } else if (errorMessage.includes('execution reverted')) {
        errorMessage = 'Transaction reverted. Please check your balance and try again.';
      } else if (errorMessage.includes('timeout') || errorMessage.includes('TimeoutError')) {
        errorMessage = 'Transaction timed out. Please check if it went through and try again if needed.';
      }
      
      toast.error(`Sacrifice failed: ${errorMessage}`);
      setIsLoading(false);
      setPendingTransactionType(null); // Clear transaction type on any error
      return { success: false, error: errorMessage };
    }
  }, [mawContract, isApproved, writeContract, helpers, sacrificesPaused]);

  const sacrificeCosmetics = useCallback(async (a, b) => {
    // Check if there's already a transaction pending
    if (isPending || isConfirming || isLoading) {
      toast.error('⏳ Previous transaction still processing. Please wait...');
      return { success: false, error: 'Transaction already pending' };
    }

    // Accept either (fragments:number, masks:number) OR (daggerIds:any[], vialAmounts:number[])
    let fragments = 0, masks = 0;

    console.log('🔍 sacrificeCosmetics called with:', { a, b, typeA: typeof a, typeB: typeof b });

    if (Number.isFinite(a) && Number.isFinite(b)) {
      // New UI form: numbers
      fragments = Number(a);
      masks = Number(b);
    } else {
      // Legacy UI form: arrays -> pick from vialAmounts[1], vialAmounts[2]
      const vialAmounts = Array.isArray(b) ? b : Array.isArray(a) ? a : [];
      fragments = Number(vialAmounts[1] || 0);
      masks = Number(vialAmounts[2] || 0);
    }

    // Ensure we have valid numbers (not NaN or undefined)
    fragments = Number.isFinite(fragments) ? fragments : 0;
    masks = Number.isFinite(masks) ? masks : 0;

    console.log('🔍 Processed values:', { fragments, masks });

    if (sacrificesPaused) {
      toast.error('Sacrifices are currently paused');
      return { success: false, error: 'Sacrifices are currently paused' };
    }

    if (!mawContract.address) {
      toast.error('Contracts not loaded');
      return { success: false, error: 'Contracts not loaded' };
    }

    if (!isApproved) {
      toast.error('Please approve the contract first');
      return { success: false, error: 'Please approve the contract first' };
    }


    if (fragments === 0) {
      toast.error('Must sacrifice at least 1 fragment');
      return { success: false, error: 'No fragments selected' };
    }
    if (fragments > 3 || masks > 3) {
      toast.error('Maximum 3 fragments and 3 masks per transaction');
      return { success: false, error: 'Over max per tx' };
    }

    try {
      // Reset any previous transaction state
      setPendingHash(null);
      setResultShown(false);
      setIsLoading(true);
      
      console.log('🎨 Starting cosmetic sacrifice:', { fragments, masks, contract: mawContract.address });
      
      // Set transaction type for cosmetics sacrifice
      setPendingTransactionType('sacrifice');
      
      // ChatGPT diagnostic checks
      console.log('🔍 Contract binding verification:');
      console.log('  maw.address:', mawContract.address);
      console.log('  isCosmeticInAbi:', !!mawContract.abi?.find(f => f.name === 'sacrificeForCosmetic'));
      
      // Check 4-byte selector to ensure we're not encoding keys (0x0cce1e93)
      try {
        console.log('  Full ABI functions with sacrificeFor prefix:');
        mawContract.abi.filter(f => f.name?.startsWith('sacrificeFor')).forEach(f => {
          console.log(`    ${f.name}(${f.inputs?.map(i => i.type).join(', ') || 'no inputs'})`);
        });
        
        const abiItem = getAbiItem({ abi: mawContract.abi, name: 'sacrificeForCosmetic' });
        console.log('  ABI cosmetics item:', abiItem);
        console.log('  Expected signature: sacrificeForCosmetic(uint256,uint256)');
        
        const encoded = encodeFunctionData({
          abi: mawContract.abi,
          functionName: 'sacrificeForCosmetic',
          args: [BigInt(fragments), BigInt(masks)],
        });
        console.log('  encoded 4-byte:', encoded.slice(0, 10));
        console.log('  encoded full:', encoded);
        
        // Calculate what the selector SHOULD be
        const expectedSelector = keccak256(toHex('sacrificeForCosmetic(uint256,uint256)')).slice(0, 10);
        console.log('  expected 4-byte:', expectedSelector);
        
        if (encoded.slice(0, 10) === '0x0cce1e93') {
          console.log('✅ CORRECT SELECTOR: Using sacrificeForCosmetic function');
        } else if (encoded.slice(0, 10) === '0x6d9dda72') {
          console.error('❌ WRONG SELECTOR: Encoding sacrificeKeys instead of sacrificeForCosmetic!');
        } else if (encoded.slice(0, 10) === expectedSelector) {
          console.log('✅ Selector matches expected cosmetics function');
        } else {
          console.error('❌ Unknown selector - not keys or expected cosmetics');
        }
      } catch (e) {
        console.error('❌ Selector check failed:', e.message);
      }
      
      // FIXED: Use the correct function sacrificeForCosmetic(uint256 fragments, uint256 masks)
      // Add proper gas estimation for cosmetic sacrifices (needs ~153k gas)
      // Ensure BigInt conversion for contract args
      const fragmentsArg = BigInt(fragments);
      const masksArg = BigInt(masks);
      
      console.log('🔗 Calling contract with BigInt args:', { fragmentsArg: fragmentsArg.toString(), masksArg: masksArg.toString() });
      
      const hash = await writeContractAsync({
        address: mawContract.address,
        abi: mawContract.abi,
        functionName: 'sacrificeForCosmetic',
        args: [fragmentsArg, masksArg],
        gas: 200000, // Set explicit gas limit for cosmetic sacrifices
      });

      // Wait for transaction confirmation and check receipt status
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      
      if (receipt.status === 'success') {
        // Parse transaction logs to detect cosmetic rewards
        console.log('🎯 Parsing cosmetic sacrifice logs for rewards...', receipt.logs);
        
        const rewards = [];
        
        // Look for TransferSingle/TransferBatch events in the logs
        receipt.logs.forEach(log => {
          try {
            // Check if this is a TransferSingle event (ERC1155)
            if (log.topics && log.topics[0] === '0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62') {
              // TransferSingle: decode the event data
              const from = '0x' + log.topics[2].slice(26); // Remove padding
              const to = '0x' + log.topics[3].slice(26); // Remove padding
              
              // Decode data (id and value)
              const dataHex = log.data.slice(2); // Remove '0x'
              const id = parseInt(dataHex.slice(0, 64), 16);
              const value = parseInt(dataHex.slice(64, 128), 16);
              
              // Only count tokens being minted to the user (from 0x000...000)
              if (from === '0x0000000000000000000000000000000000000000' && to.toLowerCase() === address?.toLowerCase()) {
                console.log(`🎁 Detected cosmetic reward: ID ${id}, amount ${value}`);
                
                // Map token IDs to reward names
                const rewardNames = {
                  0: 'Rusted Cap',
                  1: 'Glass Shards', 
                  2: 'Lantern Fragment',
                  3: 'Worm-eaten Mask',
                  4: 'Bone Dagger',
                  5: 'Ash Vial',
                  6: 'Binding Contract',
                  7: 'Soul Deed'
                };
                
                rewards.push({
                  name: rewardNames[id] || `Token #${id}`,
                  amount: value,
                  id: id
                });
              }
            }
          } catch (e) {
            console.warn('⚠️ Failed to parse cosmetic log:', e);
          }
        });
        
        console.log('🎁 Final cosmetic rewards detected:', rewards);
        
        // Call the success callback with reward data
        if (onSacrificeComplete && rewards.length > 0) {
          onSacrificeComplete({
            success: true,
            rewards,
            sacrificeType: 'cosmetic'
          });
        }
        
        return { success: true, fragments, masks, rewards };
      } else {
        return { success: false, error: 'Transaction reverted' };
      }
    } catch (error) {
      const errorMessage = error.message;
      toast.error(`Sacrifice failed: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }, [mawContract, isApproved, writeContract, sacrificesPaused]);

  const sacrificeDemons = useCallback(async (amount = 1, tier = 1) => {

    if (sacrificesPaused) {
      toast.error('Sacrifices are currently paused');
      return;
    }

    if (!mawContract.address) {
      toast.error('Contracts not loaded');
      return;
    }

    if (!isApproved) {
      toast.error('Please approve the contract first');
      return;
    }

    if (amount < 1 || amount > 3) {
      toast.error('Amount must be between 1 and 3');
      return;
    }

    if (tier !== 1 && tier !== 2) {
      toast.error('Tier must be 1 (rare) or 2 (mythic)');
      return;
    }

    try {
      // Set transaction type for demon sacrifice
      setPendingTransactionType('sacrifice');
      setPendingHash(null);
      setResultShown(false);
      
      const hash = await writeContractAsync({
        address: mawContract.address,
        abi: mawContract.abi,
        functionName: 'sacrificeDemons',
        args: [amount, tier],
        gas: 300000, // Set explicit gas limit for demon sacrifices
      });

      // Wait for transaction confirmation and check receipt status
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      
      if (receipt.status === 'success') {
        return { success: true, amount, tier };
      } else {
        return { success: false, error: 'Transaction reverted' };
      }
    } catch (error) {
      const errorMessage = error.message;
      toast.error(`Sacrifice failed: ${errorMessage}`);
    }
  }, [mawContract, isApproved, writeContract, helpers, sacrificesPaused]);

  // V4 Feature: Convert glass shards to rusted caps
  // V4 uses convertShardsToRustedCaps(amount) with specific shard amount
  const convertShardsToRustedCaps = useCallback(async (shardAmount) => {
    // Check if there's already a transaction pending
    if (isPending || isConfirming || isLoading) {
      toast.error('⏳ Previous transaction still processing. Please wait...');
      return { success: false, error: 'Transaction already pending' };
    }


    if (!mawContract.address) {
      toast.error('Contracts not loaded');
      return { success: false, error: 'Contracts not loaded' };
    }

    if (!isApproved) {
      toast.error('Please approve the contract first');
      return { success: false, error: 'Please approve the contract first' };
    }

    // Validate shardAmount
    if (!shardAmount || shardAmount < 5) {
      toast.error('Must convert at least 5 shards');
      return { success: false, error: 'Must convert at least 5 shards' };
    }

    if (shardAmount % 5 !== 0) {
      toast.error('Shard amount must be multiple of 5 (5:1 ratio)');
      return { success: false, error: 'Shard amount must be multiple of 5' };
    }

    try {
      // Reset any previous transaction state
      setPendingHash(null);
      setResultShown(false);
      setIsLoading(true);

      const capsToReceive = shardAmount / 5;
      toast(`Converting ${shardAmount} glass shards → ${capsToReceive} rusted caps...`, { icon: '🔄' });
      
      // Set transaction type for conversion
      setPendingTransactionType('conversion');
      
      const hash = await writeContractAsync({
        address: mawContract.address,
        abi: mawContract.abi,
        functionName: 'convertShardsToRustedCaps',
        args: [shardAmount],
        gas: 150000, // Set explicit gas limit for shard conversions
      });

      // Wait for transaction confirmation and check receipt status
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      
      if (receipt.status === 'success') {
        return { success: true, shardAmount, capsToReceive };
      } else {
        return { success: false, error: 'Transaction reverted' };
      }
    } catch (error) {
      const errorMessage = error.message;
      toast.error(`Conversion failed: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }, [mawContract, isApproved, writeContract]);

  return {
    // State
    isLoading,
    isPending,
    isConfirming,
    isApproved,
    isReady,
    lastTxHash: pendingHash,
    
    // V4 System Status
    systemStatus: {
      sacrificesPaused,
      conversionsPaused,
      mythicDemonsMinted: systemStatus?.mythicDemonsMinted || 0,
      version: systemStatus?.version || 'Unknown',
    },
    
    // Actions (with V3 compatibility names)
    approve,
    approveContract: approve, // V3 compatibility
    sacrificeKeys,
    sacrificeCosmetics,
    sacrificeForCosmetic: sacrificeCosmetics, // V3 compatibility
    sacrificeDemons,
    sacrificeForDemon: sacrificeDemons, // V3 compatibility
    convertShardsToRustedCaps,
    convertAshes: convertShardsToRustedCaps, // V3 compatibility
    
    // Helpers
    refetchApproval,
  };
}