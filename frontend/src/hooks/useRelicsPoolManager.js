/**
 * Relics Pool Manager Hook
 * Handles relics reward pool management with presets and simulation
 */
import { useState, useEffect } from 'react';
import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi';
import { ADDRS } from '@rot-ritual/addresses';
import canonicalAbis from '../abis/canonical-abis.json';
import toast from 'react-hot-toast';
import { useRelicNames } from './useRelicNames';

// Relics pool presets based on correct relic configuration
const RELICS_PRESETS = {
  'current': {
    name: 'Current Pool (Keep Existing)',
    description: 'Keep the current relics pool unchanged',
    tokenIds: [], // Will be populated from current pool
    probabilities: [],
    isKeepCurrent: true
  },
  'correct_sacrifice_rewards': {
    name: 'Correct Sacrifice Rewards',
    description: 'Only relics given as sacrifice rewards (no Glass Shards)',
    tokenIds: [2, 4, 7], // LANTERN_FRAGMENT, BONE_DAGGER, SOUL_DEED
    probabilities: [400, 300, 200],
    theme: '🎯 Correct Rewards'
  },
  'balanced_rewards': {
    name: 'Balanced Reward Distribution', 
    description: 'Equal chance for all sacrifice reward relics',
    tokenIds: [2, 4, 7], // Lantern Fragment, Bone Dagger, Soul Deed
    probabilities: [333, 333, 334],
    theme: '⚖️ Balanced Rewards'
  },
  'fragment_focused': {
    name: 'Fragment Focused',
    description: 'Higher chance for Lantern Fragments',
    tokenIds: [2, 4, 7], // Lantern Fragment, Bone Dagger, Soul Deed
    probabilities: [500, 250, 250],
    theme: '🏮 Fragment Focus'
  },
  'rare_deed_focus': {
    name: 'Rare Soul Deed Focus',
    description: 'Higher chance for rare Soul Deeds',
    tokenIds: [2, 4, 7], // Lantern Fragment, Bone Dagger, Soul Deed
    probabilities: [300, 300, 400],
    theme: '📜 Rare Deed Focus'
  },
  'legacy_test': {
    name: 'Legacy Test Pool',
    description: 'Test pool with just two relics for testing',
    tokenIds: [2, 4], // Lantern Fragment, Bone Dagger
    probabilities: [500, 500],
    theme: '🧪 Legacy Test'
  }
};

export function useRelicsPoolManager() {
  const chainId = useChainId();
  const addresses = ADDRS[chainId];
  
  const [selectedPreset, setSelectedPreset] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);
  const [previewPool, setPreviewPool] = useState(null);
  
  // Custom pool editor state
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customPool, setCustomPool] = useState({ tokenIds: [], probabilities: [] });
  const [newRelicId, setNewRelicId] = useState('');
  const [newRelicProbability, setNewRelicProbability] = useState('100');

  // Get current relics pool
  const { data: currentPoolData, refetch: refetchPool } = useReadContract({
    address: addresses?.MawSacrifice,
    abi: canonicalAbis.MawSacrifice,
    functionName: 'getRewardPool',
    query: {
      enabled: !!addresses?.MawSacrifice,
      staleTime: 30000,
    }
  });

  // Parse current pool data
  const currentPool = currentPoolData ? {
    tokenIds: currentPoolData[0]?.map(id => Number(id)) || [],
    probabilities: currentPoolData[1]?.map(p => Number(p)) || [],
    totalWeight: Number(currentPoolData[2]) || 0
  } : null;

  // Get all unique token IDs from current pool, custom pool, and presets for name fetching
  const allTokenIds = [
    ...(currentPool?.tokenIds || []),
    ...(customPool.tokenIds || []),
    // Add token IDs from presets
    ...Object.values(RELICS_PRESETS).flatMap(preset => preset.tokenIds || [])
  ].filter((id, index, array) => array.indexOf(id) === index); // Remove duplicates

  // Fetch relic names for all token IDs
  const { getRelicName, formatRelicDisplay } = useRelicNames(allTokenIds);

  // Write contract hook for pool updates
  const { writeContract, data: txHash, isPending: isWriting, error: writeError } = useWriteContract();

  // Wait for transaction confirmation
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Initialize custom pool with current pool when switching to custom mode
  useEffect(() => {
    if (isCustomMode && currentPool && customPool.tokenIds.length === 0) {
      setCustomPool({
        tokenIds: [...currentPool.tokenIds],
        probabilities: [...currentPool.probabilities]
      });
    }
  }, [isCustomMode, currentPool]);

  // Auto-preview when preset changes
  useEffect(() => {
    if (selectedPreset && !isCustomMode) {
      previewPreset(selectedPreset);
    } else if (isCustomMode && customPool.tokenIds.length > 0) {
      previewCustomPool();
    } else {
      setPreviewPool(null);
      setSimulationResult(null);
    }
  }, [selectedPreset, currentPool, isCustomMode, customPool]);

  // Get selected preset data
  const getPresetData = (presetKey) => {
    if (!presetKey) return null;
    
    const preset = RELICS_PRESETS[presetKey];
    if (!preset) return null;

    // For "current" preset, use actual current pool data
    if (preset.isKeepCurrent && currentPool) {
      return {
        ...preset,
        tokenIds: currentPool.tokenIds,
        probabilities: currentPool.probabilities,
        name: `Current Pool (${currentPool.tokenIds.length} relics)`
      };
    }

    return preset;
  };

  // Custom pool management functions
  const switchToCustomMode = () => {
    setSelectedPreset('');
    setIsCustomMode(true);
    if (currentPool) {
      setCustomPool({
        tokenIds: [...currentPool.tokenIds],
        probabilities: [...currentPool.probabilities]
      });
    }
  };

  const switchToPresetMode = () => {
    setIsCustomMode(false);
    setCustomPool({ tokenIds: [], probabilities: [] });
    setSimulationResult(null);
    setPreviewPool(null);
  };

  const addRelicToPool = () => {
    const tokenId = parseInt(newRelicId);
    const probability = parseInt(newRelicProbability);
    
    if (isNaN(tokenId) || tokenId <= 0) {
      toast.error('Please enter a valid relic ID');
      return;
    }
    
    if (isNaN(probability) || probability <= 0) {
      toast.error('Please enter a valid probability');
      return;
    }
    
    if (customPool.tokenIds.includes(tokenId)) {
      toast.error(`Relic ID ${tokenId} is already in the pool`);
      return;
    }
    
    setCustomPool({
      tokenIds: [...customPool.tokenIds, tokenId],
      probabilities: [...customPool.probabilities, probability]
    });
    
    setNewRelicId('');
    setNewRelicProbability('100');
    toast.success(`Added relic ${tokenId} with probability ${probability}`);
  };

  const removeRelicFromPool = (tokenIdToRemove) => {
    const indexToRemove = customPool.tokenIds.indexOf(tokenIdToRemove);
    if (indexToRemove === -1) return;
    
    const newTokenIds = customPool.tokenIds.filter((_, index) => index !== indexToRemove);
    const newProbabilities = customPool.probabilities.filter((_, index) => index !== indexToRemove);
    
    setCustomPool({
      tokenIds: newTokenIds,
      probabilities: newProbabilities
    });
    
    toast.success(`Removed relic ${tokenIdToRemove}`);
  };

  const updateRelicProbability = (tokenId, newProbability) => {
    const probability = parseInt(newProbability);
    if (isNaN(probability) || probability <= 0) {
      toast.error('Probability must be a positive number');
      return;
    }
    
    const index = customPool.tokenIds.indexOf(tokenId);
    if (index === -1) return;
    
    const newProbabilities = [...customPool.probabilities];
    newProbabilities[index] = probability;
    
    setCustomPool({
      tokenIds: customPool.tokenIds,
      probabilities: newProbabilities
    });
  };

  const previewCustomPool = () => {
    if (customPool.tokenIds.length === 0) {
      setPreviewPool(null);
      return;
    }

    const totalWeight = customPool.probabilities.reduce((sum, p) => sum + p, 0);
    const percentages = customPool.probabilities.map(p => ((p / totalWeight) * 100).toFixed(1));

    setPreviewPool({
      preset: {
        name: 'Custom Pool',
        description: `Custom pool with ${customPool.tokenIds.length} relics`,
        theme: '⚙️ Custom Configuration'
      },
      tokenIds: customPool.tokenIds,
      probabilities: customPool.probabilities,
      totalWeight: totalWeight,
      percentages: percentages,
      changes: {
        addedIds: customPool.tokenIds.filter(id => !currentPool?.tokenIds.includes(id)),
        removedIds: currentPool?.tokenIds.filter(id => !customPool.tokenIds.includes(id)) || [],
        modifiedProbabilities: customPool.tokenIds.filter(id => {
          const currentIndex = currentPool?.tokenIds.indexOf(id);
          const newIndex = customPool.tokenIds.indexOf(id);
          return currentIndex !== -1 && currentPool.probabilities[currentIndex] !== customPool.probabilities[newIndex];
        })
      }
    });
  };

  // Preview preset (no chain interaction)
  const previewPreset = (presetKey) => {
    const preset = getPresetData(presetKey);
    if (!preset) {
      setPreviewPool(null);
      return;
    }

    const totalWeight = preset.probabilities.reduce((sum, p) => sum + p, 0);
    const percentages = preset.probabilities.map(p => ((p / totalWeight) * 100).toFixed(1));

    setPreviewPool({
      preset: preset,
      tokenIds: preset.tokenIds,
      probabilities: preset.probabilities,
      totalWeight: totalWeight,
      percentages: percentages,
      changes: {
        addedIds: preset.tokenIds.filter(id => !currentPool?.tokenIds.includes(id)),
        removedIds: currentPool?.tokenIds.filter(id => !preset.tokenIds.includes(id)) || [],
        modifiedProbabilities: preset.tokenIds.filter(id => {
          const currentIndex = currentPool?.tokenIds.indexOf(id);
          const newIndex = preset.tokenIds.indexOf(id);
          return currentIndex !== -1 && currentPool.probabilities[currentIndex] !== preset.probabilities[newIndex];
        })
      }
    });
  };

  // Simulate pool update
  const simulateUpdate = async () => {
    if (!previewPool || !addresses?.MawSacrifice) {
      toast.error('Please select a preset first');
      return;
    }

    setIsSimulating(true);
    try {
      // Validate that we have valid arrays
      if (previewPool.tokenIds.length === 0 || previewPool.probabilities.length === 0) {
        throw new Error('Cannot set empty relics pool');
      }

      if (previewPool.tokenIds.length !== previewPool.probabilities.length) {
        throw new Error('Token IDs and probabilities arrays must have same length');
      }

      // Check if this is actually a change
      const isNoChange = currentPool && 
        JSON.stringify(currentPool.tokenIds) === JSON.stringify(previewPool.tokenIds) &&
        JSON.stringify(currentPool.probabilities) === JSON.stringify(previewPool.probabilities);

      if (isNoChange) {
        setSimulationResult({
          isValid: false,
          isNoOp: true,
          message: 'Selected preset matches current pool - no changes needed'
        });
        setIsSimulating(false);
        return;
      }

      // Create simulation result
      setSimulationResult({
        isValid: true,
        preset: previewPool.preset,
        oldPool: currentPool,
        newPool: {
          tokenIds: previewPool.tokenIds,
          probabilities: previewPool.probabilities,
          totalWeight: previewPool.totalWeight
        },
        changes: previewPool.changes,
        functionCall: {
          name: 'setRewardPool',
          args: [previewPool.tokenIds, previewPool.probabilities]
        },
        message: `Will update relics pool to ${previewPool.preset.name}`
      });

    } catch (error) {
      setSimulationResult({
        isValid: false,
        error: error.message
      });
    } finally {
      setIsSimulating(false);
    }
  };

  // Apply pool update
  const applyUpdate = async () => {
    if (!simulationResult?.isValid || !addresses?.MawSacrifice) {
      toast.error('Please simulate the update first');
      return;
    }

    try {
      await writeContract({
        address: addresses.MawSacrifice,
        abi: canonicalAbis.MawSacrifice,
        functionName: 'setRewardPool',
        args: [simulationResult.newPool.tokenIds, simulationResult.newPool.probabilities],
      });

      toast.success('Relics pool update transaction submitted');
    } catch (error) {
      toast.error(`Failed to update pool: ${error.message}`);
    }
  };

  // Reset form after successful update
  useEffect(() => {
    if (isConfirmed) {
      setSelectedPreset('');
      setPreviewPool(null);
      setSimulationResult(null);
      refetchPool();
      toast.success('Relics pool updated successfully!');
    }
  }, [isConfirmed, refetchPool]);

  // Format relic display with names
  const formatRelicDisplayData = (pool) => {
    if (!pool || !pool.tokenIds.length) return [];
    
    return pool.tokenIds.map((tokenId, index) => ({
      tokenId: tokenId,
      name: getRelicName(tokenId),
      displayName: formatRelicDisplay(tokenId),
      probability: pool.probabilities[index],
      percentage: pool.totalWeight > 0 ? ((pool.probabilities[index] / pool.totalWeight) * 100).toFixed(1) : '0.0'
    }));
  };

  return {
    // Current state
    currentPool,
    selectedPreset,
    setSelectedPreset,
    previewPool,
    
    // Presets
    RELICS_PRESETS,
    getPresetData,
    
    // Actions
    previewPreset,
    simulateUpdate,
    applyUpdate,
    
    // Custom pool management
    isCustomMode,
    customPool,
    newRelicId,
    setNewRelicId,
    newRelicProbability,
    setNewRelicProbability,
    switchToCustomMode,
    switchToPresetMode,
    addRelicToPool,
    removeRelicFromPool,
    updateRelicProbability,
    previewCustomPool,
    
    // Simulation
    isSimulating,
    simulationResult,
    
    // Transaction
    isWriting,
    isConfirming,
    isConfirmed,
    txHash,
    writeError,
    
    // Helpers
    formatRelicDisplay: formatRelicDisplayData,
    getRelicName,
    isPending: isWriting || isConfirming,
    hasValidSimulation: simulationResult?.isValid,
    needsSimulation: previewPool && !simulationResult,
    
    // Quick checks
    hasCurrentPool: currentPool && currentPool.tokenIds.length > 0,
    isPoolEmpty: !currentPool || currentPool.tokenIds.length === 0,
    totalRelics: currentPool?.tokenIds.length || 0
  };
}