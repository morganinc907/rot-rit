/**
 * Pool ↔ R2 Diff Analyzer Hook
 * Identifies missing cosmetic assets that could break user experience
 * Updated for slot-based cosmetics system with direct R2 URL testing
 */
import { useState, useCallback } from 'react';
import { useReadContract, useChainId, usePublicClient } from 'wagmi';
import { useContracts } from './useContracts';
import canonicalAbis from '../abis/canonical-abis.json';

export function usePoolR2Diff() {
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const { contracts } = useContracts();

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [diffResults, setDiffResults] = useState(null);
  const [lastAnalyzed, setLastAnalyzed] = useState(null);

  // Read current cosmetic pool from MAW contract (chain-first)
  const { data: cosmeticPool, isLoading: loadingPool, refetch: refetchPool } = useReadContract({
    address: contracts?.MawSacrifice,
    abi: canonicalAbis.MawSacrifice,
    functionName: 'getCosmeticPool',
    query: { enabled: !!contracts?.MawSacrifice }
  });

  // Probe R2 asset availability for a specific cosmetic ID from cosmetics contract
  const probeR2Asset = useCallback(async (cosmeticId) => {
    if (!publicClient || !contracts?.Cosmetics) {
      return null;
    }

    try {
      // Read cosmetic info from chain to get URLs
      const cosmeticInfo = await publicClient.readContract({
        address: contracts.Cosmetics,
        abi: canonicalAbis.Cosmetics,
        functionName: 'getCosmeticInfo',
        args: [cosmeticId],
      });

      const [name, imageURI, previewLayerURI, rarity, slot, monthlySetId, active] = cosmeticInfo;

      // Test both URLs
      const results = [];

      // Test imageURI (catalog display)
      if (imageURI) {
        try {
          const response = await fetch(imageURI, { method: 'HEAD' });
          results.push({
            type: 'imageURI',
            url: imageURI,
            available: response.ok,
            status: response.status,
            error: null
          });
        } catch (error) {
          results.push({
            type: 'imageURI',
            url: imageURI,
            available: false,
            status: null,
            error: error.message
          });
        }
      }

      // Test previewLayerURI (transparent layers)
      if (previewLayerURI) {
        try {
          const response = await fetch(previewLayerURI, { method: 'HEAD' });
          results.push({
            type: 'previewLayerURI',
            url: previewLayerURI,
            available: response.ok,
            status: response.status,
            error: null
          });
        } catch (error) {
          results.push({
            type: 'previewLayerURI',
            url: previewLayerURI,
            available: false,
            status: null,
            error: error.message
          });
        }
      }

      return {
        cosmeticId,
        name,
        slot,
        rarity,
        active,
        assets: results,
        hasImageURI: !!imageURI,
        hasPreviewLayerURI: !!previewLayerURI,
        allAvailable: results.every(r => r.available),
        missingAssets: results.filter(r => !r.available).map(r => r.type)
      };

    } catch (error) {
      return {
        cosmeticId,
        name: 'Unknown',
        slot: -1,
        rarity: 0,
        active: false,
        assets: [],
        hasImageURI: false,
        hasPreviewLayerURI: false,
        allAvailable: false,
        missingAssets: ['imageURI', 'previewLayerURI'],
        error: error.message
      };
    }
  }, [publicClient, contracts]);

  // Run comprehensive pool ↔ R2 diff analysis
  const runPoolR2Analysis = useCallback(async () => {
    if (!cosmeticPool || !cosmeticPool[0] || loadingPool) {
      console.warn('Cannot analyze: cosmetic pool not loaded');
      return;
    }

    setIsAnalyzing(true);
    setDiffResults(null);

    try {
      const [tokenIds, weights, totalWeight] = cosmeticPool;
      const poolIds = tokenIds.map(id => Number(id));
      
      console.log(`Analyzing ${poolIds.length} cosmetic IDs from pool:`, poolIds);

      const analysis = {
        poolIds,
        totalWeight: Number(totalWeight),
        assetCoverage: [],
        summary: {
          totalIds: poolIds.length,
          fullyAvailable: 0,
          partiallyAvailable: 0,
          missingAll: 0,
          totalMissingAssets: 0
        },
        critical: [], // IDs with no assets at all
        warnings: [], // IDs with partial assets
        healthy: []   // IDs with all assets
      };

      // Test each cosmetic ID in the pool
      for (const cosmeticId of poolIds) {
        console.log(`Probing cosmetic ID ${cosmeticId}...`);

        const assetData = await probeR2Asset(cosmeticId);

        if (!assetData) {
          continue;
        }

        const availableCount = assetData.assets.filter(asset => asset.available).length;
        const totalCount = assetData.assets.length;

        const coverage = {
          id: cosmeticId,
          name: assetData.name,
          slot: assetData.slot,
          rarity: assetData.rarity,
          assets: assetData.assets,
          availableCount,
          totalCount,
          coveragePercent: totalCount > 0 ? (availableCount / totalCount * 100).toFixed(1) : '0.0',
          status: availableCount === 0 ? 'critical' :
                  availableCount < totalCount ? 'warning' : 'healthy',
          hasImageURI: assetData.hasImageURI,
          hasPreviewLayerURI: assetData.hasPreviewLayerURI,
          allAvailable: assetData.allAvailable,
          missingAssets: assetData.missingAssets,
          error: assetData.error
        };

        analysis.assetCoverage.push(coverage);

        // Categorize by availability
        if (availableCount === 0) {
          analysis.critical.push(coverage);
          analysis.summary.missingAll++;
        } else if (availableCount < totalCount) {
          analysis.warnings.push(coverage);
          analysis.summary.partiallyAvailable++;
        } else {
          analysis.healthy.push(coverage);
          analysis.summary.fullyAvailable++;
        }

        analysis.summary.totalMissingAssets += (totalCount - availableCount);

        // Brief delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log('Analysis complete:', analysis);
      setDiffResults(analysis);
      setLastAnalyzed(new Date());

    } catch (error) {
      console.error('Pool R2 analysis failed:', error);
      setDiffResults({
        error: error.message,
        poolIds: [],
        assetCoverage: [],
        summary: { totalIds: 0, fullyAvailable: 0, partiallyAvailable: 0, missingAll: 0 },
        critical: [],
        warnings: [],
        healthy: []
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [cosmeticPool, loadingPool, probeR2Asset]);

  // Get analysis summary for display
  const getAnalysisSummary = useCallback(() => {
    if (!diffResults || diffResults.error) {
      return {
        status: 'error',
        message: diffResults?.error || 'No analysis available',
        totalIds: 0,
        missingAssets: 0,
        healthPercent: 0
      };
    }

    const { summary } = diffResults;
    const healthyIds = summary.fullyAvailable;
    const totalIds = summary.totalIds;
    const healthPercent = totalIds > 0 ? (healthyIds / totalIds * 100).toFixed(1) : 0;

    let status = 'healthy';
    let message = `${healthyIds}/${totalIds} cosmetics fully available`;

    if (summary.missingAll > 0) {
      status = 'critical';
      message = `${summary.missingAll} cosmetics have NO assets available`;
    } else if (summary.partiallyAvailable > 0) {
      status = 'warning';  
      message = `${summary.partiallyAvailable} cosmetics missing some assets`;
    }

    return {
      status,
      message,
      totalIds,
      missingAssets: summary.totalMissingAssets,
      healthPercent: parseFloat(healthPercent)
    };
  }, [diffResults]);

  // Helper to get cosmetic slot names for new slot-based system
  const getSlotName = useCallback((slot) => {
    const slotNames = {
      0: 'HEAD',
      1: 'FACE',
      2: 'BODY',
      3: 'FUR',
      4: 'BACKGROUND'
    };
    return slotNames[slot] || `Slot ${slot}`;
  }, []);

  // Generate upload checklist for missing assets
  const generateUploadChecklist = useCallback(() => {
    if (!diffResults) return null;

    const checklist = [];

    [...diffResults.critical, ...diffResults.warnings].forEach(coverage => {
      const missingAssets = coverage.assets.filter(asset => !asset.available);
      missingAssets.forEach(asset => {
        checklist.push({
          cosmeticId: coverage.id,
          type: asset.type,
          expectedFileName: `cosmetic_${coverage.id}.png`, // R2 convention
          directUrl: asset.url,
          priority: coverage.status === 'critical' ? 'HIGH' : 'MEDIUM',
          slot: getSlotName(coverage.slot)
        });
      });
    });

    return checklist;
  }, [diffResults, getSlotName]);

  // Helper to get slot name from cosmetic ID (slot-based system)
  const getSlotFromId = useCallback((cosmeticId) => {
    if (cosmeticId >= 1000 && cosmeticId < 2000) return 0; // HEAD
    if (cosmeticId >= 2000 && cosmeticId < 3000) return 1; // FACE
    if (cosmeticId >= 3000 && cosmeticId < 4000) return 2; // BODY
    if (cosmeticId >= 4000 && cosmeticId < 5000) return 3; // FUR
    if (cosmeticId >= 5000 && cosmeticId < 6000) return 4; // BACKGROUND
    return -1; // Unknown
  }, []);

  // Export missing assets list as CSV
  const exportMissingAssetsCsv = useCallback(() => {
    const checklist = generateUploadChecklist();
    if (!checklist || checklist.length === 0) {
      return 'No missing assets to export.';
    }

    const headers = ['Priority,Cosmetic ID,Type,Slot,Expected Filename,Direct URL'];
    const rows = checklist.map(item => 
      `${item.priority},${item.cosmeticId},${item.type},${item.slot},"${item.expectedFileName}","${item.directUrl}"`
    );
    
    return [headers, ...rows].join('\n');
  }, [generateUploadChecklist]);

  return {
    // State  
    isAnalyzing,
    diffResults,
    lastAnalyzed,
    loadingPool,

    // Actions
    runPoolR2Analysis,
    refetchPool,

    // Data Processing
    getAnalysisSummary,
    generateUploadChecklist,
    exportMissingAssetsCsv,
    getSlotName,

    // Raw data
    cosmeticPool
  };
}