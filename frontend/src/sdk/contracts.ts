/**
 * Contracts SDK - Chain-first address resolution with drift detection
 * 
 * ⚠️  DEPRECATED PATTERN: Static address resolution
 * ✅ PREFERRED PATTERN: Chain-first resolution via useContracts
 * 
 * These functions are legacy compatibility only and validate against chain state.
 */

import { ADDRS, CHAIN } from '@rot-ritual/addresses';
import canonicalAbis from '../abis/canonical-abis.json';

const OLD = "0x32833358cc1f4eC6E05FF7014Abc1B6b09119625".toLowerCase();

// Global state for chain validation (optional - for drift detection)
let _chainValidationWarningShown = false;

/**
 * Validate static addresses against chain-first resolution
 * Call this from useContracts to detect configuration drift
 */
export function validateStaticAddresses(chainData: {
  mawAddress: string;
  relicsAddress: string;
  chainId: number;
}) {
  const staticAddrs = ADDRS[chainData.chainId];
  if (!staticAddrs) return;
  
  const driftDetected: string[] = [];
  
  // Check MAW address drift
  if (staticAddrs.MawSacrifice.toLowerCase() !== chainData.mawAddress.toLowerCase()) {
    driftDetected.push(`MAW: static=${staticAddrs.MawSacrifice} vs chain=${chainData.mawAddress}`);
  }
  
  // Check Relics address (should be the bootstrap)
  if (staticAddrs.Relics.toLowerCase() !== chainData.relicsAddress.toLowerCase()) {
    driftDetected.push(`Relics: static=${staticAddrs.Relics} vs chain=${chainData.relicsAddress}`);
  }
  
  if (driftDetected.length > 0 && !_chainValidationWarningShown) {
    console.warn(`
🚨 CONFIGURATION DRIFT DETECTED:
${driftDetected.map(d => `   ${d}`).join('\n')}

📋 This means:
   - packages/addresses may be outdated
   - Different environments may behave differently
   - Chain upgrades haven't propagated to static config

✅ SOLUTION: Update packages/addresses/src/index.ts
❌ DO NOT: Add VITE_*_ADDRESS environment variables
    `);
    _chainValidationWarningShown = true;
  } else if (driftDetected.length === 0) {
    console.log("✅ Chain validation: Static addresses match chain-first resolution");
  }
  
  return {
    isValid: driftDetected.length === 0,
    driftDetected
  };
}

/**
 * @deprecated Use chain-first resolution via useContracts instead
 * This function validates static config against chain state when possible
 */
export function getMawAddress(chainId?: number, chainValidation?: { 
  chainMawAddress?: string; 
  publicClient?: any 
}) {
  const id = chainId ?? CHAIN.BASE_SEPOLIA;
  const staticAddr = ADDRS[id]?.MawSacrifice;
  if (!staticAddr) throw new Error(`No MawSacrifice address for chain ${id}`);

  if (staticAddr.toLowerCase() === OLD) {
    // Fail loudly so no one can accidentally use the old contract again.
    throw new Error("🛑 Using OLD MawSacrifice address — fix your config!");
  }
  
  // Chain validation - detect configuration drift
  if (chainValidation?.chainMawAddress && !_chainValidationWarningShown) {
    const chainAddr = chainValidation.chainMawAddress.toLowerCase();
    const configAddr = staticAddr.toLowerCase();
    
    if (chainAddr !== configAddr) {
      console.warn(`
🚨 CONFIGURATION DRIFT DETECTED:
   Static config MAW: ${staticAddr}
   Chain-resolved MAW: ${chainValidation.chainMawAddress}
   
   ⚠️  This suggests the static addresses are outdated!
   ✅ Use chain-first resolution via useContracts instead
   ❌ Avoid this getMawAddress() function - it's deprecated
      `);
      _chainValidationWarningShown = true;
    } else {
      console.log("✅ Chain validation passed: Static config matches chain state");
    }
  }
  
  console.log("[MawSacrifice address - DEPRECATED]", staticAddr, { 
    chainId: id,
    warning: "Use useContracts for chain-first resolution" 
  });
  return staticAddr;
}

/**
 * @deprecated This should be the only static address (bootstrap)
 * Relics is the root of trust for chain-first resolution
 */
export function getRelicsAddress(chainId?: number) {
  const id = chainId ?? CHAIN.BASE_SEPOLIA;
  const addr = ADDRS[id]?.Relics;
  if (!addr) throw new Error(`No Relics address for chain ${id}`);
  
  console.log("[Relics address - BOOTSTRAP]", addr, { 
    chainId: id,
    note: "This is the only static address - root of chain-first trust" 
  });
  return addr;
}

/**
 * @deprecated Static address resolution - prefer chain-first
 * Only use for non-critical addresses that can't be derived from chain
 */
export function getAllAddresses(chainId?: number) {
  const id = chainId ?? CHAIN.BASE_SEPOLIA;
  const addrs = ADDRS[id];
  if (!addrs) throw new Error(`No addresses for chain ${id}`);
  
  console.log("[Static addresses - LEGACY]", Object.keys(addrs), { 
    chainId: id,
    warning: "These should be validated against chain state or derived on-chain" 
  });
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

// Contract operation helpers
export const ContractHelpers = {
  parseTransferEvents: (receipt: any, userAddress: string) => {
    const rewards: Array<{ id: number; amount: number }> = [];
    const burned: Array<{ id: number; amount: number }> = [];

    if (!receipt?.logs) {
      return { rewards, burned };
    }

    // ERC1155 TransferSingle event signature
    const transferSingleTopic = '0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62';

    receipt.logs.forEach((log: any) => {
      if (log.topics[0] === transferSingleTopic) {
        // Decode TransferSingle event
        // topics[1] = operator, topics[2] = from, topics[3] = to
        // data = [id, value]
        const from = '0x' + log.topics[2].slice(26).toLowerCase();
        const to = '0x' + log.topics[3].slice(26).toLowerCase();
        const id = parseInt(log.data.slice(0, 66), 16);
        const amount = parseInt('0x' + log.data.slice(66, 130), 16);

        const userAddr = userAddress.toLowerCase();
        const zeroAddr = '0x0000000000000000000000000000000000000000';

        // Burned from user
        if (from === userAddr && to === zeroAddr) {
          burned.push({ id, amount });
        }
        // Minted to user
        else if (from === zeroAddr && to === userAddr) {
          rewards.push({ id, amount });
        }
      }
    });

    return { rewards, burned };
  },
  parseSacrificeResult: () => ({ success: false, message: '', rewards: [], burned: [] })
};

// Relic catalog matching CONTRACT definitions in MawSacrificeV5
export const RELIC_CATALOG = {
  1: { name: "Rusted Caps", rarity: "common", type: "consumable" },       // What you sacrifice (contract ID 1)
  6: { name: "Glass Shards", rarity: "common", type: "byproduct" },       // Convert to caps
  7: { name: "Soul Deed", rarity: "legendary", type: "artifact" },        // Legendary guarantee
  9: { name: "Binding Contract", rarity: "epic", type: "artifact" },      // Rare guarantee
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