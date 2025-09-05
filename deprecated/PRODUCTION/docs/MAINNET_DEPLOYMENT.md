# 🚀 MAINNET DEPLOYMENT GUIDE

## Step 1: Deploy Contracts to Mainnet

```bash
# Deploy all contracts to mainnet
npx hardhat run scripts/deploy-complete-v2.js --network mainnet
```

## Step 2: Update Contract Addresses (CRITICAL!)

Update these 4 files with your NEW mainnet addresses:

### 📄 File 1: `contracts/WORKING_ADDRESSES.json`
```json
{
  "network": "Ethereum Mainnet",
  "chainId": 1,
  "contracts": {
    "relics": "0xNEW_RELICS_ADDRESS",
    "raccoons": "0xNEW_RACCOONS_ADDRESS",
    "cosmetics": "0xNEW_COSMETICS_ADDRESS", 
    "mawSacrifice": "0xNEW_MAWSACRIFICE_ADDRESS"
  }
}
```

### 📄 File 2: `frontend/useContracts.js` (lines 20-33)
```javascript
if (chainId === 1) {
  return {
    relics: "0xNEW_RELICS_ADDRESS",
    raccoons: "0xNEW_RACCOONS_ADDRESS", 
    cosmetics: "0xNEW_COSMETICS_ADDRESS",
    mawSacrifice: "0xNEW_MAWSACRIFICE_ADDRESS",
    rituals: "0xNEW_MAWSACRIFICE_ADDRESS", // Same as mawSacrifice
    // ... other addresses
  };
}
```

### 📄 File 3: `frontend/contracts-base-sepolia.json` 
Rename to `contracts-mainnet.json` and update all addresses.

### 📄 File 4: `frontend/abis/deploy.output.json`
```json
{
  "1": {
    "MawSacrificeV2": "0xNEW_MAWSACRIFICE_ADDRESS",
    "CosmeticsV2": "0xNEW_COSMETICS_ADDRESS",
    "RelicsV2": "0xNEW_RELICS_ADDRESS",
    "Relics": "0xNEW_RELICS_ADDRESS"
  },
  "MawSacrificeV2": "0xNEW_MAWSACRIFICE_ADDRESS",
  "CosmeticsV2": "0xNEW_COSMETICS_ADDRESS"
}
```

## Step 3: Update Chain ID References

Change all references from `84532` (Base Sepolia) to `1` (Mainnet) in:
- `frontend/useContracts.js`
- `frontend/contracts-sdk.js`

## Step 4: Test Everything

```bash
# Test balances
PRIVATE_KEY=your_mainnet_key npx hardhat run scripts/check-balances.js --network mainnet

# Test approval  
PRIVATE_KEY=your_mainnet_key npx hardhat run scripts/check-approval.js --network mainnet

# Test sacrifice
PRIVATE_KEY=your_mainnet_key npx hardhat run scripts/test-sacrifice.js --network mainnet
```

## Step 5: Verification Checklist

- [ ] Store page loads and shows cosmetics
- [ ] Maw page allows contract approval
- [ ] Key sacrifices work and show success modal
- [ ] Balances update after transactions
- [ ] Item images display correctly
- [ ] Success/failure messages work

## ⚠️ CRITICAL REMINDERS:

1. **Test on testnet first** - Always deploy to testnet and verify everything works
2. **Double-check all 4 files** - Miss one file = broken dapp
3. **Backup everything** - Keep copies of working addresses
4. **Gas prices** - Mainnet has higher gas costs
5. **LINK tokens** - Fund VRF subscription if using Chainlink

## 🎯 Success Criteria:

✅ Users can buy keys from Store  
✅ Users can approve MawSacrifice contract  
✅ Users can sacrifice keys and get rewards  
✅ Success modal shows with item images  
✅ Balances update correctly  

**When all checkboxes are ✅, you're ready for mainnet launch! 🚀**