/**
 * Key Price Management Hook
 * Handles key price updates with validation and simulation
 */
import { useState, useEffect } from 'react';
import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { ADDRS } from '@rot-ritual/addresses';
import canonicalAbis from '../abis/canonical-abis.json';
import toast from 'react-hot-toast';

export function useKeyPriceManager() {
  const chainId = useChainId();
  const addresses = ADDRS[chainId];
  
  const [newPrice, setNewPrice] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);
  const [priceWarnings, setPriceWarnings] = useState([]);

  // Get current key price
  const { data: currentPrice, refetch: refetchPrice } = useReadContract({
    address: addresses?.KeyShop,
    abi: canonicalAbis.KeyShop,
    functionName: 'keyPrice',
    query: {
      enabled: !!addresses?.KeyShop,
      staleTime: 30000,
    }
  });

  // Write contract hook for price update
  const { writeContract, data: txHash, isPending: isWriting, error: writeError } = useWriteContract();

  // Wait for transaction confirmation
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Price validation and warnings
  const validatePrice = (priceEth) => {
    const warnings = [];
    const price = parseFloat(priceEth);
    
    if (isNaN(price) || price <= 0) {
      warnings.push({ type: 'error', message: 'Price must be a positive number' });
      return warnings;
    }

    // Price range warnings
    if (price < 0.001) {
      warnings.push({ type: 'warning', message: 'Price is very low (< 0.001 ETH)' });
    } else if (price > 1) {
      warnings.push({ type: 'warning', message: 'Price is very high (> 1 ETH)' });
    }

    // Change magnitude warnings
    if (currentPrice) {
      const currentPriceEth = parseFloat(formatEther(currentPrice));
      const changeRatio = price / currentPriceEth;
      
      if (changeRatio > 10) {
        warnings.push({ type: 'critical', message: `Price increase of ${(changeRatio * 100).toFixed(0)}% - verify this is intentional` });
      } else if (changeRatio < 0.1) {
        warnings.push({ type: 'critical', message: `Price decrease of ${((1 - changeRatio) * 100).toFixed(0)}% - verify this is intentional` });
      } else if (changeRatio > 2) {
        warnings.push({ type: 'warning', message: `Price increase of ${((changeRatio - 1) * 100).toFixed(0)}%` });
      } else if (changeRatio < 0.5) {
        warnings.push({ type: 'warning', message: `Price decrease of ${((1 - changeRatio) * 100).toFixed(0)}%` });
      }
    }

    return warnings;
  };

  // Simulate price update
  const simulateUpdate = async () => {
    if (!newPrice || !addresses?.KeyShop) return;

    setIsSimulating(true);
    try {
      const priceWei = parseEther(newPrice);
      const warnings = validatePrice(newPrice);
      
      const simulation = {
        oldPrice: currentPrice ? formatEther(currentPrice) : '0',
        newPrice: newPrice,
        priceWei: priceWei,
        warnings: warnings,
        isValid: warnings.every(w => w.type !== 'error'),
        changePercent: currentPrice ? 
          (((parseFloat(newPrice) / parseFloat(formatEther(currentPrice))) - 1) * 100).toFixed(1) :
          null
      };

      setSimulationResult(simulation);
      setPriceWarnings(warnings);
    } catch (error) {
      const errorWarnings = [{ type: 'error', message: `Invalid price format: ${error.message}` }];
      setPriceWarnings(errorWarnings);
      setSimulationResult(null);
    } finally {
      setIsSimulating(false);
    }
  };

  // Execute price update
  const updatePrice = async () => {
    if (!simulationResult?.isValid || !addresses?.KeyShop) {
      toast.error('Please simulate the update first');
      return;
    }

    try {
      await writeContract({
        address: addresses.KeyShop,
        abi: canonicalAbis.KeyShop,
        functionName: 'setKeyPrice',
        args: [simulationResult.priceWei],
      });

      toast.success('Price update transaction submitted');
    } catch (error) {
      toast.error(`Failed to update price: ${error.message}`);
    }
  };

  // Reset form after successful update
  useEffect(() => {
    if (isConfirmed) {
      setNewPrice('');
      setSimulationResult(null);
      setPriceWarnings([]);
      refetchPrice();
      toast.success('Key price updated successfully!');
    }
  }, [isConfirmed, refetchPrice]);

  // Auto-simulate when price changes
  useEffect(() => {
    if (newPrice && newPrice !== simulationResult?.newPrice) {
      const timeoutId = setTimeout(simulateUpdate, 500); // Debounce
      return () => clearTimeout(timeoutId);
    }
  }, [newPrice]);

  return {
    // Current state
    currentPrice: currentPrice ? formatEther(currentPrice) : null,
    newPrice,
    setNewPrice,
    
    // Simulation
    isSimulating,
    simulationResult,
    priceWarnings,
    simulateUpdate,
    
    // Transaction
    updatePrice,
    isWriting,
    isConfirming,
    isConfirmed,
    txHash,
    writeError,
    
    // Helpers
    hasValidSimulation: simulationResult?.isValid,
    isPending: isWriting || isConfirming,
    formatPrice: (wei) => wei ? formatEther(wei) : '0',
    
    // Price validation utility
    validatePrice
  };
}