# Proxy Experiments - Deprecated

This folder contains various proxy implementation attempts that were created during the development process but ultimately not used.

## Final Working Solution

The working UUPS proxy solution consists of:
- `contracts/MawSacrificeV3Upgradeable.sol` - The proper initializable implementation
- `scripts/deploy-uups-proxy.js` - Working deployment script  
- `scripts/upgrade-proxy.js` - Future upgrade script

**Deployed Proxy Address:** `0xC6542a6c227Bc4C674E17dbEfc2AEc851f962456`

## Deprecated Files (Learning Process)

### Failed Proxy Contracts:
- `MawSacrificeProxy.sol` - ERC1967Proxy attempt (storage issues)
- `SimpleMawProxy.sol` - TransparentUpgradeableProxy attempt (initialization issues)
- `MawSacrificeV3Proxy.sol` - Custom proxy attempt (complexity issues)
- `MawForwarder.sol` - Simple forwarder attempt (not true proxy)

### Failed Scripts:
- `deploy-maw-proxy.js` - Early proxy deployment attempt
- `deploy-proxy.js` - Generic proxy deployment
- `deploy-proxy-complete.js` - TransparentUpgradeableProxy deployment
- `test-proxy-basic.js` - Testing TransparentUpgradeableProxy
- `check-deployed-proxy.js` - Debugging proxy issues

## Lessons Learned

1. **Constructor vs Initializer**: Regular OpenZeppelin contracts use constructors, but proxy patterns need initializers
2. **Storage Conflicts**: Proxy and implementation must use compatible storage layouts  
3. **UUPS vs Transparent**: UUPS is cleaner - upgrade logic in implementation, not proxy
4. **OpenZeppelin Plugin**: Use `@openzeppelin/hardhat-upgrades` for proper deployment

## What Worked

The final solution uses:
- `UUPSUpgradeable` from OpenZeppelin
- Proper `initializer` instead of constructor
- All state initialization in the proxy's storage space
- OpenZeppelin's deployment plugin for proper setup

This gives us the stable address we wanted: no more manual updates across contracts and frontend!