# Cosmetics Deployment Guide

This guide covers how to add new cosmetics to the system while preserving existing cosmetics that users already own.

## Overview

The process involves:
1. Creating new cosmetic metadata and images
2. Uploading to IPFS
3. Updating smart contracts with new cosmetics
4. Retiring old cosmetics from the shop
5. Updating frontend to display new cosmetics

## Step-by-Step Process

### 1. Prepare New Cosmetic Assets

#### Create Cosmetic Images
- Design new cosmetic images for each slot type (head, face, body, fur, background)
- Ensure images are properly sized and formatted
- Create both preview images and layer images for trait replacement

#### Prepare Metadata
- Create JSON metadata for each cosmetic following ERC1155 standards
- Include properties: `name`, `description`, `image`, `attributes`
- Set proper rarity levels (1-5)
- Assign slot numbers (0=head, 1=face, 2=body, 3=fur, 4=background)

### 2. Upload to IPFS

#### Upload Images
```bash
# Upload individual cosmetic images to IPFS
# Note down the IPFS hashes for each image
```

#### Upload Metadata
```bash
# Upload metadata JSON files to IPFS
# Note down the IPFS hashes for metadata
```

#### Update IPFS Hash in Code
- Update the base IPFS hash in `src/components/CosmeticPreview.jsx` if using new trait layers
- Ensure paths match your IPFS directory structure

### 3. Smart Contract Updates

#### Add New Cosmetics to Contract
```bash
# Navigate to contracts directory
cd packages/contracts

# Run script to add new cosmetics (create this script based on your contract structure)
PRIVATE_KEY=your_private_key npx hardhat run scripts/add-new-cosmetics.js --network baseSepolia
```

#### Retire Old Cosmetics
```bash
# Run script to disable minting for old cosmetics while preserving ownership
PRIVATE_KEY=your_private_key npx hardhat run scripts/retire-old-cosmetics.js --network baseSepolia
```

### 4. Update Contract Addresses (if deployed new contracts)

#### Build Updated Addresses
```bash
cd packages/contracts
npm run build:packages
```

#### Verify Address Updates
- Check `src/addresses.json` for updated contract addresses
- Verify all contract addresses are properly set

### 5. Frontend Updates

#### Update Cosmetic Configuration
- Update slot configurations in `src/components/CosmeticSelectorModal.jsx` if needed
- Verify rarity configurations in `src/components/CosmeticPreview.jsx`

#### Test Cosmetic Loading
- Test that new cosmetics appear in the selector modal
- Verify old cosmetics still display for existing owners
- Test preview functionality with new cosmetics

### 6. Testing Checklist

#### Contract Testing
- [ ] New cosmetics can be minted
- [ ] Old cosmetics cannot be newly minted
- [ ] Existing owners still have their old cosmetics
- [ ] Cosmetic metadata loads correctly
- [ ] Slot assignments are correct

#### Frontend Testing
- [ ] New cosmetics appear in cosmetic selector
- [ ] Old cosmetics don't appear for new users
- [ ] Existing cosmetics still show for owners
- [ ] Preview system works with new cosmetics
- [ ] Trait layering works properly (when trait layers are available)
- [ ] Cross-slot equipping is prevented
- [ ] Remove/unequip functionality works

#### Integration Testing
- [ ] Cosmetics display correctly in ritual chamber
- [ ] Equipped cosmetics persist across sessions
- [ ] Cosmetic sacrificing works (if applicable)
- [ ] No conflicts between old and new cosmetics

### 7. Deployment Steps

#### Pre-deployment
1. Test thoroughly on Base Sepolia testnet
2. Verify all contract functions work as expected
3. Test frontend integration completely

#### Production Deployment
```bash
# Deploy to mainnet (when ready)
PRIVATE_KEY=your_private_key npx hardhat run scripts/deploy-new-cosmetics.js --network base

# Update addresses
npm run build:packages
```

#### Post-deployment
1. Verify contract deployment on block explorer
2. Test a few transactions on mainnet
3. Monitor for any issues
4. Update documentation

### 8. Important Notes

#### Data Preservation
- **NEVER** delete old cosmetic data from contracts
- Users must retain access to cosmetics they already own
- Only disable minting for retired cosmetics

#### IPFS Considerations
- Ensure IPFS content is pinned and won't disappear
- Consider using a reliable IPFS pinning service
- Keep backup of all IPFS hashes and content

#### Contract Upgrades
- If using upgradeable contracts, test upgrade process thoroughly
- Ensure upgrade doesn't break existing functionality
- Have rollback plan ready

#### Frontend Compatibility
- Ensure new cosmetics work with existing preview system
- Test that retired cosmetics still display for owners
- Verify all slot types work correctly

### 9. Emergency Procedures

#### If Something Goes Wrong
1. Immediately disable new cosmetic minting if needed
2. Check contract functions are working for existing users
3. Verify IPFS content is still accessible
4. Have contract pause functionality ready if implemented

#### Rollback Plan
- Keep previous contract addresses documented
- Have frontend rollback ready
- Ensure user data is never lost

### 10. Files to Track

#### Contract Files
- Deployment scripts
- Contract addresses
- Transaction hashes
- ABI files

#### Frontend Files
- `src/addresses.json`
- `src/components/CosmeticPreview.jsx`
- `src/components/CosmeticSelectorModal.jsx`
- `src/hooks/useCosmeticsV2.js`

#### Asset Files
- IPFS hashes for images
- IPFS hashes for metadata
- Backup of all digital assets

---

## Quick Reference Commands

```bash
# Test new cosmetics on testnet
PRIVATE_KEY=your_key npx hardhat run scripts/test-new-cosmetics.js --network baseSepolia

# Build and deploy
npm run build:packages
PRIVATE_KEY=your_key npx hardhat run scripts/deploy-cosmetics.js --network baseSepolia

# Start development server
npm run dev
```

---

*Last updated: [Current Date]*
*Remember: Always test thoroughly on testnet first!*