# Production Runbook

This runbook covers common production issues and their solutions for the Rot Ritual contracts.

## Quick Reference

### Contract Addresses
- Use `npm run addresses` to get current addresses for all networks
- All contracts are deployed via UUPS proxy pattern for stable addresses

### Common Commands
```bash
npm run smoke:test           # Health check after deployment
npm run gas:snapshots        # Check gas usage regression
npm run verify:selectors     # Verify ABI matches bytecode
npm run check:noaddrs        # Ensure no hardcoded addresses
```

## Issue Troubleshooting

### 🚨 "Not authorized to burn" Error

**Symptom**: Key sacrifice fails with "Not authorized to burn"

**Diagnosis**:
```bash
# Check if Relics contract points to current Maw proxy
npx hardhat run scripts/check-auth-simple.js --network <network>
```

**Solution**:
```bash
# Update Relics to point to current Maw proxy
npx hardhat run scripts/update-relics-maw-address.js --network <network>
```

**Root Cause**: Relics contract has stale Maw address after upgrade

---

### 🚨 "Sacrifice function reverts with no reason"

**Symptom**: `sacrificeKeys()`, `sacrificeCosmetics()`, etc. revert without clear error

**Diagnosis**:
1. Check if sacrifices are paused:
```javascript
const pauseStatus = await maw.getPauseStatus();
// Returns: [globalPaused, sacrificesPaused, conversionsPaused]
```

2. Check anti-bot throttle:
```javascript
const lastBlock = await maw.lastSacrificeBlock(userAddress);
const currentBlock = await ethers.provider.getBlockNumber();
const minBlocks = await maw.minBlocksBetweenSacrifices();
// User must wait: minBlocks - (currentBlock - lastBlock) more blocks
```

**Solutions**:
- If sacrifices paused: `maw.unpauseSacrifices()` (requires PAUSER_ROLE)
- If throttled: Wait for blocks to pass or reduce `minBlocksBetweenSacrifices`
- If insufficient balance: Check user has required tokens

---

### 🚨 "Conversion fails with InvalidAmount"

**Symptom**: `convertShardsToRustedCaps()` fails

**Diagnosis**:
```javascript
// Shard conversion requires multiples of 5
const shardAmount = 23; // ❌ Not multiple of 5
const shardAmount = 25; // ✅ Valid
```

**Solution**: Ensure shard amounts are multiples of 5 (5:1 ratio)

---

### 🚨 "Mythic demon minting fails"

**Symptom**: High-tier demon sacrifice succeeds but no mythic minted

**Diagnosis**:
```javascript
const mythicsMinted = await maw.mythicDemonsMinted();
const maxMythics = await maw.MAX_MYTHIC_DEMONS(); // 100
// If mythicsMinted >= 100, all mythics are exhausted
```

**Solution**: This is expected behavior. Mythics auto-downgrade to rare when cap reached.

---

### 🚨 "Supply exceeded" errors

**Symptom**: Relics minting fails with "MaxSupplyExceeded"

**Diagnosis**:
```javascript
const [current, maximum] = await relics.getSupplyInfo(6); // Binding Contract
const [current2, maximum2] = await relics.getSupplyInfo(7); // Soul Deed
// Both should have maximum = 1 (ultra-rare 1/1 items)
```

**Solution**: This is expected for ultra-rare items (Binding Contract, Soul Deed). Only 1 of each exists.

---

### 🚨 "Proxy upgrade failures"

**Symptom**: `announceUpgrade()` or `executeUpgrade()` fails

**Diagnosis**:
1. Check if upgrade was announced:
```javascript
const announcement = await maw.announcements(upgradeId);
// Should return: newImplementation, announceTime, executed
```

2. Check if delay has passed:
```javascript
const delay = await maw.UPGRADE_DELAY(); // 24 hours
const canExecute = announcement.announceTime + delay <= block.timestamp;
```

**Solutions**:
- Wait for 24-hour delay before executing
- Use correct upgradeId from announcement
- Ensure caller has UPGRADER_ROLE

---

### 🚨 "ABI drift detected"

**Symptom**: `npm run verify:selectors` reports missing selectors

**Diagnosis**: Deployed contract doesn't match the ABI in packages

**Solution**:
```bash
# Regenerate canonical packages from current deployments
npm run build:packages

# Or regenerate specific proxy deployment
CONTRACT=MawSacrificeV4Upgradeable PROXY=<address> \
  npx hardhat run scripts/genProxyDeployment.js --network <network>
```

---

### 🚨 "Gas usage spiked"

**Symptom**: `npm run gas:snapshots` reports >20% increase

**Diagnosis**: Recent changes increased gas costs

**Solutions**:
1. **If intentional**: Update gas baselines
2. **If unintentional**: Review recent changes for inefficiencies
3. **Quick fix**: Check if new external calls were added

---

### 🚨 "Role access denied"

**Symptom**: Admin functions fail with "AccessControl: account ... is missing role ..."

**Diagnosis**:
```javascript
// Check roles
const hasRole = await contract.hasRole(ROLE_HASH, accountAddress);
const roleAdmin = await contract.getRoleAdmin(ROLE_HASH);
```

**Solution**:
```javascript
// Grant role (requires admin)
await contract.grantRole(ROLE_HASH, accountAddress);
```

**Common Roles**:
- Relics: `MAW_ROLE`, `RITUAL_ROLE`, `KEYSHOP_ROLE`
- Demons: `MINTER_ROLE`
- MawSacrifice: `UPGRADER_ROLE`, `PAUSER_ROLE`

## Emergency Procedures

### 🚨 Emergency Pause

**If**: Critical vulnerability discovered

**Action**:
```bash
# Pause all operations immediately
maw.pause() # Requires PAUSER_ROLE

# Or granular pause
maw.pauseSacrifices()  # Stop all sacrifice operations
maw.pauseConversions() # Stop shard conversions only
```

### 🚨 Emergency Role Revocation

**If**: Compromised contract or account

**Action**:
```bash
# Revoke dangerous roles immediately
relics.revokeRole(MAW_ROLE, compromisedAddress)
demons.revokeRole(MINTER_ROLE, compromisedAddress)
maw.revokeRole(UPGRADER_ROLE, compromisedAddress)
```

### 🚨 Emergency Upgrade

**If**: Critical fix needed immediately

**Action**:
1. Deploy new implementation
2. Announce upgrade: `maw.announceUpgrade(newImpl)`
3. **Wait 24 hours** (timelock cannot be bypassed)
4. Execute: `maw.executeUpgrade(upgradeId)`

## Monitoring

### Key Metrics to Watch

1. **Mythic demon count**: Should never exceed 100
2. **Supply caps**: Binding Contract and Soul Deed should stay at 1
3. **Gas usage**: Track with snapshots to detect regressions
4. **Version strings**: Should update with each upgrade
5. **Pause states**: Monitor for unexpected pausing

### Health Checks

Run after any changes:
```bash
npm run smoke:test      # Comprehensive deployment health
npm run gas:snapshots   # Gas regression check
npm run verify:selectors # ABI drift check
npm run check:noaddrs   # Hardcoded address audit
```

## Performance Tuning

### Gas Optimization Tips

1. **Batch operations**: Use `mintBatch()` and `burnBatch()` when possible
2. **Avoid repeated storage reads**: Cache values in memory
3. **Optimize loop bounds**: Early termination conditions
4. **Pack structs**: Use appropriate data types

### Rate Limiting

- `minBlocksBetweenSacrifices`: Default 1 block (adjust for network congestion)
- Anti-bot protection: Prevents MEV and spam
- Can be set to 0 for testing, higher for mainnet

## Recovery Procedures

### Lost Private Key

**If**: Admin key compromised or lost

**Action**:
1. Transfer ownership to new address (if possible)
2. Update all role assignments
3. Test all admin functions with new key
4. Update deployment scripts with new admin

### Wrong Contract State

**If**: Contract in inconsistent state

**Diagnosis**:
```bash
# Check all contract states
npx hardhat run scripts/comprehensive-state-check.js --network <network>
```

**Recovery**: Usually requires upgrade with state migration logic

## Support Contacts

- **Protocol Issues**: Check GitHub Issues
- **Network Issues**: Check network status pages
- **Gas Issues**: Monitor network gas prices

## Version History

Track all upgrades:
```javascript
const version = await maw.version();
// Format: "MawSacrificeV4Upgradeable-1.0.0"
```

Always verify version matches expected after upgrade.