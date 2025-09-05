/**
 * Enhanced contract hook using the SDK
 * Provides type-safe, validated contract interactions
 */

import { useAccount, useChainId, usePublicClient } from 'wagmi';
import { useMemo } from 'react';
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
       * Parse sacrifice transaction results
       */
      parseSacrificeResult(receipt) {
        const { rewards, burned } = ContractHelpers.parseTransferEvents(receipt, address);
        
        // Add relic names and info
        const enrichedRewards = rewards.map(r => ({
          ...r,
          ...getRelicInfo(r.id)
        }));
        
        const enrichedBurned = burned.map(r => ({
          ...r,
          ...getRelicInfo(r.id)
        }));
        
        // Separate ash from real rewards
        const ashRewards = enrichedRewards.filter(r => r.id === 9); // Ash is ID 9
        const realRewards = enrichedRewards.filter(r => r.id !== 9);
        
        const isSuccess = realRewards.length > 0;
        
        
        return {
          rewards: isSuccess ? realRewards : ashRewards, // Show ash if no real rewards
          burned: enrichedBurned,
          success: isSuccess,
          message: isSuccess ? 
            'The Maw grants you relics!' : 
            (ashRewards.length > 0 ? 'The Maw consumed your offering but granted ash...' : 'The Maw consumed your offering but granted nothing...')
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