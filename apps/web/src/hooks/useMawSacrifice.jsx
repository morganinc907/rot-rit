import { useState, useCallback, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useChainId, useReadContract, useBlockNumber } from 'wagmi';
import { toast } from 'react-hot-toast';
import { decodeEventLog } from 'viem';
import useContracts from './useContracts.tsx';

// Real MawSacrifice V4 ABI events needed for parsing
const COSMETIC_RITUAL_EVENT_ABI = {
  name: 'CosmeticRitualAttempted',
  type: 'event',
  inputs: [
    { indexed: true, name: 'user', type: 'address' },
    { indexed: false, name: 'success', type: 'bool' },
    { indexed: false, name: 'cosmeticTypeId', type: 'uint256' }
  ]
};

// Mock ABI - replace with real MawSacrifice ABI
// ERC1155 approval ABI
const ERC1155_ABI = [
  {
    name: 'setApprovalForAll',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'operator', type: 'address', internalType: 'address' },
      { name: 'approved', type: 'bool', internalType: 'bool' }
    ],
    outputs: [],
  },
  {
    name: 'isApprovedForAll',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'account', type: 'address', internalType: 'address' },
      { name: 'operator', type: 'address', internalType: 'address' }
    ],
    outputs: [{ name: '', type: 'bool', internalType: 'bool' }],
  },
];

const MAW_SACRIFICE_ABI = [
  {
    name: 'sacrificeKeys',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'amount', type: 'uint256', internalType: 'uint256' }],
    outputs: [],
  },
  {
    name: 'sacrificeForCosmetic',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'fragments', type: 'uint256', internalType: 'uint256' },
      { name: 'masks', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [],
  },
  {
    name: 'lastSacrificeBlock',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address', internalType: 'address' }],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
  },
  {
    name: 'minBlocksBetweenSacrifices',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
  },
  {
    name: 'sacrificeForDemon',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'daggers', type: 'uint256', internalType: 'uint256' },
      { name: 'vials', type: 'uint256', internalType: 'uint256' },
      { name: 'useBindingContract', type: 'bool', internalType: 'bool' },
      { name: 'useSoulDeed', type: 'bool', internalType: 'bool' },
      { name: 'cultistTokenId', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [],
  },
  {
    name: 'convertAshes',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
];

// ERC1155 Transfer event ABI for parsing rewards
const ERC1155_TRANSFER_EVENT_ABI = {
  name: 'TransferSingle',
  type: 'event',
  anonymous: false,
  inputs: [
    { name: 'operator', type: 'address', indexed: true },
    { name: 'from', type: 'address', indexed: true },
    { name: 'to', type: 'address', indexed: true },
    { name: 'id', type: 'uint256', indexed: false },
    { name: 'value', type: 'uint256', indexed: false }
  ]
};

const RELIC_NAMES = {
  1: "Rusted Cap",
  2: "Lantern Fragment", 
  3: "Worm-eaten Mask",
  4: "Bone Dagger",
  5: "Ash Vial",
  6: "Binding Contract",
  7: "Soul Deed",
  8: "Glass Shards", // Ashes renamed to Glass Shards
  // Let's also check for other possible ash IDs
  9: "Ash",
  10: "Ashes"
};

export default function useMawSacrifice(onSacrificeComplete) {
  const { address, isConnected } = useAccount();
  const { contracts, isSupported } = useContracts();
  const chainId = useChainId();
  const [isLoading, setIsLoading] = useState(false);
  const [resultShown, setResultShown] = useState(false);
  const [pendingHash, setPendingHash] = useState(null);
  const [pendingTransactionType, setPendingTransactionType] = useState(null); // 'approval' or 'sacrifice'
  
  const MAW_SACRIFICE_ADDRESS = contracts?.MawSacrifice;
  const RELICS_ADDRESS = contracts?.Relics;

  // Check if MawSacrifice contract is approved to spend user's relics
  const { data: isApproved, refetch: refetchApproval } = useReadContract({
    address: RELICS_ADDRESS,
    abi: ERC1155_ABI,
    functionName: 'isApprovedForAll',
    args: address && MAW_SACRIFICE_ADDRESS ? [address, MAW_SACRIFICE_ADDRESS] : undefined,
    query: {
      enabled: !!address && !!RELICS_ADDRESS && !!MAW_SACRIFICE_ADDRESS && isSupported,
    },
  });

  // Check cooldown status to prevent wasted gas
  const { data: lastSacrificeBlock, refetch: refetchLastBlock } = useReadContract({
    address: MAW_SACRIFICE_ADDRESS,
    abi: MAW_SACRIFICE_ABI,
    functionName: 'lastSacrificeBlock',
    args: [address],
    query: {
      enabled: !!address && !!MAW_SACRIFICE_ADDRESS && isSupported,
      refetchInterval: 2000, // Refetch every 2 seconds
      staleTime: 0, // Always consider data stale
      gcTime: 0, // Don't cache old data
    },
  });

  const { data: minBlocksBetweenSacrifices } = useReadContract({
    address: MAW_SACRIFICE_ADDRESS,
    abi: MAW_SACRIFICE_ABI,
    functionName: 'minBlocksBetweenSacrifices',
    query: {
      enabled: !!MAW_SACRIFICE_ADDRESS && isSupported,
    },
  });

  // Get current block number with more aggressive refresh
  const { data: blockNumber } = useBlockNumber({
    query: {
      refetchInterval: 2000, // Refresh every 2 seconds
      staleTime: 0, // Always consider stale
      gcTime: 0, // Don't cache
    }
  });

  // Calculate cooldown status - be careful with BigInt conversion
  const lastBlockNum = lastSacrificeBlock ? Number(lastSacrificeBlock) : 0;
  const minBlocksNum = minBlocksBetweenSacrifices ? Number(minBlocksBetweenSacrifices) : 0;
  const currentBlockNum = blockNumber ? Number(blockNumber) : 0;
  
  const isOnCooldown = lastBlockNum > 0 && minBlocksNum > 0 && currentBlockNum > 0 ? 
    currentBlockNum <= lastBlockNum + minBlocksNum : false;
  
  const blocksUntilNextSacrifice = lastBlockNum > 0 && minBlocksNum > 0 && currentBlockNum > 0 ?
    Math.max(0, lastBlockNum + minBlocksNum - currentBlockNum) : 0;

  // Debug logging and force refresh on stale data
  useEffect(() => {
    if (lastBlockNum > 0 && minBlocksNum > 0 && currentBlockNum > 0) {
      const shouldBeAbleToSacrifice = (currentBlockNum - lastBlockNum) > minBlocksNum;
      
      console.log('🔍 Cooldown Debug (useMawSacrifice):', {
        lastSacrificeBlock: lastBlockNum,
        minBlocksBetweenSacrifices: minBlocksNum,
        currentBlock: currentBlockNum,
        blocksSinceLastSacrifice: currentBlockNum - lastBlockNum,
        shouldBeAbleToSacrifice,
        isOnCooldown,
        blocksUntilNextSacrifice
      });
      
      // If data seems stale (blocks since > 10 but still showing cooldown), force refresh
      if (shouldBeAbleToSacrifice && isOnCooldown && (currentBlockNum - lastBlockNum) > 10) {
        console.log('🔄 Data seems stale, forcing refresh...');
        refetchLastBlock();
      }
    }
  }, [lastBlockNum, minBlocksNum, currentBlockNum, isOnCooldown, blocksUntilNextSacrifice, refetchLastBlock]);

  const { writeContract, data: hash, error: writeError, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed, isError: isReceiptError, error: receiptError, data: receipt } = useWaitForTransactionReceipt({
    hash: pendingHash,
    chainId,
  });

  // Watch for new transaction hashes and set them as pending
  useEffect(() => {
    if (hash && hash !== pendingHash) {
      setPendingHash(hash);
    }
  }, [hash, pendingHash]);

  // Handle transaction success
  useEffect(() => {
    if (isConfirmed && receipt && onSacrificeComplete && !resultShown && pendingTransactionType === 'sacrifice') {
      setResultShown(true);
      
      // Parse actual contract events from transaction logs
      const logs = receipt.logs || [];
      const rewards = [];
      const burned = [];
      
      // Look for Transfer events from the Relics contract AND CosmeticRitualAttempted from MawSacrifice
      let cosmeticReceived = null;
      
      logs.forEach((log, index) => {
        
        try {
          // First check for CosmeticRitualAttempted event from MawSacrifice
          if (log.address?.toLowerCase() === contracts?.MawSacrifice?.toLowerCase() && log.topics?.length === 2) {
            try {
              const decoded = decodeEventLog({
                abi: [COSMETIC_RITUAL_EVENT_ABI],
                data: log.data,
                topics: log.topics,
              });
              
              if (decoded.eventName === 'CosmeticRitualAttempted' && decoded.args.success) {
                // Cosmetic sacrifice was successful!
                const cosmeticTypeId = Number(decoded.args.cosmeticTypeId);
                cosmeticReceived = {
                  type: 'cosmetic',
                  typeId: cosmeticTypeId,
                  name: `Cosmetic #${cosmeticTypeId}`, // Will be replaced with actual name from contract
                  quantity: 1
                };
              }
            } catch (e) {
              // Not a CosmeticRitualAttempted event
            }
          }
          
          // Check if this looks like a TransferSingle event (4 topics = indexed params)
          if (log.topics && log.topics.length === 4) {
            const decoded = decodeEventLog({
              abi: [ERC1155_TRANSFER_EVENT_ABI],
              data: log.data,
              topics: log.topics,
            });
            
            if (decoded.eventName === 'TransferSingle') {
              const { from, to, id, value } = decoded.args;
              const relicId = Number(id);
              const amount = Number(value);
              
              // Check if this is from the Cosmetics contract (cosmetic mint)
              if (log.address?.toLowerCase() === contracts?.Cosmetics?.toLowerCase() && 
                  to.toLowerCase() === address.toLowerCase()) {
                // This is a cosmetic being minted to the user
                // Don't add it to rewards here as we handle it via CosmeticRitualAttempted
              } else {
                // Regular relic transfer
                const relicName = RELIC_NAMES[relicId] || `Unknown Relic #${relicId}`;
                
                // If to our address, it's a reward
                if (to.toLowerCase() === address.toLowerCase()) {
                  rewards.push({ name: relicName, quantity: amount, id: relicId });
                }
                
                // If from our address to zero address, it's burned
                if (from.toLowerCase() === address.toLowerCase() && to === '0x0000000000000000000000000000000000000000') {
                  burned.push({ name: relicName, quantity: amount, id: relicId });
                }
                
                // If from our address to any other address, it's also consumed
                if (from.toLowerCase() === address.toLowerCase() && to !== address.toLowerCase()) {
                  burned.push({ name: relicName, quantity: amount, id: relicId });
                }
              }
            }
          }
        } catch (error) {
          // Ignore logs that aren't recognized events
        }
      });
      
      // Add cosmetic to rewards if received
      if (cosmeticReceived) {
        rewards.push(cosmeticReceived);
      }
      
      
      // Show results with actual rewards
      onSacrificeComplete({
        type: rewards.length > 0 ? 'rewards' : 'nothing',
        rewards: rewards,
        burned: burned,
        message: rewards.length > 0 ? 
          'The Maw grants you relics!' : 
          'The Maw consumed your offering but granted nothing...'
      });
      
      // Clear loading and pending states
      setIsLoading(false);
      setPendingHash(null);
      setPendingTransactionType(null);
      // Refresh cooldown data after successful sacrifice
      refetchLastBlock();
    } else if (isConfirmed && pendingTransactionType === 'approval') {
      // Just clear states for approval transactions, don't trigger sacrifice complete
      setIsLoading(false);
      setPendingHash(null);
      setPendingTransactionType(null);
      refetchApproval(); // Refresh the approval status
      toast.success('Contract approved! You can now sacrifice.');
    }
  }, [isConfirmed, receipt, onSacrificeComplete, resultShown, address, pendingTransactionType, refetchApproval, refetchLastBlock]);

  // Handle transaction errors
  useEffect(() => {
    if (writeError) {
      console.error('Transaction error:', writeError);
      toast.error(writeError.message || 'Transaction failed');
      setIsLoading(false);
      setPendingTransactionType(null);
    }
  }, [writeError]);

  // Handle receipt errors (transaction reverted)
  useEffect(() => {
    if (isReceiptError && receiptError) {
      console.error('Receipt error (transaction reverted):', receiptError);
      toast.error(receiptError.message || 'Transaction reverted');
      setIsLoading(false);
      setPendingHash(null); // Clear pending hash on failure
      setPendingTransactionType(null);
    }
  }, [isReceiptError, receiptError]);

  // Handle case where transaction stops confirming but isn't confirmed (timeout/failure)
  useEffect(() => {
    if (pendingHash && !isConfirming && !isConfirmed && !isReceiptError) {
      console.error('Transaction stopped confirming without success or error');
      toast.error('Transaction failed to confirm');
      setIsLoading(false);
      setPendingHash(null); // Clear pending hash
      setPendingTransactionType(null);
    }
  }, [pendingHash, isConfirming, isConfirmed, isReceiptError]);

  const approveContract = useCallback(async () => {
    if (!address || !isConnected) {
      toast.error('Please connect your wallet');
      return { success: false };
    }

    if (!RELICS_ADDRESS || !MAW_SACRIFICE_ADDRESS || !isSupported) {
      toast.error('Contracts not available on this network');
      return { success: false };
    }

    try {
      setIsLoading(true);
      setResultShown(false);
      setPendingTransactionType('approval');
      
      await writeContract({
        address: RELICS_ADDRESS,
        abi: ERC1155_ABI,
        functionName: 'setApprovalForAll',
        args: [MAW_SACRIFICE_ADDRESS, true],
      });
      
      return { success: true };
    } catch (error) {
      console.error('Approval error:', error);
      toast.error(error?.message || 'Failed to approve contract');
      setIsLoading(false);
      return { success: false, error };
    }
  }, [address, isConnected, writeContract, RELICS_ADDRESS, MAW_SACRIFICE_ADDRESS, isSupported]);

  const sacrificeKeys = useCallback(async (amount) => {
    if (!address || !isConnected) {
      toast.error('Please connect your wallet');
      return { success: false };
    }

    if (amount <= 0 || amount > 10) {
      toast.error('Invalid amount (1-10 keys only)');
      return { success: false };
    }

    try {
      setIsLoading(true);
      setResultShown(false); // Reset for new transaction
      setPendingTransactionType('sacrifice');
      
      // Check if contracts are available
      if (!MAW_SACRIFICE_ADDRESS || !isSupported) {
        toast.error('Contracts not available on this network');
        return { success: false };
      }

      // Check approval before sacrificing
      if (!isApproved) {
        toast.error('Please approve the contract to spend your relics first');
        setIsLoading(false);
        return { success: false };
      }

      // Cooldown check temporarily disabled
      // if (isOnCooldown) {
      //   toast.error(`Cooldown active! Wait ${blocksUntilNextSacrifice} more blocks before sacrificing again.`);
      //   setIsLoading(false);
      //   return { success: false };
      // }

      await writeContract({
        address: MAW_SACRIFICE_ADDRESS,
        abi: MAW_SACRIFICE_ABI,
        functionName: 'sacrificeKeys',
        args: [BigInt(amount)],
      });
      return { success: true };
    } catch (error) {
      console.error('Sacrifice keys error:', error);
      toast.error(error?.message || 'Failed to sacrifice keys');
      setIsLoading(false);
      return { success: false, error };
    }
  }, [address, isConnected, writeContract, MAW_SACRIFICE_ADDRESS, isSupported]);

  const sacrificeForCosmetic = useCallback(async (fragments, masks) => {
    if (!address || !isConnected) {
      toast.error('Please connect your wallet');
      return { success: false };
    }

    if (fragments + masks === 0 || fragments + masks > 3) {
      toast.error('Invalid relic count (1-3 relics only)');
      return { success: false };
    }

    try {
      setIsLoading(true);
      setResultShown(false); // Reset for new transaction
      setPendingTransactionType('sacrifice');
      
      // Check if contracts are available
      if (!MAW_SACRIFICE_ADDRESS || !isSupported) {
        toast.error('Contracts not available on this network');
        return { success: false };
      }

      // Check approval before sacrificing
      if (!isApproved) {
        toast.error('Please approve the contract to spend your relics first');
        setIsLoading(false);
        return { success: false };
      }

      // Cooldown check temporarily disabled
      // if (isOnCooldown) {
      //   toast.error(`Cooldown active! Wait ${blocksUntilNextSacrifice} more blocks before sacrificing again.`);
      //   setIsLoading(false);
      //   return { success: false };
      // }

      await writeContract({
        address: MAW_SACRIFICE_ADDRESS,
        abi: MAW_SACRIFICE_ABI,
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
  }, [address, isConnected, writeContract, MAW_SACRIFICE_ADDRESS, isSupported]);

  const sacrificeForDemon = useCallback(async (daggers, vials, useBindingContract, useSoulDeed, cultistTokenId) => {
    if (!address || !isConnected) {
      toast.error('Please connect your wallet');
      return { success: false };
    }

    if (!cultistTokenId) {
      toast.error('Must select a cultist to sacrifice');
      return { success: false };
    }

    if (!useBindingContract && !useSoulDeed && (daggers + vials === 0 || daggers + vials > 3)) {
      toast.error('Invalid relic count (1-3 relics only)');
      return { success: false };
    }

    if (!useBindingContract && !useSoulDeed && daggers === 0) {
      toast.error('Need at least 1 dagger for demon ritual');
      return { success: false };
    }

    try {
      setIsLoading(true);
      setResultShown(false); // Reset for new transaction
      
      // Check if contracts are available
      if (!MAW_SACRIFICE_ADDRESS || !isSupported) {
        toast.error('Contracts not available on this network');
        return { success: false };
      }

      // Check approval before sacrificing
      if (!isApproved) {
        toast.error('Please approve the contract to spend your relics first');
        setIsLoading(false);
        return { success: false };
      }

      await writeContract({
        address: MAW_SACRIFICE_ADDRESS,
        abi: MAW_SACRIFICE_ABI,
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
  }, [address, isConnected, writeContract, MAW_SACRIFICE_ADDRESS, isSupported]);

  const convertAshes = useCallback(async () => {
    if (!address || !isConnected) {
      toast.error('Please connect your wallet');
      return { success: false };
    }

    try {
      setIsLoading(true);
      setResultShown(false); // Reset for new transaction
      
      // Check if contracts are available
      if (!MAW_SACRIFICE_ADDRESS || !isSupported) {
        toast.error('Contracts not available on this network');
        return { success: false };
      }

      // Check approval before sacrificing
      if (!isApproved) {
        toast.error('Please approve the contract to spend your relics first');
        setIsLoading(false);
        return { success: false };
      }

      await writeContract({
        address: MAW_SACRIFICE_ADDRESS,
        abi: MAW_SACRIFICE_ABI,
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
  }, [address, isConnected, writeContract, MAW_SACRIFICE_ADDRESS, isSupported]);

  return {
    sacrificeKeys,
    sacrificeForCosmetic,
    sacrificeForDemon,
    convertAshes,
    approveContract,
    isApproved: !!isApproved,
    refetchApproval,
    isLoading: isLoading || isPending || isConfirming,
    isConfirmed,
    error: writeError,
    isOnCooldown,
    blocksUntilNextSacrifice,
    lastSacrificeBlock: Number(lastSacrificeBlock || 0),
    minBlocksBetweenSacrifices: Number(minBlocksBetweenSacrifices || 0),
    currentBlock: Number(blockNumber || 0),
  };
}