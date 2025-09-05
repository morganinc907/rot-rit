# ABI Management System

## Overview

This system ensures the frontend always uses correct, up-to-date ABIs compiled from actual smart contracts.

## Structure

```
packages/
├── abi/                      # Centralized ABI package
│   ├── package.json          # @rot-ritual/abi
│   ├── index.js             # ABI exports
│   ├── maw.json             # MAW contract ABI
│   ├── relics.json          # Relics contract ABI
│   └── cosmetics.json       # Cosmetics contract ABI
├── contracts/
│   ├── src/                 # Solidity contracts
│   └── out/                 # Foundry build artifacts
scripts/
├── build-abis.mjs           # Extract ABIs from Foundry artifacts
└── check-abis.mjs           # Verify ABI integrity
```

## Usage

### Building ABIs

1. **Compile contracts with Foundry:**
   ```bash
   cd packages/contracts
   forge build
   ```

2. **Extract ABIs:**
   ```bash
   node scripts/build-abis.mjs
   ```

3. **Verify ABIs:**
   ```bash
   node scripts/check-abis.mjs
   ```

### Using in Frontend

```typescript
// Import from centralized package
import { mawAbi, relicsAbi, cosmeticsAbi } from "@rot-ritual/abi";

// Use with viem/wagmi
const { data } = useContractRead({
  address: mawAddress,
  abi: mawAbi,
  functionName: 'sacrificeForCosmetic'
});
```

### CI/CD Pipeline

```bash
# In packages/contracts/package.json
npm run build:packages  # Builds contracts, extracts ABIs, verifies
```

## Safety Features

1. **Build-time verification**: `check-abis.mjs` ensures critical functions exist
2. **Runtime verification**: Frontend validates ABIs on boot
3. **Single source of truth**: ABIs come directly from compiled artifacts
4. **Version tracking**: Checksums help track ABI changes

## Adding New Contracts

1. Add contract to `scripts/build-abis.mjs` MAP array
2. Update `packages/abi/index.js` exports
3. Add verification in `scripts/check-abis.mjs`
4. Update frontend `abi-verification.ts`

## Troubleshooting

- **"Artifact missing"**: Run `forge build` first
- **"ABI missing functions"**: Contract may have changed, update verification scripts
- **Frontend errors**: Check browser console for ABI verification failures