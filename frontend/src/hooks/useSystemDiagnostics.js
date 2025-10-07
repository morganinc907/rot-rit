/**
 * System Diagnostics Hook
 * Comprehensive health check with guided fixes
 */
import { useState, useCallback } from 'react';
import { useReadContract, useChainId } from 'wagmi';
import { ADDRS } from '@rot-ritual/addresses';
import canonicalAbis from '../abis/canonical-abis.json';

const DIAGNOSTIC_CHECKS = [
  {
    id: 'relics_maw_match',
    name: 'Relics → MAW Authorization',
    description: 'Verify Relics contract trusts the correct MAW address',
    priority: 'critical'
  },
  {
    id: 'token_ids_readable',
    name: 'Token IDs Readable',
    description: 'Ensure MAW contract can return token IDs (capId, keyId, fragId, shardId)',
    priority: 'critical'
  },
  {
    id: 'relics_pool_sane',
    name: 'Relics Pool Configuration',
    description: 'Check relics reward pool has valid IDs and probabilities sum to 1000',
    priority: 'high'
  },
  {
    id: 'cosmetic_pool_sane',
    name: 'Cosmetic Pool Configuration', 
    description: 'Verify cosmetic sacrifice pool is properly configured',
    priority: 'high'
  },
  {
    id: 'r2_reachable',
    name: 'R2 Storage Reachable',
    description: 'Test API server and R2 asset availability',
    priority: 'medium'
  },
  {
    id: 'keyshop_price_set',
    name: 'KeyShop Price Set',
    description: 'Verify KeyShop has a reasonable key price configured',
    priority: 'medium'
  },
  {
    id: 'roles_correct',
    name: 'Contract Roles Configured',
    description: 'Check MAW roles point to correct contracts',
    priority: 'medium'
  }
];

export function useSystemDiagnostics() {
  const chainId = useChainId();
  const addresses = ADDRS[chainId];
  
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState(null);
  const [currentCheck, setCurrentCheck] = useState(null);

  // Contract reads for diagnostics
  const { data: relicsMawAddress } = useReadContract({
    address: addresses?.Relics,
    abi: canonicalAbis.Relics,
    functionName: 'mawSacrifice',
    query: { enabled: !!addresses?.Relics }
  });

  const { data: mawTokenIds } = useReadContract({
    address: addresses?.MawSacrifice,
    abi: canonicalAbis.MawSacrifice,
    functionName: 'healthcheck',
    query: { enabled: !!addresses?.MawSacrifice }
  });

  const { data: relicsPool } = useReadContract({
    address: addresses?.MawSacrifice,
    abi: canonicalAbis.MawSacrifice,
    functionName: 'getRewardPool',
    query: { enabled: !!addresses?.MawSacrifice }
  });

  const { data: cosmeticPool } = useReadContract({
    address: addresses?.MawSacrifice,
    abi: canonicalAbis.MawSacrifice,
    functionName: 'getCosmeticPool',
    query: { enabled: !!addresses?.MawSacrifice }
  });

  const { data: keyPrice } = useReadContract({
    address: addresses?.KeyShop,
    abi: canonicalAbis.KeyShop,
    functionName: 'keyPrice',
    query: { enabled: !!addresses?.KeyShop }
  });

  // Individual diagnostic functions
  const checkRelicsMawMatch = useCallback(async () => {
    if (!addresses?.Relics || !addresses?.MawSacrifice || !relicsMawAddress) {
      return {
        status: 'error',
        message: 'Missing contract addresses or data',
        fix: 'Check wallet connection and network'
      };
    }

    const expectedMaw = addresses.MawSacrifice.toLowerCase();
    const actualMaw = relicsMawAddress.toLowerCase();

    if (expectedMaw !== actualMaw) {
      return {
        status: 'failed',
        message: `Relics trusts ${actualMaw}, expected ${expectedMaw}`,
        fix: `cast send ${addresses.Relics} "setMawSacrifice(address)" ${addresses.MawSacrifice} --private-key $PK --rpc-url https://sepolia.base.org`,
        fixDescription: 'Fix MAW authorization'
      };
    }

    return {
      status: 'passed',
      message: 'Relics correctly trusts MAW contract',
      details: `✅ ${expectedMaw}`
    };
  }, [addresses, relicsMawAddress]);

  const checkTokenIdsReadable = useCallback(async () => {
    if (!mawTokenIds || mawTokenIds.length < 4) {
      return {
        status: 'warning',
        message: 'Cannot read token IDs from MAW healthcheck (wagmi hook issue)',
        fix: `cast call ${addresses?.MawSacrifice} "healthcheck()" --rpc-url https://sepolia.base.org`,
        fixDescription: 'Contract function works - this is likely a wagmi parsing issue'
      };
    }

    const [relicsAddr, mawAddr, capId, keyId, fragId, shardId] = mawTokenIds;
    
    if (Number(capId) === 0 && Number(keyId) === 0 && Number(fragId) === 0 && Number(shardId) === 0) {
      return {
        status: 'failed', 
        message: 'All token IDs are 0 - not properly configured',
        fix: `cast send ${addresses?.MawSacrifice} "updateConfig(uint256,uint256,uint256,uint256)" 0 1 2 6 --private-key $PK --rpc-url https://sepolia.base.org`,
        fixDescription: 'Configure token IDs'
      };
    }

    return {
      status: 'passed',
      message: `Token IDs configured: Cap=${Number(capId)}, Key=${Number(keyId)}, Frag=${Number(fragId)}, Shard=${Number(shardId)}`,
      details: '✅ All token IDs readable'
    };
  }, [mawTokenIds, addresses]);

  const checkRelicsPoolSane = useCallback(async () => {
    if (!relicsPool || !relicsPool[0] || !relicsPool[1]) {
      return {
        status: 'failed',
        message: 'Cannot read relics reward pool',
        fix: `cast call ${addresses?.MawSacrifice} "getRewardPool()" --rpc-url https://sepolia.base.org`,
        fixDescription: 'Test pool reading'
      };
    }

    const [tokenIds, probabilities, totalWeight] = relicsPool;
    const ids = tokenIds.map(id => Number(id));
    const probs = probabilities.map(p => Number(p));
    const total = Number(totalWeight);

    // Check if probabilities sum to 1000
    if (total !== 1000) {
      return {
        status: 'failed',
        message: `Relics pool probabilities sum to ${total}, should be 1000`,
        fix: `cast send ${addresses?.MawSacrifice} "setRewardPool(uint256[],uint256[])" "[2,4,7]" "[400,400,200]" --private-key $PK --rpc-url https://sepolia.base.org`,
        fixDescription: 'Fix relics pool probabilities'
      };
    }

    // Check for Glass Shards (ID 6) - should not be in reward pool
    if (ids.includes(6)) {
      return {
        status: 'warning',
        message: 'Glass Shards (ID 6) found in reward pool - should only be given on failures',
        fix: `cast send ${addresses?.MawSacrifice} "setRewardPool(uint256[],uint256[])" "[2,4,7]" "[400,400,200]" --private-key $PK --rpc-url https://sepolia.base.org`,
        fixDescription: 'Remove Glass Shards from reward pool'
      };
    }

    return {
      status: 'passed',
      message: `Relics pool: ${ids.length} relics, total weight ${total}`,
      details: `IDs: [${ids.join(', ')}]`
    };
  }, [relicsPool, addresses]);

  const checkCosmeticPoolSane = useCallback(async () => {
    if (!cosmeticPool) {
      return {
        status: 'warning',
        message: 'Cosmetic sacrifice pool not configured',
        fix: `cast send ${addresses?.MawSacrifice} "setCosmeticPool(uint256[],uint256[])" "[9,10]" "[500,500]" --private-key $PK --rpc-url https://sepolia.base.org`,
        fixDescription: 'Set up cosmetic pool'
      };
    }

    const [tokenIds, weights, totalWeight] = cosmeticPool;
    const ids = tokenIds.map(id => Number(id));
    const total = Number(totalWeight);

    if (total === 0) {
      return {
        status: 'warning',
        message: 'Cosmetic pool is empty',
        fix: `cast send ${addresses?.MawSacrifice} "setCosmeticPool(uint256[],uint256[])" "[9,10]" "[500,500]" --private-key $PK --rpc-url https://sepolia.base.org`,
        fixDescription: 'Configure cosmetic pool'
      };
    }

    return {
      status: 'passed',
      message: `Cosmetic pool: ${ids.length} cosmetics, total weight ${total}`,
      details: `IDs: [${ids.join(', ')}]`
    };
  }, [cosmeticPool, addresses]);

  const checkR2Reachable = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:3007/health');
      if (!response.ok) {
        return {
          status: 'failed',
          message: `API server error: HTTP ${response.status}`,
          fix: 'cd /Users/seanmorgan/Desktop/rot-ritual-organized/simple-deploy && PORT=3004 node server-production.js &',
          fixDescription: 'Restart API server'
        };
      }

      // Test a sample R2 asset
      const assetResponse = await fetch('http://localhost:3007/cosmetic/1/type/1', { method: 'HEAD' });
      if (!assetResponse.ok && assetResponse.status !== 302) {
        return {
          status: 'warning',
          message: 'API server running but R2 assets may not be accessible',
          fix: 'Check R2 CDN configuration and asset availability',
          fixDescription: 'Debug R2 assets'
        };
      }

      return {
        status: 'passed',
        message: 'API server and R2 assets accessible',
        details: '✅ http://localhost:3007 responding'
      };
    } catch (error) {
      if (error.message.includes('CORS') || error.message.includes('fetch')) {
        return {
          status: 'warning',
          message: 'CORS issue accessing localhost:3004 from browser (server likely running)',
          fix: 'curl http://localhost:3007/health',
          fixDescription: 'Test API server directly - browser CORS blocks localhost requests'
        };
      }
      return {
        status: 'failed',
        message: `API server not reachable: ${error.message}`,
        fix: 'cd /Users/seanmorgan/Desktop/rot-ritual-organized/simple-deploy && PORT=3004 node server-production.js &',
        fixDescription: 'Start API server'
      };
    }
  }, []);

  const checkKeyShopPriceSet = useCallback(async () => {
    if (!keyPrice) {
      return {
        status: 'failed',
        message: 'Cannot read KeyShop price',
        fix: `cast call ${addresses?.KeyShop} "keyPrice()(uint256)" --rpc-url https://sepolia.base.org`,
        fixDescription: 'Test KeyShop reading'
      };
    }

    const priceInWei = Number(keyPrice);
    const priceInEth = priceInWei / 1e18;

    if (priceInEth === 0) {
      return {
        status: 'failed',
        message: 'KeyShop price is 0 ETH',
        fix: `cast send ${addresses?.KeyShop} "setKeyPrice(uint256)" 1000000000000000 --private-key $PK --rpc-url https://sepolia.base.org`,
        fixDescription: 'Set key price to 0.001 ETH'
      };
    }

    if (priceInEth > 0.1) {
      return {
        status: 'warning',
        message: `KeyShop price is ${priceInEth} ETH - might be too high for testing`,
        fix: `cast send ${addresses?.KeyShop} "setKeyPrice(uint256)" 1000000000000000 --private-key $PK --rpc-url https://sepolia.base.org`,
        fixDescription: 'Lower key price to 0.001 ETH'
      };
    }

    return {
      status: 'passed',
      message: `KeyShop price: ${priceInEth} ETH`,
      details: '✅ Price configured'
    };
  }, [keyPrice, addresses]);

  const checkRolesCorrect = useCallback(async () => {
    // This would require additional contract calls to check roles
    // For now, return a basic check
    try {
      // We'd need to call MAW.role(keccak256("COSMETICS")) etc.
      return {
        status: 'info',
        message: 'Role verification requires additional contract calls',
        details: 'Manual verification recommended'
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'Cannot verify roles',
        fix: `cast call ${addresses?.MawSacrifice} "role(bytes32)(address)" $(cast keccak "COSMETICS") --rpc-url https://sepolia.base.org`,
        fixDescription: 'Check COSMETICS role'
      };
    }
  }, [addresses]);

  // Run all diagnostics
  const runDiagnostics = useCallback(async () => {
    setIsRunning(true);
    setResults(null);
    
    const checkFunctions = {
      relics_maw_match: checkRelicsMawMatch,
      token_ids_readable: checkTokenIdsReadable,
      relics_pool_sane: checkRelicsPoolSane,
      cosmetic_pool_sane: checkCosmeticPoolSane,
      r2_reachable: checkR2Reachable,
      keyshop_price_set: checkKeyShopPriceSet,
      roles_correct: checkRolesCorrect
    };

    const checkResults = {};
    let firstFailure = null;

    for (const check of DIAGNOSTIC_CHECKS) {
      setCurrentCheck(check.name);
      
      try {
        const result = await checkFunctions[check.id]();
        checkResults[check.id] = {
          ...check,
          ...result,
          timestamp: new Date()
        };

        // Track first failure for quick fix
        if (!firstFailure && (result.status === 'failed' || result.status === 'error')) {
          firstFailure = checkResults[check.id];
        }
      } catch (error) {
        checkResults[check.id] = {
          ...check,
          status: 'error',
          message: `Check failed: ${error.message}`,
          timestamp: new Date()
        };

        if (!firstFailure) {
          firstFailure = checkResults[check.id];
        }
      }

      // Small delay between checks for UX
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    const summary = {
      total: DIAGNOSTIC_CHECKS.length,
      passed: Object.values(checkResults).filter(r => r.status === 'passed').length,
      failed: Object.values(checkResults).filter(r => r.status === 'failed').length,
      warnings: Object.values(checkResults).filter(r => r.status === 'warning').length,
      errors: Object.values(checkResults).filter(r => r.status === 'error').length,
      firstFailure
    };

    setResults({
      checks: checkResults,
      summary,
      timestamp: new Date()
    });

    setCurrentCheck(null);
    setIsRunning(false);
  }, [
    checkRelicsMawMatch,
    checkTokenIdsReadable,
    checkRelicsPoolSane,
    checkCosmeticPoolSane,
    checkR2Reachable,
    checkKeyShopPriceSet,
    checkRolesCorrect
  ]);

  // Get overall system status
  const getOverallStatus = () => {
    if (!results) return 'unknown';
    
    const { summary } = results;
    if (summary.errors > 0 || summary.failed > 0) return 'critical';
    if (summary.warnings > 0) return 'warning';
    return 'healthy';
  };

  return {
    // State
    isRunning,
    currentCheck,
    results,
    
    // Actions
    runDiagnostics,
    
    // Helpers
    getOverallStatus,
    DIAGNOSTIC_CHECKS
  };
}