/**
 * Live Metrics Hook
 * Tracks real-time protocol activity and performance metrics
 */
import { useState, useEffect } from 'react';
import { useReadContract, useWatchContractEvent, usePublicClient, useChainId } from 'wagmi';
import { ADDRS } from '@rot-ritual/addresses';
import canonicalAbis from '../abis/canonical-abis.json';

export function useLiveMetrics() {
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const addresses = ADDRS[chainId];

  // Metrics state
  const [metrics, setMetrics] = useState({
    keysSoldToday: 0,
    revenueToday: 0n,
    activeRaccoons: 0,
    sacrificesToday: 0,
    recentTransactions: [],
    rpcHealth: {
      currentBlock: 0,
      latency: 0,
      status: 'unknown'
    }
  });

  const [dailyResetTime, setDailyResetTime] = useState(null);

  // Get current key ID and price
  const { data: keyId } = useReadContract({
    address: addresses?.Relics,
    abi: canonicalAbis.Relics,
    functionName: 'keyId',
    query: { enabled: !!addresses?.Relics }
  });

  const { data: keyPrice } = useReadContract({
    address: addresses?.MawSacrifice,
    abi: canonicalAbis.MawSacrifice,
    functionName: 'keyPrice',
    query: { enabled: !!addresses?.MawSacrifice }
  });

  // Get total raccoons supply
  const { data: totalRaccoons } = useReadContract({
    address: addresses?.Raccoons,
    abi: canonicalAbis.Raccoons,
    functionName: 'totalSupply',
    query: { 
      enabled: !!addresses?.Raccoons,
      staleTime: 30000 // 30 second cache
    }
  });

  // Initialize daily reset time (UTC midnight)
  useEffect(() => {
    const now = new Date();
    const utcMidnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    setDailyResetTime(utcMidnight.getTime());
    
    // Reset counters at midnight
    const msUntilMidnight = utcMidnight.getTime() + 24 * 60 * 60 * 1000 - now.getTime();
    const midnightTimer = setTimeout(() => {
      setMetrics(prev => ({
        ...prev,
        keysSoldToday: 0,
        revenueToday: 0n,
        sacrificesToday: 0
      }));
      setDailyResetTime(utcMidnight.getTime() + 24 * 60 * 60 * 1000);
    }, msUntilMidnight);

    return () => clearTimeout(midnightTimer);
  }, []);

  // Helper to check if event is from today
  const isFromToday = (blockTimestamp) => {
    if (!dailyResetTime) return false;
    return (blockTimestamp * 1000) >= dailyResetTime;
  };

  // Helper to add transaction to recent list
  const addRecentTransaction = (tx) => {
    setMetrics(prev => ({
      ...prev,
      recentTransactions: [tx, ...prev.recentTransactions.slice(0, 19)] // Keep last 20
    }));
  };

  // Watch for key sales (TransferSingle events where id = keyId, to != zero address)
  useWatchContractEvent({
    address: addresses?.Relics,
    abi: canonicalAbis.Relics,
    eventName: 'TransferSingle',
    onLogs: async (logs) => {
      for (const log of logs) {
        const { operator, from, to, id, value } = log.args;
        
        // Check if this is a key mint/sale
        if (id === keyId && from === '0x0000000000000000000000000000000000000000' && to !== '0x0000000000000000000000000000000000000000') {
          // Get block to check timestamp
          try {
            const block = await publicClient.getBlock({ blockNumber: log.blockNumber });
            
            if (isFromToday(Number(block.timestamp))) {
              const revenue = keyPrice ? BigInt(value) * keyPrice : 0n;
              
              setMetrics(prev => ({
                ...prev,
                keysSoldToday: prev.keysSoldToday + Number(value),
                revenueToday: prev.revenueToday + revenue
              }));
            }

            // Add to recent transactions
            addRecentTransaction({
              type: 'Key Sale',
              hash: log.transactionHash,
              blockNumber: log.blockNumber,
              timestamp: Number(block.timestamp),
              details: `${value} key(s) to ${to.slice(0, 8)}...`,
              value: Number(value)
            });
          } catch (error) {
            console.error('Error processing key sale event:', error);
          }
        }
      }
    },
    enabled: !!addresses?.Relics && !!keyId
  });

  // Watch for sacrifices
  useWatchContractEvent({
    address: addresses?.MawSacrifice,
    abi: canonicalAbis.MawSacrifice,
    eventName: 'Sacrifice', // Adjust event name based on your contract
    onLogs: async (logs) => {
      for (const log of logs) {
        try {
          const block = await publicClient.getBlock({ blockNumber: log.blockNumber });
          
          if (isFromToday(Number(block.timestamp))) {
            setMetrics(prev => ({
              ...prev,
              sacrificesToday: prev.sacrificesToday + 1
            }));
          }

          // Add to recent transactions
          addRecentTransaction({
            type: 'Sacrifice',
            hash: log.transactionHash,
            blockNumber: log.blockNumber,
            timestamp: Number(block.timestamp),
            details: `Raccoon sacrificed`,
            value: 1
          });
        } catch (error) {
          console.error('Error processing sacrifice event:', error);
        }
      }
    },
    enabled: !!addresses?.MawSacrifice
  });

  // Monitor RPC health
  useEffect(() => {
    const checkRpcHealth = async () => {
      if (!publicClient) return;

      const startTime = Date.now();
      try {
        const blockNumber = await publicClient.getBlockNumber();
        const latency = Date.now() - startTime;

        setMetrics(prev => ({
          ...prev,
          rpcHealth: {
            currentBlock: Number(blockNumber),
            latency,
            status: latency < 1000 ? 'good' : latency < 3000 ? 'slow' : 'poor'
          }
        }));
      } catch (error) {
        setMetrics(prev => ({
          ...prev,
          rpcHealth: {
            ...prev.rpcHealth,
            status: 'error'
          }
        }));
      }
    };

    // Check immediately and then every 30 seconds
    checkRpcHealth();
    const healthInterval = setInterval(checkRpcHealth, 30000);

    return () => clearInterval(healthInterval);
  }, [publicClient]);

  // Update active raccoons count
  useEffect(() => {
    if (totalRaccoons !== undefined) {
      setMetrics(prev => ({
        ...prev,
        activeRaccoons: Number(totalRaccoons)
      }));
    }
  }, [totalRaccoons]);

  // Calculate revenue in ETH for display
  const revenueInEth = keyPrice ? Number(metrics.revenueToday) / Number(keyPrice) : 0;

  return {
    metrics: {
      ...metrics,
      revenueInEth,
      keyPrice: keyPrice ? Number(keyPrice) : 0
    },
    
    // Formatted display helpers
    formatRevenue: () => {
      if (revenueInEth === 0) return '0 ETH';
      return `${revenueInEth.toFixed(4)} ETH`;
    },

    formatLatency: () => {
      const { latency, status } = metrics.rpcHealth;
      const statusEmoji = {
        good: '🟢',
        slow: '🟡', 
        poor: '🔴',
        error: '❌',
        unknown: '⚪'
      };
      return `${statusEmoji[status]} ${latency}ms`;
    },

    formatRecentTx: (tx) => {
      const timeAgo = Math.floor((Date.now() / 1000) - tx.timestamp);
      const timeStr = timeAgo < 60 ? `${timeAgo}s ago` : 
                     timeAgo < 3600 ? `${Math.floor(timeAgo / 60)}m ago` :
                     `${Math.floor(timeAgo / 3600)}h ago`;
      return `${tx.type}: ${tx.details} (${timeStr})`;
    },

    // Health status
    getRpcHealthStatus: () => metrics.rpcHealth.status,
    isRpcHealthy: () => ['good', 'slow'].includes(metrics.rpcHealth.status),
    
    // Daily progress
    getDailyProgress: () => ({
      keys: metrics.keysSoldToday,
      revenue: revenueInEth,
      sacrifices: metrics.sacrificesToday,
      resetTime: dailyResetTime
    })
  };
}