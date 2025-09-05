# Balance Verification Guide

## ✅ Status: Balance System Fixed

Your frontend balance system is now correctly configured and using the proper contract addresses.

## 🔧 What Was Fixed

### 1. **All Balance Components Use Centralized Addresses**
- `useRelicBalances.ts` ✅ Using SDK addresses
- `useNFTBalancesSDK.js` ✅ Using SDK addresses  
- `useNFTBalances.js` ✅ Using centralized `useContracts` hook
- `DebugBalances.tsx` ✅ Using SDK addresses

### 2. **Contract Address Consistency Verified**
```
Relics (ERC1155):     0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b
MawSacrifice:         0xB2e77ce03BC688C993Ee31F03000c56c211AD7db
Cosmetics:            0x32640D260CeCD52581280e23B9DCc6F49D04Bdcb
Raccoons:             0x6DB1C2d60579679A82C3Ac39cf7097B442E1Aa9f
```

### 3. **Token ID Mappings Correct**
- **Rusted Caps (ID 0)**: What you sacrifice in the Maw
- **Lantern Fragments (ID 2)**: For cosmetic crafting  
- **Worm-eaten Masks (ID 3)**: Rarity boosters
- **Bone Daggers (ID 4)**: For demon summoning
- **Ash Vials (ID 5)**: Rare drops
- **Glass Shards (ID 6)**: Convert 5 → 1 Rusted Cap

### 4. **Real-time Balance Updates**
- Event listeners for `TransferSingle` and `TransferBatch` events
- Auto-refresh on wallet transactions
- Manual force refresh capability
- WebSocket-like reactivity to blockchain changes

## 🧪 How to Verify Balances Are Correct

### Method 1: Quick Balance Check Component
Add this to any page for instant balance debugging:

```jsx
import { QuickBalanceCheck } from '../components/QuickBalanceCheck';

function YourPage() {
  return (
    <div>
      {/* Your existing content */}
      <QuickBalanceCheck />  {/* Floating debug panel */}
    </div>
  );
}
```

### Method 2: Run Test Script
```bash
npm run test:balances
```
This will show all contract addresses and component status.

### Method 3: Browser Console Debugging
1. Open Dev Tools → Console
2. Navigate to any page using balances
3. Look for address logging: `[MawSacrifice address] 0xB2e77ce03BC688C993Ee31F03000c56c211AD7db`
4. Check balance queries are hitting correct contract

### Method 4: Block Explorer Verification
Compare frontend balances with block explorer:
- **Relics Contract**: https://sepolia.basescan.org/address/0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b
- Go to "Read Contract" → `balanceOf` function
- Input your address and token ID
- Compare with frontend display

## 🔍 Debug Tools Available

### 1. DebugBalances Component
Shows detailed balance breakdown with warnings for old tokens:
```jsx
import { DebugBalances } from '../components/DebugBalances';
<DebugBalances />
```

### 2. Force Refresh Trigger  
Force balance refresh from anywhere:
```javascript
window.dispatchEvent(new Event('forceBalanceRefresh'));
```

### 3. Console Logging
Balance hooks log important information:
```
[MawSacrifice address] 0xB2e77ce03BC688C993Ee31F03000c56c211AD7db { chainId: 84532 }
🔄 Force refreshing balances due to custom event
```

## ⚠️ Common Issues & Solutions

### Issue: "No balances showing"
**Cause**: Wallet not connected or wrong network  
**Solution**: Connect to Base Sepolia (Chain ID 84532)

### Issue: "Stale balances after transaction"
**Cause**: Frontend not detecting transfer events  
**Solution**: Force refresh with QuickBalanceCheck component button

### Issue: "Wrong token quantities"
**Cause**: Frontend reading from wrong contract  
**Solution**: Verify contract addresses with test script

### Issue: "Old Token ID 1 showing"
**Cause**: Legacy data, contract uses ID 0 for caps  
**Solution**: This is normal, ID 1 is not used by current system

## 📊 Balance Flow Architecture

```
User Wallet
    ↓
useRelicBalances(chainId) → gets correct Relics address
    ↓
ERC1155.balanceOfBatch() → queries blockchain
    ↓  
Event Listeners → auto-refresh on transfers
    ↓
Frontend Components → display current balances
```

## 🚀 Performance Optimizations

1. **Batch queries** using `balanceOfBatch` instead of individual calls
2. **Event-driven updates** only refresh when user's tokens change  
3. **Debounced refreshing** prevents excessive API calls
4. **Stale-while-revalidate** keeps UI responsive during updates

## ✅ Verification Checklist

- [ ] Run `npm run test:balances` - all addresses consistent
- [ ] Add `<QuickBalanceCheck />` to a page - balances display correctly
- [ ] Make a transaction - balances update automatically  
- [ ] Compare with block explorer - numbers match exactly
- [ ] Check console logs - no old address warnings
- [ ] Force refresh works - manual updates possible

Your balance system is now robust, accurate, and future-proof! 🎉