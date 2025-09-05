/**
 * Contracts SDK - Single source of truth for contract interactions
 * With runtime guards against old addresses
 */

import { ADDRS, CHAIN } from '@rot-ritual/addresses';
import canonicalAbis from '../abis/canonical-abis.json';

const OLD = "0x32833358cc1f4eC6E05FF7014Abc1B6b09119625".toLowerCase();

export function getMawAddress(chainId?: number) {
  const id = chainId ?? CHAIN.BASE_SEPOLIA;
  const addr = ADDRS[id]?.MawSacrifice;
  if (!addr) throw new Error(`No MawSacrifice address for chain ${id}`);

  if (addr.toLowerCase() === OLD) {
    // Fail loudly so no one can accidentally use the old contract again.
    throw new Error("🛑 Using OLD MawSacrifice address — fix your config!");
  }
  
  console.log("[MawSacrifice address]", addr, { chainId: id });
  return addr;
}

export function getRelicsAddress(chainId?: number) {
  const id = chainId ?? CHAIN.BASE_SEPOLIA;
  const addr = ADDRS[id]?.Relics;
  if (!addr) throw new Error(`No Relics address for chain ${id}`);
  return addr;
}

export function getAllAddresses(chainId?: number) {
  const id = chainId ?? CHAIN.BASE_SEPOLIA;
  const addrs = ADDRS[id];
  if (!addrs) throw new Error(`No addresses for chain ${id}`);
  return addrs;
}

// Legacy compatibility functions - TODO: Remove when migrated
export function getContract(chainId: number, contractName: string) {
  const addrs = getAllAddresses(chainId);
  return { 
    address: (addrs as any)[contractName], 
    abi: (canonicalAbis as any)[contractName] || []
  };
}

export function isChainSupported(chainId: number) {
  return chainId === CHAIN.BASE_SEPOLIA;
}

export function getAllContracts(chainId: number) {
  return getAllAddresses(chainId);
}

// Standard ABIs for common operations (simplified)
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
    }
  ]
};

// Contract operation helpers (simplified)
export const ContractHelpers = {
  parseTransferEvents: () => ({ rewards: [], burned: [] }),
  parseSacrificeResult: () => ({ success: false, message: '', rewards: [], burned: [] })
};

// Relic catalog matching CONTRACT definitions in MawSacrificeV4NoTimelock
export const RELIC_CATALOG = {
  0: { name: "Rusted Caps", rarity: "common", type: "consumable" },       // What you sacrifice
  // ID 1 INTENTIONALLY OMITTED - Not used by contract to avoid confusion
  2: { name: "Lantern Fragment", rarity: "uncommon", type: "crafting" },  // For cosmetics
  3: { name: "Worm-eaten Mask", rarity: "uncommon", type: "crafting" },   // Rarity booster
  4: { name: "Bone Dagger", rarity: "rare", type: "weapon" },             // For demons (not implemented)
  5: { name: "Ash Vial", rarity: "rare", type: "reagent" },               // Rare drop
  6: { name: "Glass Shards", rarity: "common", type: "byproduct" },       // Convert to caps
  // IDs 7-9 not defined in contract but may exist in inventory
  8: { name: "Binding Contract", rarity: "epic", type: "artifact" },      
  9: { name: "Demon Deed", rarity: "epic", type: "artifact" },            
};

/**
 * Get relic information by ID
 */
export function getRelicInfo(relicId: number) {
  return RELIC_CATALOG[relicId] || { 
    name: `Unknown Relic #${relicId}`, 
    rarity: "unknown", 
    type: "unknown" 
  };
}