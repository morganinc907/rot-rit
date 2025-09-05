# 🎭 Cosmetic Management Guide

This guide explains exactly how to update your seasonal cosmetics system when you want to change which cosmetics are available in the store and sacrifice pool.

## 🏗️ System Architecture

Your cosmetics system has two separate, clean components:

**A) CosmeticsV2 = "Season Catalog"** (What the store displays)
- Contract: `0x13290aCbf346B17E82C8be01178A7b74F20F748d`  
- Method: `getCurrentCosmeticTypes()` returns array of cosmetic IDs
- Store.jsx reads this to display available cosmetics

**B) MAW = "Sacrifice Pool"** (What lantern sacrifices can mint)
- Contract: `0xB2e77ce03BC688C993Ee31F03000c56c211AD7db`
- Method: `getCosmeticPool()` returns (ids[], weights[], totalWeight)
- Lantern fragment sacrifices draw from this pool

## 📋 Current Setup

**Active Cosmetics:** [1, 2, 3, 4, 5]
1. glasses (Slot 1, Rarity 1)
2. strainer (Slot 2, Rarity 1) 
3. pink (Slot 2, Rarity 3)
4. orange (Slot 4, Rarity 4)
5. underpants (Slot 2, Rarity 2)

**Store Catalog:** `[1, 2, 3, 4, 5]` (shows all 5)
**Sacrifice Pool:** `[1, 1, 2, 3, 4, 5]` (Glass Shards + all 5, equal weights)

---

# 🔄 How to Update Seasonal Cosmetics

## Step 1: Decide Your New Season

Choose which cosmetic IDs you want active for the new season.

**Example scenarios:**
- **Full refresh:** `[6, 7, 8, 9, 10]` (all new cosmetics)
- **Partial refresh:** `[1, 3, 6, 7, 8]` (keep some favorites, add new ones)
- **Themed season:** `[2, 4, 6]` (just 3 rare cosmetics)

## Step 2: Run the Update Script

Use this command template, replacing `NEW_COSMETIC_IDS` with your chosen IDs:

```bash
# Set your environment
export COSMETICS="0x13290aCbf346B17E82C8be01178A7b74F20F748d"
export MAW="0xB2e77ce03BC688C993Ee31F03000c56c211AD7db"
export NEW_COSMETIC_IDS="[1,2,3,4,5]"  # Replace with your IDs
export RPC="https://sepolia.base.org"
export OWNER_PK="your_private_key"

# Update Season Catalog (what store shows)
cast send $COSMETICS "setCurrentCosmeticTypes(uint256[])" "$NEW_COSMETIC_IDS" \
  --rpc-url $RPC --private-key $OWNER_PK

# Update Sacrifice Pool (what sacrifices can mint)
export POOL_IDS="[1,$NEW_COSMETIC_IDS_FLAT]"  # Glass Shards + cosmetics
export WEIGHTS="[100,100,100,100,100,100]"    # Equal weights, adjust count

cast send $MAW "setCosmeticPool(uint256[],uint256[])" "$POOL_IDS" "$WEIGHTS" \
  --rpc-url $RPC --private-key $OWNER_PK
```

## Step 3: Quick Script Method

Or use the automated script (create this file):

**File:** `scripts/update-seasonal-cosmetics.cjs`

```javascript
const hre = require("hardhat");

async function main() {
  console.log('🎭 Updating seasonal cosmetics...');
  
  const [signer] = await hre.ethers.getSigners();
  const cosmeticsAddress = "0x13290aCbf346B17E82C8be01178A7b74F20F748d";
  const mawAddress = "0xB2e77ce03BC688C993Ee31F03000c56c211AD7db";
  
  // 🔧 CONFIGURE YOUR NEW SEASON HERE
  const newSeasonCosmetics = [1, 2, 3, 4, 5]; // ← Change these IDs
  const poolWeights = Array(newSeasonCosmetics.length + 1).fill(100); // Equal weights
  
  console.log('New season cosmetics:', newSeasonCosmetics);
  
  try {
    // Step 1: Update Season Catalog
    const cosmetics = await hre.ethers.getContractAt("CosmeticsV2", cosmeticsAddress);
    
    console.log('\\n📋 Updating season catalog...');
    const seasonTx = await cosmetics.setCurrentCosmeticTypes(newSeasonCosmetics);
    await seasonTx.wait();
    console.log('✅ Season catalog updated!');
    
    // Step 2: Update Sacrifice Pool
    const maw = await hre.ethers.getContractAt("MawSacrificeV5", mawAddress);
    
    const poolIds = [1, ...newSeasonCosmetics]; // Glass Shards + cosmetics
    console.log('\\n🎲 Updating sacrifice pool...');
    console.log('Pool IDs:', poolIds);
    console.log('Weights:', poolWeights);
    
    const poolTx = await maw.setCosmeticPool(poolIds, poolWeights);
    await poolTx.wait();
    console.log('✅ Sacrifice pool updated!');
    
    // Step 3: Verify
    const finalCatalog = await cosmetics.getCurrentCosmeticTypes();
    const finalPool = await maw.getCosmeticPool();
    
    console.log('\\n🎉 UPDATE COMPLETE!');
    console.log('Store will show:', finalCatalog.map(n => Number(n)));
    console.log('Sacrifices can mint:', finalPool[0].map(n => Number(n)));
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

main().catch((error) => {
  console.error('Script failed:', error);
  process.exitCode = 1;
});
```

**Run it:**
```bash
PRIVATE_KEY=your_key npx hardhat run scripts/update-seasonal-cosmetics.cjs --network baseSepolia
```

---

# 🎨 Managing Individual Cosmetics

## Creating New Cosmetics

If you need to create brand new cosmetic types:

```javascript
// In your update script, add:
const tx = await cosmetics.createCosmeticType(
  "New Cosmetic Name",
  "ipfs://your-image-hash/image.png", 
  "ipfs://your-image-hash/preview.png",
  3, // rarity (1-5)
  2, // slot (0=HEAD, 1=FACE, 2=BODY, 3=FUR, 4=BACKGROUND)
  1, // monthlySetId
  1000 // maxSupply
);
```

## Deactivating Old Cosmetics

To remove cosmetics from circulation:

```javascript
await cosmetics.setTypeActive(cosmeticId, false);
```

## Checking Cosmetic Info

To see details about existing cosmetics:

```bash
# Check what cosmetics exist
PRIVATE_KEY=your_key npx hardhat run scripts/get-cosmetic-types.cjs --network baseSepolia

# Check current season
cast call $COSMETICS "getCurrentCosmeticTypes()(uint256[])" --rpc-url $RPC

# Check current sacrifice pool  
cast call $MAW "getCosmeticPool()(uint256[],uint256[],uint256)" --rpc-url $RPC
```

---

# 📈 Seasonal Strategy Examples

## Example 1: Monthly Rotation
```javascript
// January: Winter theme
const januaryCosmetics = [1, 5, 9]; // glasses, underpants, winter_hat

// February: Love theme  
const februaryCosmetics = [2, 6, 10]; // strainer, heart_eyes, cupid_wings

// March: Spring theme
const marchCosmetics = [3, 7, 11]; // pink, flower_crown, butterfly_wings
```

## Example 2: Rarity Events
```javascript
// Common Season (high drop rates)
const commonSeason = [1, 2, 5]; // All rarity 1-2
const commonWeights = [100, 100, 100, 100, 100, 100]; // Equal chances

// Legendary Season (low drop rates, rare items)
const legendarySeason = [12, 13]; // Only legendary cosmetics  
const legendaryWeights = [300, 50, 50]; // Glass Shards much more likely
```

## Example 3: Slot-Themed Seasons
```javascript
// Hat Month - only HEAD slot cosmetics
const hatSeason = [1, 6, 11]; // All slot 0 (HEAD)

// Face Month - only FACE slot cosmetics  
const faceSeason = [2, 3, 7]; // All slot 1 (FACE)
```

---

# ⚠️ Important Notes

## Before Each Update:
1. **Verify IDs exist:** Make sure all cosmetic IDs in your list actually exist
2. **Check active status:** Ensure cosmetics are active (`typeExists()` and `active: true`)
3. **Test weights:** Pool weights should add up properly and match the number of IDs
4. **Backup current state:** Note down current settings before changing

## After Each Update:
1. **Clear frontend cache:** Users may need to refresh to see new cosmetics
2. **Test sacrifice:** Do a test lantern fragment sacrifice to verify pool works
3. **Check store display:** Visit the store to confirm new cosmetics show up

## Gas Costs:
- `setCurrentCosmeticTypes()`: ~50k-100k gas depending on array size
- `setCosmeticPool()`: ~60k-120k gas depending on array size  
- **Budget:** ~$5-15 per seasonal update at reasonable gas prices

## Permissions:
- You must be the owner of both contracts to update
- Current owner: `0x52257934A41c55F4758b92F4D23b69f920c3652A`

---

# 🚀 Quick Reference

**Current Contracts:**
- Cosmetics: `0x13290aCbf346B17E82C8be01178A7b74F20F748d`
- MAW: `0xB2e77ce03BC688C993Ee31F03000c56c211AD7db`

**One-Command Update:**
```bash
# Edit the IDs in this command and run:
PRIVATE_KEY=your_key npx hardhat run scripts/update-seasonal-cosmetics.cjs --network baseSepolia
```

**Verify Update:**
```bash
# Check store catalog
cast call 0x13290aCbf346B17E82C8be01178A7b74F20F748d "getCurrentCosmeticTypes()(uint256[])" --rpc-url https://sepolia.base.org

# Check sacrifice pool
cast call 0xB2e77ce03BC688C993Ee31F03000c56c211AD7db "getCosmeticPool()(uint256[],uint256[],uint256)" --rpc-url https://sepolia.base.org
```

That's it! Your seasonal cosmetic management system is ready to go! 🎉