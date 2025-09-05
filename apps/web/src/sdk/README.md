# Rot & Ritual Contract SDK

This SDK provides type-safe, validated interactions with the Rot & Ritual smart contracts.

## Architecture

### Single Source of Truth
- **Contract addresses**: Managed in one place per chain
- **ABIs**: Consolidated and standardized
- **Validation**: Built-in parameter validation
- **Error handling**: Consistent error states and messages

### Key Components

1. **contracts.js** - Core SDK with addresses, ABIs, and helpers
2. **useContractSDK.js** - Main React hook for contract interactions
3. **useMawSacrificeSDK.js** - Enhanced sacrifice operations
4. **useNFTBalancesSDK.js** - Type-safe balance tracking

## Usage

### Basic Contract Access

```javascript
import { useContractSDK } from './hooks/useContractSDK';

function MyComponent() {
  const { contracts, getContractConfig, helpers, isReady } = useContractSDK();
  
  // Get contract address
  const mawAddress = contracts?.MawSacrifice;
  
  // Get full config for wagmi
  const { address, abi } = getContractConfig('mawSacrifice');
}
```

### Sacrifice Operations

```javascript
import { useMawSacrificeSDK } from './hooks/useMawSacrificeSDK';

function SacrificeComponent() {
  const {
    sacrificeKeys,
    approveContract,
    isApproved,
    isLoading
  } = useMawSacrificeSDK(onComplete);
  
  // Approval flow
  if (!isApproved) {
    return <button onClick={approveContract}>Approve Contract</button>;
  }
  
  // Sacrifice flow
  const handleSacrifice = async () => {
    const result = await sacrificeKeys(3);
    if (result.success) {
      console.log('Sacrifice submitted!');
    }
  };
}
```

### Balance Tracking

```javascript
import useNFTBalances from './hooks/useNFTBalancesSDK';

function InventoryComponent() {
  const { relics, getRelicBalance, getRelicsByRarity } = useNFTBalances();
  
  // Get specific balance
  const keyCount = getRelicBalance(1);
  
  // Get by rarity
  const commonRelics = getRelicsByRarity('common');
}
```

## State Machine

### Approval Flow
```
Not Connected -> Connected -> Not Approved -> Approved -> Ready
```

### Sacrifice Flow
```
Ready -> Validating -> Submitting -> Confirming -> Success/Error
```

## Error Handling

### Automatic Validation
- Parameter validation before submission
- Balance checks
- Approval status verification
- Network compatibility

### Error Recovery
- ContractErrorBoundary catches critical errors
- Toast notifications for user errors
- Automatic retry logic for network issues

## Events

### Standard Events
- `TransferSingle`: ERC1155 transfers (rewards/burns)
- `ApprovalForAll`: Contract approvals

### Parsing
```javascript
const { rewards, burned } = helpers.parseSacrificeResult(receipt);
```

## Chain Support

Currently supported chains:
- **31337**: Local development (Hardhat/Anvil)
- **84532**: Base Sepolia testnet
- **11155111**: Ethereum Sepolia testnet

## Best Practices

### 1. Always Check Ready State
```javascript
if (!isReady) {
  return <div>Loading contracts...</div>;
}
```

### 2. Handle Approval First
```javascript
if (!isApproved) {
  // Show approval UI
}
```

### 3. Validate Before Submit
```javascript
const validation = helpers?.validateSacrifice('keys', { amount: 5 });
if (!validation?.valid) {
  toast.error(validation?.errors[0]);
  return;
}
```

### 4. Use Error Boundary
```javascript
<ContractErrorBoundary>
  <YourComponent />
</ContractErrorBoundary>
```

## Development

### Adding New Contracts

1. Add address to chain config files
2. Add ABI to `contracts.js`
3. Update `getContract()` function
4. Create specific hook if needed

### Testing

1. Start local chain: `anvil`
2. Deploy contracts to local chain
3. Update `contracts-local.json`
4. Test with development app

## Migration Guide

### From Old Hooks

**Before:**
```javascript
import useContracts from './hooks/useContracts';
import useMawSacrifice from './hooks/useMawSacrifice';

const { contracts } = useContracts();
const { sacrificeKeys } = useMawSacrifice(onComplete);
```

**After:**
```javascript
import { useContractSDK } from './hooks/useContractSDK';
import { useMawSacrificeSDK } from './hooks/useMawSacrificeSDK';

const { contracts } = useContractSDK();
const { sacrificeKeys } = useMawSacrificeSDK(onComplete);
```

## Benefits

1. **Type Safety**: Consistent types and validation
2. **Error Handling**: Comprehensive error states
3. **Performance**: Optimized queries and caching
4. **Maintainability**: Single source of truth
5. **Developer Experience**: Better debugging and logging
6. **Reliability**: Tested transaction flows