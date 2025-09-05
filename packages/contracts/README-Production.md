# Rot Ritual Contracts - Production Grade

Enterprise-ready smart contract system with comprehensive security, testing, and operational tooling.

## 🚀 Quick Start

```bash
# Health check entire system
npm run health

# Deploy to testnet with full automation
npm run release:baseSepolia

# Emergency pause (if needed)
npx hardhat run scripts/emergency-pause.js --network baseSepolia
```

## 🏗️ Architecture

### V4 Security Features

- **24-Hour Upgrade Timelock**: All upgrades require announce → 24h wait → execute
- **Role-Based Access Control**: Granular permissions with audit functions
- **Granular Pause Controls**: Separate pause states for sacrifices vs conversions
- **Version Tracking**: Automatic version bumping with event logging
- **Gas Regression Protection**: Automated testing prevents performance degradation

### Core Contracts

| Contract | Address Type | Purpose |
|----------|-------------|---------|
| **MawSacrificeV4Upgradeable** | UUPS Proxy | Main sacrifice logic with timelock security |
| **Relics** | Direct | ERC-1155 with role-based burn/mint permissions |
| **Demons** | Direct | ERC-721 with trait system and supply caps |
| **Cosmetics** | Direct | Monthly rotating cosmetic types |

## 🔐 Security Model

### Upgrade Security (V4)
```solidity
// Step 1: Announce upgrade
bytes32 upgradeId = maw.announceUpgrade(newImplementation);

// Step 2: Wait 24 hours (cannot be bypassed)

// Step 3: Execute upgrade
maw.executeUpgrade(upgradeId);
```

### Role Hierarchy
```
DEFAULT_ADMIN_ROLE
├── UPGRADER_ROLE (can announce/execute upgrades)
├── PAUSER_ROLE (can pause/unpause operations)
└── Contract-specific roles:
    ├── MAW_ROLE (can burn/mint relics)
    ├── MINTER_ROLE (can mint demons)
    └── RITUAL_ROLE (legacy ritual access)
```

### Emergency Controls
```bash
# Granular pause (recommended)
maw.pauseSacrifices()    # Stop all sacrifice operations
maw.pauseConversions()   # Stop shard→cap conversion only

# Global pause (nuclear option)  
maw.pause()              # Stop all contract operations
```

## 🧪 Testing & Quality Assurance

### Gas Regression Testing
```bash
npm run gas:snapshots
```
- Tracks gas usage for hot paths (sacrifice, conversion, minting)
- Fails CI if gas usage increases >20%
- Maintains historical baselines

### Fuzz Testing
```bash
npm run test:fuzz
```
- Property-based testing for economic invariants
- Mythic demon cap never exceeded
- Conversion ratios always respected
- Supply limits enforced under all conditions

### Integration Testing
```bash
npm run test:invariants
```
- End-to-end user journey testing
- Cross-contract interaction verification
- Economic balance validation

## 🔍 Operational Tools

### Deployment Health
```bash
npm run smoke:test       # Post-deploy verification
npm run verify:selectors # ABI drift detection
npm run check:noaddrs    # Hardcoded address audit
```

### Development Tools  
```bash
npm run dev:faucet       # Generate test tokens for all flows
npm run addresses        # Show current contract addresses
npm run health           # Comprehensive system check
```

### Debugging
```bash
# Custom error decoding
const { decodeError } = require('./lib/decodeError');
const decoded = decodeError(error, 'MawSacrificeV4Upgradeable');
console.log(decoded.message); // Human-readable error
```

## 📊 Economics & Game Design

### Core Mechanics ([Full Spec](./docs/Economy.md))
- **Glass Shard → Rusted Cap**: 5:1 conversion (guaranteed progression)
- **Mythic Demons**: 100 lifetime cap with auto-downgrade
- **Ultra-Rares**: 1/1 Binding Contract and Soul Deed
- **Failure Compensation**: Glass shards awarded on sacrifice failures

### Success Rates
| Activity | Success | Failure Reward |
|----------|---------|----------------|
| Key Sacrifice | 57% → Relics | 50% → Glass Shard |
| Cosmetic Sacrifice | 70% → Demons | 50% → Glass Shard |  
| Demon Sacrifice | 20-50% → Higher Tier | 100% → Glass Shard |

## 🚨 Emergency Runbook

Common issues and solutions: [Runbook.md](./docs/Runbook.md)

### Critical Issues
- **"Not authorized to burn"** → `npm run update-maw-address`
- **ABI drift detected** → `npm run build:packages`
- **Gas spike >20%** → Review recent changes, update baselines if needed
- **Mythic cap reached** → Expected behavior, mythics auto-downgrade

### Emergency Contacts
- Protocol issues: Check repo issues
- Network issues: Monitor gas prices and block times

## 🔄 Upgrade Process (V4)

### Planning Phase
1. Deploy new implementation contract
2. Test on testnet with full test suite
3. Run gas snapshots to check impact
4. Prepare migration scripts if needed

### Execution Phase (24h minimum)
```bash
# 1. Announce upgrade
upgradeId=$(maw.announceUpgrade(newImpl))

# 2. Wait exactly 24 hours

# 3. Execute upgrade  
maw.executeUpgrade(upgradeId)

# 4. Verify deployment
npm run health
```

### Post-Upgrade
```bash
npm run build:packages  # Update canonical packages
npm run smoke:test      # Verify all functions work
npm run gas:snapshots   # Check performance impact
```

## 📈 Monitoring & Metrics

### Key Performance Indicators
- **Mythic Demons Minted**: Track toward 100 cap
- **Glass Shard Economy**: Monitor inflation vs burn rate
- **Gas Usage Trends**: Detect efficiency regressions
- **Success Rate Variance**: Verify probability distributions

### Automated Alerts
- Gas usage spike >20%
- ABI drift detected
- Supply cap violations
- Failed upgrade attempts

## 🛠️ Development Workflow

### Branch Protection
```bash
# Required checks before merge
npm run compile          # Clean compilation
npm run test            # Full test suite  
npm run test:fuzz       # Property testing
npm run gas:snapshots   # Performance check
npm run check:noaddrs   # Security audit
```

### Release Checklist
- [ ] All tests pass
- [ ] Gas snapshots under limits  
- [ ] No hardcoded addresses
- [ ] Smoke tests pass on testnet
- [ ] Version number incremented
- [ ] Timelock planned for mainnet upgrade

## 📚 Documentation

- [Economy Design](./docs/Economy.md) - Economic mechanics and ratios
- [Production Runbook](./docs/Runbook.md) - Troubleshooting and emergency procedures
- [API Reference](./docs/API.md) - Contract interfaces and functions

## 🏆 Production Features

### ✅ Implemented
- 24-hour upgrade timelock with announce→execute pattern
- Role-based access control with audit functions  
- Granular pause controls (sacrifices vs conversions)
- Gas snapshot regression testing
- Foundry fuzz tests for economic invariants
- Selector verification (ABI drift protection)
- Automatic version bumping system
- Comprehensive production runbook
- Emergency pause procedures

### 🚀 Future Enhancements
- Multi-sig timelock governance
- Cross-chain bridge integration  
- Advanced economic rebalancing tools
- Real-time monitoring dashboard
- Automated security scanning