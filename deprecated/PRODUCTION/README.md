# 🎮 ROT RITUAL - PRODUCTION READY FILES

**Status:** ✅ WORKING - All contracts tested and functional  
**Network:** Base Sepolia (Chain ID: 84532)  
**Last Updated:** August 28, 2025

## 📁 Folder Structure

```
PRODUCTION/
├── contracts/           # Contract addresses & configurations
├── frontend/           # Essential frontend files  
├── scripts/           # Testing & deployment scripts
├── docs/             # Documentation
└── README.md         # This file
```

## 🎯 **CRITICAL: For Mainnet Deployment**

When deploying to mainnet, you ONLY need to update files in this PRODUCTION folder:

### 📄 Files to Update with New Addresses:

1. **`contracts/WORKING_ADDRESSES.json`** - Master config file
2. **`frontend/useContracts.js`** - Frontend hook (lines 20-33)  
3. **`frontend/contracts-base-sepolia.json`** - SDK addresses
4. **`frontend/abis/deploy.output.json`** - Maw page addresses

### 🔧 Current Working Addresses (Base Sepolia):

```json
{
  "relics": "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b",
  "raccoons": "0x6DB1C2d60579679A82C3Ac39cf7097B442E1Aa9f", 
  "cosmetics": "0x8184FdB709f6B810d94d4Ed2b6196866EF604e68",
  "mawSacrifice": "0xf65B16c49E505F5BC5c941081c2FA213f8D15D2f" // ⭐ WORKING
}
```

## ✅ What's Working:

- [x] **Store Page** - Buy keys, display cosmetics ✅
- [x] **Maw Page** - Sacrifice keys, get rewards, success/failure modals ✅
- [x] **Contract Approval** - Approve MawSacrifice for spending relics ✅  
- [x] **Balance Updates** - Real-time balance refresh after transactions ✅
- [x] **Reward System** - Success modals with item images ✅
- [x] **Transaction Monitoring** - Proper success/failure detection ✅

## 🧪 Testing Commands:

```bash
# Check on-chain balances
PRIVATE_KEY=your_key npx hardhat run scripts/check-balances.js --network baseSepolia

# Test contract approval
PRIVATE_KEY=your_key npx hardhat run scripts/check-approval.js --network baseSepolia  

# Test sacrifice directly
PRIVATE_KEY=your_key npx hardhat run scripts/test-sacrifice.js --network baseSepolia
```

## 🚀 Mainnet Checklist:

1. Deploy contracts to mainnet
2. Update ALL addresses in the 4 files listed above
3. Test each feature (Store, Maw, approval, sacrifices)
4. Verify balances update correctly
5. Check success/failure modals show properly

## 🎨 Features:

- **Key Purchasing** - Buy Rusted Keys with ETH
- **Ritual Sacrifices** - Burn keys for random rewards  
- **Success/Failure Modals** - Beautiful UI with item images
- **Real-time Balance Updates** - Balances refresh after transactions
- **Item Images** - All relics have proper images and display
- **Transaction Parsing** - Detects rewards vs burned items properly

## 🔥 Key Learning:

**The most critical thing:** The MawSacrifice address `0xf65B16c49E505F5BC5c941081c2FA213f8D15D2f` is the WORKING one. Previous deployments created placeholder contracts that didn't actually do anything.

## 📝 Notes:

- All contract addresses have been tested and verified working
- Frontend correctly parses transaction results
- Success modals show "-2" for burned items, "×1" for rewards  
- Images display properly for all relic types
- Balance refresh works automatically after sacrifices

---

**🎯 USE ONLY THESE FILES FOR MAINNET DEPLOYMENT!**