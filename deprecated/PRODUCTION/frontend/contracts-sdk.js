/**
 * Contracts SDK - Single source of truth for contract interactions
 * Consolidates addresses, ABIs, and common operations
 */

import { decodeEventLog } from 'viem';

// Import contract addresses from config files
import localAddresses from '../contracts-local.json';
import testnetAddresses from '../contracts-testnet.json';
import baseSepolia from '../contracts-base-sepolia.json';

// Import ABIs
import RelicsABI from '../abis/Relics.json';
import CultistsABI from '../abis/Cultists.json';
import DemonsABI from '../abis/Demons.json';
import RaccoonsABI from '../abis/Raccoons.json';

// Contract configurations by chain ID
const CONTRACT_CONFIGS = {
  31337: localAddresses, // Local hardhat/anvil
  84532: baseSepolia,    // Base Sepolia
  11155111: testnetAddresses, // Sepolia (if using)
};

// Supported chains
export const SUPPORTED_CHAINS = [31337, 84532, 11155111];

// Standard ABIs for common operations
export const STANDARD_ABIS = {
  ERC1155: [
    {
      name: 'balanceOf',
      type: 'function',
      stateMutability: 'view',
      inputs: [
        { name: 'account', type: 'address' },
        { name: 'id', type: 'uint256' }
      ],
      outputs: [{ name: '', type: 'uint256' }],
    },
    {
      name: 'setApprovalForAll',
      type: 'function',
      stateMutability: 'nonpayable',
      inputs: [
        { name: 'operator', type: 'address' },
        { name: 'approved', type: 'bool' }
      ],
      outputs: [],
    },
    {
      name: 'isApprovedForAll',
      type: 'function',
      stateMutability: 'view',
      inputs: [
        { name: 'account', type: 'address' },
        { name: 'operator', type: 'address' }
      ],
      outputs: [{ name: '', type: 'bool' }],
    },
    {
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
    }
  ]
};

// Maw Sacrifice ABI - consolidated from hook
export const MAW_SACRIFICE_ABI = [
  {
    name: 'sacrificeKeys',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'sacrificeForCosmetic',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'fragments', type: 'uint256' },
      { name: 'masks', type: 'uint256' }
    ],
    outputs: [],
  },
  {
    name: 'sacrificeForDemon',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'daggers', type: 'uint256' },
      { name: 'vials', type: 'uint256' },
      { name: 'useBindingContract', type: 'bool' },
      { name: 'useSoulDeed', type: 'bool' },
      { name: 'cultistTokenId', type: 'uint256' }
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

/**
 * Get contract address for a given chain and contract name
 */
export function getContractAddress(chainId, contractName) {
  const config = CONTRACT_CONFIGS[chainId];
  if (!config) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }
  
  const address = config[contractName];
  if (!address) {
    throw new Error(`Contract ${contractName} not found for chain ${chainId}`);
  }
  
  return address;
}

/**
 * Get contract configuration (address + ABI) for wagmi/viem
 */
export function getContract(chainId, contractName) {
  const address = getContractAddress(chainId, contractName);
  
  // Map contract names to their ABIs
  const abiMap = {
    relics: RelicsABI,
    cultists: CultistsABI,
    demons: DemonsABI,
    raccoons: RaccoonsABI,
    mawSacrifice: MAW_SACRIFICE_ABI,
  };
  
  const abi = abiMap[contractName];
  if (!abi) {
    throw new Error(`ABI not found for contract: ${contractName}`);
  }
  
  return { address, abi };
}

/**
 * Check if a chain is supported
 */
export function isChainSupported(chainId) {
  return SUPPORTED_CHAINS.includes(chainId);
}

/**
 * Get all contract addresses for a chain
 */
export function getAllContracts(chainId) {
  const config = CONTRACT_CONFIGS[chainId];
  if (!config) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }
  return config;
}

/**
 * Contract operation helpers
 */
export const ContractHelpers = {
  /**
   * Check if user has approved operator for ERC1155 contract
   */
  async isApproved(publicClient, { tokenContract, owner, operator }) {
    return await publicClient.readContract({
      address: tokenContract,
      abi: STANDARD_ABIS.ERC1155,
      functionName: 'isApprovedForAll',
      args: [owner, operator],
    });
  },

  /**
   * Get token balance for ERC1155
   */
  async getBalance(publicClient, { tokenContract, owner, tokenId }) {
    return await publicClient.readContract({
      address: tokenContract,
      abi: STANDARD_ABIS.ERC1155,
      functionName: 'balanceOf',
      args: [owner, tokenId],
    });
  },

  /**
   * Parse transfer events from transaction receipt
   */
  parseTransferEvents(receipt, userAddress) {
    const rewards = [];
    const burned = [];
    
    receipt.logs?.forEach((log) => {
      try {
        if (log.topics && log.topics.length === 4) {
          const decoded = decodeEventLog({
            abi: STANDARD_ABIS.ERC1155,
            data: log.data,
            topics: log.topics,
          });
          
          if (decoded.eventName === 'TransferSingle') {
            const { from, to, id, value } = decoded.args;
            const relicId = Number(id);
            const amount = Number(value);
            
            // Reward: minted to user (from zero address)
            if (to.toLowerCase() === userAddress.toLowerCase() && 
                from === '0x0000000000000000000000000000000000000000') {
              rewards.push({ id: relicId, quantity: amount });
            }
            
            // Burned: from user to zero or contract
            if (from.toLowerCase() === userAddress.toLowerCase() && 
                to !== userAddress.toLowerCase()) {
              burned.push({ id: relicId, quantity: amount });
            }
          }
        }
      } catch (error) {
        // Ignore non-transfer events
      }
    });
    
    return { rewards, burned };
  },

  /**
   * Parse sacrifice result from transaction receipt
   */
  parseSacrificeResult(receipt, userAddress) {
    const { rewards, burned } = this.parseTransferEvents(receipt, userAddress);
    
    // Convert to the format expected by the frontend
    const formattedRewards = rewards.map(reward => ({
      name: RELIC_CATALOG[reward.id]?.name || `Unknown Item ${reward.id}`,
      quantity: reward.quantity,
      id: reward.id
    }));
    
    const formattedBurned = burned.map(burned => ({
      name: RELIC_CATALOG[burned.id]?.name || `Unknown Item ${burned.id}`,
      quantity: burned.quantity,
      id: burned.id
    }));
    
    // Determine if sacrifice was "successful" based on rewards
    const success = rewards.length > 0 || burned.length > 0;
    
    return {
      success,
      message: success ? 'Sacrifice completed!' : 'The ritual failed...',
      rewards: formattedRewards,
      burned: formattedBurned
    };
  }
};

// Relic catalog with consistent naming
export const RELIC_CATALOG = {
  1: { name: "Rusted Key", rarity: "common", type: "consumable" },
  2: { name: "Lantern Fragment", rarity: "uncommon", type: "crafting" },  
  3: { name: "Worm-eaten Mask", rarity: "uncommon", type: "crafting" },
  4: { name: "Bone Dagger", rarity: "rare", type: "weapon" },
  5: { name: "Ash Vial", rarity: "rare", type: "reagent" },
  6: { name: "Binding Contract", rarity: "epic", type: "artifact" },
  7: { name: "Soul Deed", rarity: "epic", type: "artifact" },
  8: { name: "Ash", rarity: "common", type: "byproduct" },
};

/**
 * Get relic information by ID
 */
export function getRelicInfo(relicId) {
  return RELIC_CATALOG[relicId] || { 
    name: `Unknown Relic #${relicId}`, 
    rarity: "unknown", 
    type: "unknown" 
  };
}