# 🧪 Rot & Ritual Testing Guide

This guide covers how to test the complete Rot & Ritual ecosystem locally and on testnets.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Local Testing (Recommended)
```bash
# Terminal 1: Start local blockchain
npm run node

# Terminal 2: Deploy contracts and start frontend
npm run test:local
```

### 3. Run Smart Contract Tests
```bash
npm run test
```

## 📋 Testing Phases

### Phase 1: Local Development Testing ✅
- **Purpose**: Quick iteration and debugging
- **Network**: Hardhat local (chainId: 1337)
- **Benefits**: Fast, free, full control

### Phase 2: Testnet Testing
- **Purpose**: Real network conditions
- **Network**: Base Sepolia (chainId: 84532)
- **Benefits**: Real gas costs, MEV, network delays

### Phase 3: Mainnet Preparation
- **Purpose**: Final verification before launch
- **Network**: Base Mainnet (chainId: 8453)
- **Requirements**: Chainlink VRF, final audits

## 🔧 Local Testing Setup

### Prerequisites
- Node.js 18+
- MetaMask or similar wallet
- Git

### Step-by-Step

1. **Clone and Install**
   ```bash
   git clone <your-repo>
   cd rot-ritual-web
   npm install
   ```

2. **Start Local Blockchain**
   ```bash
   npm run node
   ```
   This starts a local Hardhat network on `http://localhost:8545`

3. **Deploy Contracts**
   ```bash
   npm run deploy:local
   ```
   This deploys all 9 contracts and saves addresses to `src/contracts-local.json`

4. **Configure MetaMask**
   - Network Name: `Hardhat Local`
   - RPC URL: `http://localhost:8545`
   - Chain ID: `1337`
   - Currency: `ETH`

5. **Import Test Account**
   ```
   Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
   Address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
   ```
   ⚠️ **Never use this key in production!**

6. **Start Frontend**
   ```bash
   npm run dev
   ```

## 🧪 Test Scenarios

### A. KeyShop Testing
```bash
# Test buying keys
1. Connect wallet to local network
2. Go to /store page
3. Buy 1-10 keys with ETH
4. Check Relics balance increases
```

### B. MawSacrifice Testing
```bash
# Test key sacrifice
1. Have keys from KeyShop
2. Go to /maw page, Keys tab
3. Sacrifice 1-10 keys
4. Check for relic rewards (random)

# Test cosmetic rituals
1. Have Lantern Fragments from key sacrifice
2. Go to Cosmetics tab
3. Sacrifice fragments (+ masks if available)
4. Check for cosmetic rewards or ashes

# Test demon rituals (requires cultists)
1. Need cultist NFT from rituals
2. Go to Demons tab
3. Select cultist to sacrifice
4. Add daggers/vials if available
5. Attempt demon summoning
```

### C. Cosmetic Application
```bash
# Test applying cosmetics
1. Have cosmetic NFT from MawSacrifice
2. Have raccoon NFT
3. Go to cosmetics application
4. Apply cosmetic to raccoon
5. Check cosmetic is burned and applied
```

## 📊 Smart Contract Tests

Run comprehensive integration tests:
```bash
npm run test
```

### Test Coverage
- ✅ Contract deployment and configuration
- ✅ KeyShop purchase flow
- ✅ MawSacrifice key → relic flow
- ✅ Cosmetic ritual mechanics
- ✅ Demon ritual mechanics (with cultist burning)
- ✅ Cosmetic application flow
- ✅ Gas usage optimization
- ✅ Error handling and edge cases

### Example Test Output
```
🧪 Rot & Ritual Integration Tests
  🔗 Contract Integration
    ✅ Should verify all contracts are properly configured
  🛒 KeyShop Flow
    ✅ Should allow buying keys with ETH
    ✅ Should reject insufficient payment
  🌑 MawSacrifice Flow
    ✅ Should sacrifice keys for relics
    ✅ Should perform cosmetic ritual with fragments
    ✅ Should require cultist for demon sacrifice
  🎨 Cosmetic Application
    ✅ Should allow applying cosmetics to raccoons
    ✅ Should calculate cosmetic scores correctly
  ⛽ Gas Usage Tests
    ✅ Should use batch burns for gas efficiency

🚨 Edge Cases & Error Handling
  ✅ Should reject sacrificing 0 keys
  ✅ Should reject sacrificing more than 10 keys
  ✅ Should reject cosmetic ritual with 0 fragments
```

## 🌐 Testnet Testing

### Base Sepolia Setup

1. **Get Base Sepolia ETH**
   - Use [Base Sepolia Faucet](https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet)
   - Or bridge from Sepolia ETH

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Add your private key and RPC URLs
   PRIVATE_KEY=your_private_key_here
   BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
   ```

3. **Deploy to Testnet**
   ```bash
   npm run deploy:base
   ```

4. **Update Frontend Config**
   ```javascript
   // Update App.jsx wagmi config to include Base Sepolia
   const config = getDefaultConfig({
     chains: [baseSepolia],
     // ... rest of config
   });
   ```

## 🔍 Testing Checklist

### Smart Contract Level
- [ ] All contracts compile successfully
- [ ] All tests pass
- [ ] Gas usage within reasonable limits
- [ ] Access control working correctly
- [ ] Events are properly emitted
- [ ] Error handling works as expected

### Integration Level  
- [ ] Contract addresses properly configured
- [ ] Cross-contract calls work correctly
- [ ] Batch operations save gas
- [ ] Randomness produces varied results
- [ ] Supply limits enforced correctly

### Frontend Level
- [ ] Wallet connection works
- [ ] Contract interactions complete successfully
- [ ] UI updates after transactions
- [ ] Error messages are user-friendly
- [ ] Loading states work correctly
- [ ] Transaction confirmations display

### End-to-End User Flows
- [ ] **Complete Key Purchase Flow**: ETH → Keys → Sacrifice → Relics
- [ ] **Complete Cosmetic Flow**: Relics → Sacrifice → Cosmetic → Apply to Raccoon  
- [ ] **Complete Demon Flow**: Relics + Cultist → Sacrifice → Demon (or ashes)
- [ ] **Error Handling**: Insufficient funds, wrong network, failed transactions

## 🚨 Common Issues & Solutions

### "Local contracts not found"
**Solution**: Run `npm run deploy:local` first

### "Wrong network" in frontend
**Solution**: Switch MetaMask to Hardhat Local (chainID: 1337)

### "Transaction failed" 
**Solutions**:
- Check you have enough ETH for gas
- Ensure you have the required tokens/NFTs
- Verify contract addresses are correct

### "Compilation failed"
**Solutions**: 
- Run `npm run clean` then `npm run compile`
- Check Solidity version compatibility
- Verify all imports are correct

### Tests timing out
**Solutions**:
- Increase test timeout in hardhat.config.js
- Check for infinite loops in contracts
- Verify test network is running

## 📈 Performance Benchmarks

| Operation | Expected Gas | Max Acceptable |
|-----------|--------------|----------------|
| Buy Keys | ~50,000 | 80,000 |
| Sacrifice Keys | ~100,000 | 150,000 |
| Cosmetic Ritual | ~120,000 | 180,000 |
| Demon Ritual | ~150,000 | 200,000 |
| Apply Cosmetic | ~80,000 | 120,000 |

## 🎯 Success Criteria

### Local Testing ✅
- [ ] All contracts deploy successfully
- [ ] All integration tests pass
- [ ] Frontend connects and works
- [ ] User flows complete end-to-end

### Testnet Testing 
- [ ] Contracts work with real network conditions
- [ ] Gas costs are reasonable
- [ ] No unexpected failures
- [ ] UI/UX feels responsive

### Ready for Mainnet
- [ ] Chainlink VRF integrated
- [ ] Security audit completed
- [ ] All tests pass on testnet
- [ ] Community testing completed
- [ ] Launch strategy finalized

## 🆘 Support

If you encounter issues:
1. Check this guide first
2. Review test output and error messages  
3. Check network and wallet configuration
4. Verify contract addresses
5. Run tests to isolate the problem

The testing setup is comprehensive and should catch most issues before they reach users. Happy testing! 🚀