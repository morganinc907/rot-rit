import { useReadContract } from 'wagmi';
import { keccak256, stringToHex } from 'viem';

// AddressRegistry contract address (deployed once, never changes)
const ADDRESS_REGISTRY = '0xF7FC9caa60f4D12d731B32883498A8D403b9c828' as const;

// Contract keys for chain-first resolution
export type ContractKey = 
  | 'RELICS'
  | 'MAW_SACRIFICE' 
  | 'COSMETICS'
  | 'DEMONS'
  | 'CULTISTS'
  | 'KEY_SHOP'
  | 'RACCOONS'
  | 'RACCOON_RENDERER'
  | 'RITUAL_READ_AGGREGATOR';

// Contract key to bytes32 mapping (for registry lookup)
const CONTRACT_KEYS: Record<ContractKey, `0x${string}`> = {
  RELICS: keccak256(stringToHex('RELICS')),
  MAW_SACRIFICE: keccak256(stringToHex('MAW_SACRIFICE')),
  COSMETICS: keccak256(stringToHex('COSMETICS')),
  DEMONS: keccak256(stringToHex('DEMONS')),
  CULTISTS: keccak256(stringToHex('CULTISTS')),
  KEY_SHOP: keccak256(stringToHex('KEY_SHOP')),
  RACCOONS: keccak256(stringToHex('RACCOONS')),
  RACCOON_RENDERER: keccak256(stringToHex('RACCOON_RENDERER')),
  RITUAL_READ_AGGREGATOR: keccak256(stringToHex('RITUAL_READ_AGGREGATOR')),
};

// Simple ABI for AddressRegistry.get()
const REGISTRY_ABI = [
  {
    name: 'get',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'key', type: 'bytes32' }],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    name: 'getAll',
    type: 'function', 
    stateMutability: 'view',
    inputs: [],
    outputs: [
      { name: 'relics', type: 'address' },
      { name: 'mawSacrifice', type: 'address' },
      { name: 'cosmetics', type: 'address' },
      { name: 'demons', type: 'address' },
      { name: 'cultists', type: 'address' },
      { name: 'keyShop', type: 'address' },
      { name: 'raccoons', type: 'address' },
      { name: 'raccoonRenderer', type: 'address' },
      { name: 'ritualReadAggregator', type: 'address' },
    ],
  },
] as const;

/**
 * Universal address resolver using AddressRegistry (fully chain-first)
 * 
 * All contracts resolved from on-chain AddressRegistry - zero hardcoding!
 * 
 * @param contractKey - Contract identifier 
 * @returns {address, isLoading, error}
 */
export function useAddress(contractKey: ContractKey) {
  const registryKey = CONTRACT_KEYS[contractKey];
  
  const { data: address, isLoading, error } = useReadContract({
    address: ADDRESS_REGISTRY,
    abi: REGISTRY_ABI,
    functionName: 'get',
    args: [registryKey],
    query: { 
      staleTime: 300000, // Cache for 5 minutes (addresses rarely change)
    },
  });
  
  if (address && address !== '0x0000000000000000000000000000000000000000') {
    console.log(`🔗 ${contractKey} resolved from AddressRegistry:`, address);
  }
  
  return {
    address: (address !== '0x0000000000000000000000000000000000000000' ? address : undefined) as `0x${string}` | undefined,
    isLoading,
    error: error?.message,
  };
}

/**
 * Batch address resolver for multiple contracts
 */
export function useAddresses(contractKeys: ContractKey[]) {
  const results = contractKeys.map(key => ({
    key,
    ...useAddress(key)
  }));
  
  const isLoading = results.some(r => r.isLoading);
  const errors = results.filter(r => r.error).map(r => `${r.key}: ${r.error}`);
  
  const addresses = results.reduce((acc, result) => {
    if (result.address) {
      acc[result.key] = result.address;
    }
    return acc;
  }, {} as Partial<Record<ContractKey, `0x${string}`>>);
  
  return {
    addresses,
    isLoading,
    errors: errors.length > 0 ? errors : undefined,
  };
}

/**
 * Health check for address resolution system using AddressRegistry
 */
export function useAddressSystemHealth() {
  // Use the registry's getAll function for efficient batch loading
  const { data: allAddressesData, isLoading, error } = useReadContract({
    address: ADDRESS_REGISTRY,
    abi: REGISTRY_ABI,
    functionName: 'getAll',
    query: { 
      staleTime: 300000, // Cache for 5 minutes
    },
  });
  
  const allKeys: ContractKey[] = [
    'RELICS', 'MAW_SACRIFICE', 'COSMETICS', 'DEMONS', 'CULTISTS',
    'KEY_SHOP', 'RACCOONS', 'RACCOON_RENDERER', 'RITUAL_READ_AGGREGATOR'
  ];
  
  // Convert registry response to our format
  const addresses: Partial<Record<ContractKey, `0x${string}`>> = {};
  const errors: string[] = [];
  
  if (allAddressesData) {
    const [relics, mawSacrifice, cosmetics, demons, cultists, keyShop, raccoons, raccoonRenderer, ritualReadAggregator] = allAddressesData;
    
    const addressMapping = {
      RELICS: relics,
      MAW_SACRIFICE: mawSacrifice, 
      COSMETICS: cosmetics,
      DEMONS: demons,
      CULTISTS: cultists,
      KEY_SHOP: keyShop,
      RACCOONS: raccoons,
      RACCOON_RENDERER: raccoonRenderer,
      RITUAL_READ_AGGREGATOR: ritualReadAggregator,
    };
    
    Object.entries(addressMapping).forEach(([key, addr]) => {
      if (addr && addr !== '0x0000000000000000000000000000000000000000') {
        addresses[key as ContractKey] = addr as `0x${string}`;
      }
    });
  }
  
  if (error) {
    errors.push(`AddressRegistry error: ${error.message}`);
  }
  
  const resolvedCount = Object.keys(addresses).length;
  const missingCount = allKeys.length - resolvedCount;
  
  return {
    addresses,
    isLoading,
    errors: errors.length > 0 ? errors : undefined,
    health: {
      total: allKeys.length,
      resolved: resolvedCount,
      chainFirst: resolvedCount, // All are chain-first now!
      fallback: 0,              // No more fallbacks!
      missing: missingCount,
      registryAddress: ADDRESS_REGISTRY,
    }
  };
}

export default useAddress;