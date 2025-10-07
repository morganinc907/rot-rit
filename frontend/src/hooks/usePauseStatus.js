/**
 * Pause Status Hook
 * Monitors emergency pause states for operational awareness
 */
import { useReadContract, useWatchContractEvent } from 'wagmi';
import { useContractSDK } from './useContractSDK';
import canonicalAbis from '../abis/canonical-abis.json';

export function usePauseStatus() {
  const { contracts, isSupported } = useContractSDK();

  // Get comprehensive pause status
  const { data: pauseStatus, refetch: refetchPauseStatus, isLoading } = useReadContract({
    address: contracts?.MawSacrifice,
    abi: canonicalAbis.MawSacrifice,
    functionName: 'getPauseStatus',
    query: {
      enabled: !!contracts?.MawSacrifice && isSupported,
      staleTime: 0, // Always fresh for emergency states
    },
  });

  // Watch for pause events
  useWatchContractEvent({
    address: contracts?.MawSacrifice,
    abi: canonicalAbis.MawSacrifice,
    eventName: 'Paused',
    onLogs() {
      refetchPauseStatus();
    },
    enabled: !!contracts?.MawSacrifice && isSupported,
  });

  useWatchContractEvent({
    address: contracts?.MawSacrifice,
    abi: canonicalAbis.MawSacrifice,
    eventName: 'Unpaused',
    onLogs() {
      refetchPauseStatus();
    },
    enabled: !!contracts?.MawSacrifice && isSupported,
  });

  useWatchContractEvent({
    address: contracts?.MawSacrifice,
    abi: canonicalAbis.MawSacrifice,
    eventName: 'SacrificesPauseChanged',
    onLogs() {
      refetchPauseStatus();
    },
    enabled: !!contracts?.MawSacrifice && isSupported,
  });

  useWatchContractEvent({
    address: contracts?.MawSacrifice,
    abi: canonicalAbis.MawSacrifice,
    eventName: 'ConversionsPauseChanged',
    onLogs() {
      refetchPauseStatus();
    },
    enabled: !!contracts?.MawSacrifice && isSupported,
  });

  // Parse pause status
  const parseStatus = (status) => {
    if (!status) return null;
    
    const [globalPaused, sacrificesPaused, conversionsPaused] = status;
    
    return {
      global: globalPaused,
      sacrifices: sacrificesPaused,
      conversions: conversionsPaused,
      anyPaused: globalPaused || sacrificesPaused || conversionsPaused,
      allPaused: globalPaused,
      criticalPaused: globalPaused || sacrificesPaused, // Affects main functionality
    };
  };

  const parsed = parseStatus(pauseStatus);

  return {
    pauseStatus: parsed,
    isLoading,
    refetch: refetchPauseStatus,
    
    // Helper methods
    isOperational: () => parsed && !parsed.anyPaused,
    isPaused: () => parsed && parsed.anyPaused,
    isCriticallyPaused: () => parsed && parsed.criticalPaused,
    
    // Status descriptions
    getStatusMessage: () => {
      if (!parsed) return 'Loading pause status...';
      if (parsed.allPaused) return 'EMERGENCY: All operations paused';
      if (parsed.sacrifices && parsed.conversions) return 'All rituals paused';
      if (parsed.sacrifices) return 'Sacrifices paused';
      if (parsed.conversions) return 'Conversions paused';
      return 'All systems operational';
    },
    
    getSeverity: () => {
      if (!parsed) return 'info';
      if (parsed.allPaused) return 'critical';
      if (parsed.criticalPaused) return 'high';
      if (parsed.anyPaused) return 'medium';
      return 'normal';
    }
  };
}