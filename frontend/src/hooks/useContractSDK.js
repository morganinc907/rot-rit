/**
 * Enhanced contract hook using the SDK
 * Provides type-safe, validated contract interactions
 */

import { useAccount, useChainId, usePublicClient } from 'wagmi';
import { useMemo } from 'react';
import { decodeEventLog } from 'viem';
import {
  getContract,
  isChainSupported, 
  getAllContracts,
  ContractHelpers,
  getRelicInfo 
} from '../sdk/contracts';

export function useContractSDK() {
  const { address } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();

  // Contract addresses and configurations
  const contracts = useMemo(() => {
    if (!chainId || !isChainSupported(chainId)) {
      return null;
    }

    try {
      const contracts = getAllContracts(chainId);
      return contracts;
    } catch (error) {
      console.error('Failed to load contracts for chain:', chainId, error);
      return null;
    }
  }, [chainId]);

  // Helper to get a specific contract config
  const getContractConfig = useMemo(() => {
    return (contractName) => {
      if (!chainId || !isChainSupported(chainId)) {
        throw new Error(`Chain ${chainId} not supported`);
      }
      return getContract(chainId, contractName);
    };
  }, [chainId]);

  // Contract operation helpers
  const helpers = useMemo(() => {
    if (!publicClient || !address) return null;

    return {
      /**
       * Check approval status for relics -> maw sacrifice
       */
      async checkMawApproval() {
        if (!contracts) return false;
        
        return ContractHelpers.isApproved(publicClient, {
          tokenContract: contracts.Relics,
          owner: address,
          operator: contracts.MawSacrifice,
        });
      },

      /**
       * Get relic balance
       */
      async getRelicBalance(relicId) {
        if (!contracts) return 0;
        
        const balance = await ContractHelpers.getBalance(publicClient, {
          tokenContract: contracts.Relics,
          owner: address,
          tokenId: relicId,
        });
        
        return Number(balance);
      },

      /**
       * Get multiple relic balances
       */
      async getRelicBalances(relicIds) {
        if (!contracts) return {};
        
        const balances = {};
        const promises = relicIds.map(async (id) => {
          const balance = await this.getRelicBalance(id);
          balances[id] = balance;
        });
        
        await Promise.all(promises);
        return balances;
      },

      /**
       * Fetch cosmetic name from contract
       */
      async getCosmeticName(typeId) {
        if (!contracts?.Cosmetics) return null;

        try {
          const info = await publicClient.readContract({
            address: contracts.Cosmetics,
            abi: [{
              name: 'getCosmeticInfo',
              type: 'function',
              stateMutability: 'view',
              inputs: [{ name: 'typeId', type: 'uint256' }],
              outputs: [
                { name: 'name', type: 'string' },
                { name: 'imageURI', type: 'string' },
                { name: 'previewLayerURI', type: 'string' },
                { name: 'rarity', type: 'uint8' },
                { name: 'slot', type: 'uint8' },
                { name: 'active', type: 'bool' },
                { name: 'currentSupply', type: 'uint256' },
                { name: 'maxSupply', type: 'uint256' }
              ],
            }],
            functionName: 'getCosmeticInfo',
            args: [typeId]
          });

          return info[0]; // First element is the name
        } catch (error) {
          console.warn(`Failed to fetch cosmetic name for ${typeId}:`, error);
          return null;
        }
      },

      /**
       * Parse sacrifice transaction results
       */
      async parseSacrificeResult(receipt) {
        const { rewards, burned } = ContractHelpers.parseTransferEvents(receipt, address);

        // Check for CosmeticRitualAttempted event
        let cosmeticReward = null;
        const logs = receipt.logs || [];

        for (const log of logs) {
          try {
            // Check if this is a CosmeticRitualAttempted event from MawSacrifice
            if (log.address?.toLowerCase() === contracts?.MawSacrifice?.toLowerCase() && log.topics?.length === 2) {
              const decoded = decodeEventLog({
                abi: [{
                  name: 'CosmeticRitualAttempted',
                  type: 'event',
                  inputs: [
                    { indexed: true, name: 'user', type: 'address' },
                    { indexed: false, name: 'success', type: 'bool' },
                    { indexed: false, name: 'cosmeticTypeId', type: 'uint256' }
                  ]
                }],
                data: log.data,
                topics: log.topics,
              });

              if (decoded.eventName === 'CosmeticRitualAttempted' && decoded.args.success) {
                const typeId = Number(decoded.args.cosmeticTypeId);
                // Fetch actual cosmetic name from contract
                const cosmeticName = await this.getCosmeticName(typeId);
                cosmeticReward = {
                  type: 'cosmetic',
                  typeId: typeId,
                  id: typeId,
                  name: cosmeticName || `Cosmetic #${typeId}`,
                  quantity: 1
                };
              }
            }
          } catch (e) {
            // Not a CosmeticRitualAttempted event
          }
        }

        // Add relic names and info, but detect cosmetics first
        let enrichedRewards = await Promise.all(rewards.map(async (r) => {
          // Check if this is a cosmetic transfer (IDs 1000-6000)
          const isCosmetic = r.id >= 1000 && r.id < 6000; // Cosmetics use slot-based IDs: 1000-5999

          if (isCosmetic) {
            // Fetch actual cosmetic name from contract
            const cosmeticName = await this.getCosmeticName(r.id);
            const cosmetic = {
              type: 'cosmetic',
              typeId: r.id,
              id: r.id,
              name: cosmeticName || `Cosmetic #${r.id}`,
              quantity: r.quantity || 1
            };
            return cosmetic;
          }

          // For non-cosmetics, add relic info
          const enriched = {
            ...r,
            ...getRelicInfo(r.id)
          };
          return enriched;
        }));

        // Add cosmetic reward from event ONLY if no cosmetic was found in transfers
        const hasTransferCosmetic = enrichedRewards.some(r => r.type === 'cosmetic');
        if (cosmeticReward && !hasTransferCosmetic) {
          enrichedRewards = [cosmeticReward, ...enrichedRewards];
        } else if (cosmeticReward && hasTransferCosmetic) {
        }


        const enrichedBurned = burned.map(r => ({
          ...r,
          ...getRelicInfo(r.id)
        }));

        // Separate ash from real rewards
        const ashRewards = enrichedRewards.filter(r => r.id === 9 || r.id === 8); // Ash/Shards
        const realRewards = enrichedRewards.filter(r => r.id !== 9 && r.id !== 8);

        const isSuccess = realRewards.length > 0;


        return {
          rewards: isSuccess ? realRewards : ashRewards, // Show ash if no real rewards
          burned: enrichedBurned,
          success: isSuccess,
          message: isSuccess ?
            'The Maw grants you relics!' :
            (ashRewards.length > 0 ? 'The Maw consumed your offering but granted nothing...' : 'The Maw consumed your offering but granted nothing...')
        };
      },

      /**
       * Validate sacrifice parameters
       */
      validateSacrifice(type, params) {
        const errors = [];
        
        switch (type) {
          case 'keys':
            if (!params.amount || params.amount <= 0 || params.amount > 10) {
              errors.push('Amount must be between 1-10 keys');
            }
            break;
            
          case 'cosmetic':
            const total = (params.fragments || 0) + (params.masks || 0);
            if (total === 0 || total > 3) {
              errors.push('Must sacrifice 1-3 cosmetic relics total');
            }
            break;
            
          case 'demon':
            if (!params.cultistTokenId) {
              errors.push('Must select a cultist to sacrifice');
            }
            
            if (!params.useBindingContract && !params.useSoulDeed) {
              const relicTotal = (params.daggers || 0) + (params.vials || 0);
              if (relicTotal === 0 || relicTotal > 3) {
                errors.push('Must sacrifice 1-3 demon relics or use artifacts');
              }
              if ((params.daggers || 0) === 0) {
                errors.push('Need at least 1 dagger for demon ritual');
              }
            }
            break;
            
          default:
            errors.push('Unknown sacrifice type');
        }
        
        return {
          valid: errors.length === 0,
          errors
        };
      }
    };
  }, [publicClient, address, contracts]);

  return {
    // Basic info
    chainId,
    isSupported: isChainSupported(chainId || 0),
    contracts,
    
    // Contract configs
    getContractConfig,
    
    // Helpers
    helpers,
    
    // Ready state
    isReady: !!(chainId && contracts && address && publicClient),
  };
}