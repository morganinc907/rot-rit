# Contract Address Migration Summary

## Issue Fixed
The frontend was using inconsistent contract addresses from two different sources:
1. **Environment variables** (`.env` file) - contained outdated addresses
2. **TypeScript addresses package** - contained current/correct addresses

This led to transaction failures and frontend components not reflecting contract changes.

## Solution Implemented

### 1. Migrated All Components to Centralized Address System
- ✅ Updated `useMawContract.js` to use `getMawAddress(chainId)`
- ✅ Updated `useCosmetics.js` to use `getCosmeticsAddress(chainId)` 
- ✅ Updated `useRitualsContract.js` to use `getMawAddress(chainId)`
- ✅ Updated `Codex.jsx` to use centralized addresses
- ✅ Updated `CodexEnhanced.jsx` to use centralized addresses

### 2. Enhanced Centralized Address System
Added comprehensive address getter functions in `/apps/web/src/sdk/addresses.ts`:
- `getMawAddress(chainId)` - with old address guards
- `getCosmeticsAddress(chainId)`
- `getRaccoonsAddress(chainId)`
- `getDemonsAddress(chainId)`
- `getCultistsAddress(chainId)`
- `getKeyShopAddress(chainId)`
- `getRaccoonRendererAddress(chainId)`
- `getRitualReadAggregatorAddress(chainId)`

### 3. Added Runtime Guards
- Old address detection with clear error messages
- Chain ID validation for all address getters
- Console logging for debugging address usage

### 4. Created Automated Safeguards
- **Lint script**: `apps/web/scripts/check-no-env-addresses.js`
- **Build integration**: Added to `prebuild` script in package.json
- **Manual check**: `npm run check:noaddrs` command
- **Documentation**: Added warnings to `.env` file

### 5. Updated Contract Hooks System
Enhanced `contracts.ts` with comprehensive contract hooks:
- `useMaw()`, `useRelics()`, `useCosmetics()`, etc.
- Centralized chain ID validation
- Consistent ABI loading

## Current Contract Addresses (Base Sepolia)
```
MawSacrifice:        0xB2e77ce03BC688C993Ee31F03000c56c211AD7db
Relics:              0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b
Cosmetics:           0x32640D260CeCD52581280e23B9DCc6F49D04Bdcb
Raccoons:            0x6DB1C2d60579679A82C3Ac39cf7097B442E1Aa9f
Demons:              0xf830dcC09ba6BB0Eb575aD06E369f3483A65c5bF
Cultists:            0x2D7cD25A014429282062298d2F712FA7983154B9
KeyShop:             0x9Bd1651f1f8aB416A72f094fB60BbC1737B67DB6
RaccoonRenderer:     0x3eE467d8Dc8Fdf26dFC17dA8630EE1078aEd3A85
RitualReadAggregator: 0xe14830B91Bf666E51305a89C1196d0e88bad98a2
```

## Benefits
1. **Single source of truth** for contract addresses
2. **Runtime validation** prevents wrong address usage
3. **Automated checks** prevent regression during development
4. **Type safety** with TypeScript address system
5. **Clear error messages** for debugging
6. **Future-proof** for mainnet deployment

## Prevention Measures
- Build will fail if environment variables are used for addresses
- Clear documentation warns against old patterns
- Runtime guards catch old addresses with helpful error messages
- Centralized system makes address updates simple and safe

## Testing
- ✅ Lint script passes (no environment variable usage detected)
- ✅ All components migrated to new system
- ✅ Address system provides correct current addresses
- ✅ Build integration prevents future regressions

## Next Steps for Developers
1. Use `getMawAddress(chainId)` instead of `import.meta.env.VITE_MAW_ADDRESS`
2. Import from `./sdk/addresses` for all contract addresses
3. Use `useChainId()` hook to get current chain ID
4. Run `npm run check:noaddrs` to verify no environment variable usage