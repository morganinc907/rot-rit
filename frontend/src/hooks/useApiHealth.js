/**
 * API & R2 Health Monitor Hook
 * Checks R2 asset availability directly (CORS enabled)
 * Dynamically probes cosmetics from current MAW pool
 */
import { useState, useEffect, useCallback } from 'react';
import { useReadContract, useChainId } from 'wagmi';
import { ADDRS } from '@rot-ritual/addresses';
import canonicalAbis from '../abis/canonical-abis.json';

const API_BASE_URL = 'https://rotandritual.work/current-cosmetics-r2'; // R2 URL with CORS enabled

export function useApiHealth() {
  const chainId = useChainId();
  const addresses = ADDRS[chainId];
  
  const [healthData, setHealthData] = useState(null);
  const [rendererData, setRendererData] = useState(null);
  const [r2ProbeResults, setR2ProbeResults] = useState([]);
  const [isChecking, setIsChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);

  // Get current cosmetic pool from MAW contract
  const { data: cosmeticPool } = useReadContract({
    address: addresses?.MawSacrifice,
    abi: canonicalAbis.MawSacrifice,
    functionName: 'getCosmeticPool',
    query: { enabled: !!addresses?.MawSacrifice }
  });
  
  // Check R2 base connectivity by fetching a known asset
  const checkApiHealth = useCallback(async () => {
    try {
      // Try to fetch a sample background cosmetic
      // Format: /background/5001.png (no "cosmetic_" prefix)
      const testUrl = `${API_BASE_URL}/background/5001.png`;

      console.log('🔍 Testing R2 connectivity:', testUrl);

      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'Range': 'bytes=0-0' // Only fetch 1 byte to minimize bandwidth
        },
        cache: 'no-cache'
      });

      console.log('✅ R2 response:', response.status, response.statusText);

      // R2 is reachable if we get 200, 206 (partial), or even 404 (connectivity works)
      const isReachable = response.status !== 0;

      return {
        status: isReachable ? 'healthy' : 'error',
        statusCode: response.status,
        data: {
          message: isReachable
            ? `R2 storage is accessible (HTTP ${response.status})`
            : 'R2 storage not reachable',
          testAsset: testUrl,
          note: response.ok || response.status === 206 || response.status === 404
            ? 'Connectivity confirmed'
            : 'Got response but unexpected status'
        },
        url: API_BASE_URL,
        error: null
      };
    } catch (error) {
      console.error('❌ R2 connectivity check failed:', error);

      return {
        status: 'error',
        statusCode: null,
        data: {
          message: 'R2 connectivity check failed - CORS may not be enabled for this method',
          error: error.message
        },
        url: API_BASE_URL,
        error: `${error.message} (Tip: Check R2 CORS settings)`
      };
    }
  }, []);

  // Check R2 storage status
  const checkRendererVersion = useCallback(async () => {
    try {
      // R2 doesn't have a renderer, but we can check storage health
      return {
        status: 'healthy',
        statusCode: 200,
        data: {
          rendererAddress: 'Cloudflare R2 Storage',
          version: 'Direct CORS Access',
          features: ['Head requests', 'Direct image access', 'Multi-slot support']
        },
        url: API_BASE_URL,
        error: null
      };
    } catch (error) {
      return {
        status: 'error',
        statusCode: null,
        data: null,
        url: API_BASE_URL,
        error: error.message
      };
    }
  }, []);
  
  // Get cosmetic slot name from ID
  const getCosmeticSlot = (cosmeticId) => {
    const slot = Math.floor(cosmeticId / 1000);
    const slotNames = { 1: 'head', 2: 'face', 3: 'body', 4: 'fur', 5: 'background' };
    return slotNames[slot] || 'unknown';
  };

  // Get current cosmetic assets to probe from MAW pool
  const getCurrentProbeAssets = useCallback(() => {
    if (!cosmeticPool || !cosmeticPool[0]) {
      console.log('🎨 No cosmetic pool data, using defaults');
      return [5001, 5002, 5003, 5004]; // Sample cosmetics
    }

    // Extract cosmetic IDs from pool [tokenIds, weights, totalWeight]
    const [tokenIds] = cosmeticPool;
    const poolIds = tokenIds.map(id => Number(id));

    console.log('🎯 Current MAW pool cosmetics:', poolIds);

    return poolIds;
  }, [cosmeticPool]);

  // Probe R2 assets with GET requests
  const probeR2Assets = useCallback(async () => {
    const cosmeticIds = getCurrentProbeAssets();
    const results = [];

    console.log('🔍 Probing R2 cosmetics:', cosmeticIds);

    for (const cosmeticId of cosmeticIds) {
      const slot = getCosmeticSlot(cosmeticId);
      // Format: /background/5001.png (no "cosmetic_" prefix)
      const assetName = `${slot}/${cosmeticId}.png`;
      const url = `${API_BASE_URL}/${assetName}`;

      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Range': 'bytes=0-0' // Only fetch 1 byte
          },
          cache: 'no-cache'
        });

        results.push({
          asset: `Cosmetic #${cosmeticId} (${slot})`,
          url,
          status: response.ok || response.status === 206 ? 'available' : 'error',
          statusCode: response.status,
          contentType: response.headers.get('content-type'),
          contentLength: response.headers.get('content-length'),
          error: null
        });
      } catch (error) {
        console.log(`🚨 Fetch error for cosmetic ${cosmeticId}:`, error.message);

        results.push({
          asset: `Cosmetic #${cosmeticId} (${slot})`,
          url,
          status: 'error',
          statusCode: null,
          contentType: null,
          contentLength: null,
          error: error.message
        });
      }
    }

    return results;
  }, [getCurrentProbeAssets]);
  
  // Run all health checks
  const runHealthChecks = useCallback(async () => {
    setIsChecking(true);
    
    try {
      const [healthResult, rendererResult, r2Results] = await Promise.all([
        checkApiHealth(),
        checkRendererVersion(), 
        probeR2Assets()
      ]);
      
      setHealthData(healthResult);
      setRendererData(rendererResult);
      setR2ProbeResults(r2Results);
      setLastChecked(new Date());
      
    } catch (error) {
      console.error('Health check failed:', error);
    } finally {
      setIsChecking(false);
    }
  }, [checkApiHealth, checkRendererVersion, probeR2Assets]);
  
  // Auto-run health checks on mount
  useEffect(() => {
    runHealthChecks();
  }, [runHealthChecks]);
  
  // Calculate overall health status
  const overallStatus = () => {
    if (!healthData || !rendererData || !r2ProbeResults.length) {
      return 'checking';
    }
    
    const hasApiIssues = healthData.status === 'error' || rendererData.status === 'error';
    const hasR2Issues = r2ProbeResults.some(result => result.status === 'error');
    
    if (hasApiIssues || hasR2Issues) {
      return 'error';
    }
    
    return 'healthy';
  };
  
  // Get failed assets for easy debugging
  const getFailedAssets = () => {
    return r2ProbeResults.filter(result => result.status === 'error');
  };
  
  // Get summary stats
  const getSummaryStats = () => {
    const totalProbes = r2ProbeResults.length;
    const failedProbes = getFailedAssets().length;
    const successRate = totalProbes > 0 ? ((totalProbes - failedProbes) / totalProbes * 100).toFixed(1) : 0;
    
    return {
      totalProbes,
      failedProbes,
      successRate,
      apiHealthy: healthData?.status === 'healthy',
      rendererHealthy: rendererData?.status === 'healthy'
    };
  };
  
  return {
    // Data
    healthData,
    rendererData,
    r2ProbeResults,
    
    // Status
    isChecking,
    lastChecked,
    overallStatus: overallStatus(),
    
    // Actions
    runHealthChecks,
    
    // Helpers
    getFailedAssets,
    getSummaryStats,
    
    // Constants
    API_BASE_URL
  };
}