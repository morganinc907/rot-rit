const hre = require("hardhat");

async function main() {
  console.log('🎭 Updating seasonal cosmetics...');
  
  const [signer] = await hre.ethers.getSigners();
  const cosmeticsAddress = "0x13290aCbf346B17E82C8be01178A7b74F20F748d";
  const mawAddress = "0xB2e77ce03BC688C993Ee31F03000c56c211AD7db";
  
  // 🔧 CONFIGURE YOUR NEW SEASON HERE
  // ====================================
  const newSeasonCosmetics = [1, 2, 3, 4, 5]; // ← Change these cosmetic IDs
  
  // Optional: Customize pool weights (must match length of poolIds below)
  const useEqualWeights = true; // Set to false to use custom weights below
  const customWeights = [200, 100, 100, 100, 100, 100]; // Glass Shards higher chance
  // ====================================
  
  console.log('Signer:', signer.address);
  console.log('New season cosmetics:', newSeasonCosmetics);
  
  try {
    // Step 1: Verify all cosmetics exist and are active
    console.log('\n🔍 Verifying cosmetics...');
    const cosmetics = await hre.ethers.getContractAt("CosmeticsV2", cosmeticsAddress);
    
    for (const id of newSeasonCosmetics) {
      try {
        const exists = await cosmetics.typeExists(id);
        if (!exists) {
          console.log(`❌ Cosmetic ID ${id} does not exist!`);
          return;
        }
        
        const info = await cosmetics.getCosmeticInfo(id);
        if (!info.active) {
          console.log(`⚠️ Warning: Cosmetic ID ${id} (${info.name}) is inactive`);
        } else {
          console.log(`   ✅ ID ${id}: ${info.name} (Slot: ${info.slot}, Rarity: ${info.rarity})`);
        }
      } catch (e) {
        console.log(`❌ Error checking cosmetic ID ${id}:`, e.message);
        return;
      }
    }
    
    // Step 2: Update Season Catalog (what the store displays)
    console.log('\n📋 Updating season catalog...');
    console.log(`Setting getCurrentCosmeticTypes to: [${newSeasonCosmetics.join(', ')}]`);
    
    const seasonTx = await cosmetics.setCurrentCosmeticTypes(newSeasonCosmetics, {
      gasLimit: 300000,
      gasPrice: hre.ethers.parseUnits('2', 'gwei')
    });
    
    console.log('Transaction sent:', seasonTx.hash);
    await seasonTx.wait();
    console.log('✅ Season catalog updated!');
    
    // Wait a moment between transactions
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 3: Update Sacrifice Pool (what lantern sacrifices can mint)
    const maw = await hre.ethers.getContractAt("MawSacrificeV5", mawAddress);
    
    // Pool includes Glass Shards (ID 1) + your cosmetics
    const poolIds = [1, ...newSeasonCosmetics];
    const poolWeights = useEqualWeights 
      ? Array(poolIds.length).fill(100)
      : customWeights.slice(0, poolIds.length);
    
    console.log('\n🎲 Updating sacrifice pool...');
    console.log(`Pool IDs: [${poolIds.join(', ')}]`);
    console.log(`Weights: [${poolWeights.join(', ')}]`);
    console.log(`Total weight: ${poolWeights.reduce((a, b) => a + b, 0)}`);
    
    // Calculate drop chances
    const totalWeight = poolWeights.reduce((a, b) => a + b, 0);
    console.log('\n📊 Drop chances:');
    poolIds.forEach((id, i) => {
      const chance = ((poolWeights[i] / totalWeight) * 100).toFixed(1);
      const name = id === 1 ? 'Glass Shards' : `Cosmetic ${id}`;
      console.log(`   ${name}: ${chance}%`);
    });
    
    const poolTx = await maw.setCosmeticPool(poolIds, poolWeights, {
      gasLimit: 400000,
      gasPrice: hre.ethers.parseUnits('2', 'gwei')
    });
    
    console.log('\nTransaction sent:', poolTx.hash);
    await poolTx.wait();
    console.log('✅ Sacrifice pool updated!');
    
    // Step 4: Verify the update
    console.log('\n🔍 Verifying update...');
    
    const finalCatalog = await cosmetics.getCurrentCosmeticTypes();
    console.log('Store catalog:', finalCatalog.map(n => Number(n)));
    
    const finalPool = await maw.getCosmeticPool();
    console.log('Sacrifice pool:', {
      ids: finalPool[0].map(n => Number(n)),
      weights: finalPool[1].map(n => Number(n)),
      total: Number(finalPool[2])
    });
    
    // Success summary
    console.log('\n🎉 SEASONAL UPDATE COMPLETE!');
    console.log('=' * 50);
    console.log('✅ Store will display:', finalCatalog.map(n => Number(n)).join(', '));
    console.log('✅ Lantern sacrifices can mint from pool:', finalPool[0].map(n => Number(n)).join(', '));
    console.log('✅ Cap sacrifices still use the relic pool (unchanged)');
    
    console.log('\n📋 Next steps:');
    console.log('1. Visit the store to see new cosmetics displayed');
    console.log('2. Test a lantern fragment sacrifice to verify pool');
    console.log('3. Users may need to refresh to see changes');
    
  } catch (error) {
    console.log('❌ Error:', error.message);
    
    if (error.message.includes('replacement transaction underpriced')) {
      console.log('💡 Try increasing gas price or waiting a moment');
    } else if (error.message.includes('execution reverted')) {
      console.log('💡 Check permissions - are you the contract owner?');
    }
  }
}

// Export for programmatic use
if (require.main === module) {
  main().catch((error) => {
    console.error('Script failed:', error);
    process.exitCode = 1;
  });
}

module.exports = { main };