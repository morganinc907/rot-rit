const hre = require("hardhat");

async function main() {
  console.log('🏥 Verifying cosmetic system health...');
  
  const cosmeticsAddress = "0x13290aCbf346B17E82C8be01178A7b74F20F748d";
  const mawAddress = "0xB2e77ce03BC688C993Ee31F03000c56c211AD7db";
  
  try {
    const cosmetics = await hre.ethers.getContractAt("CosmeticsV2", cosmeticsAddress);
    const maw = await hre.ethers.getContractAt("MawSacrificeV5", mawAddress);
    
    console.log('\n📋 Contract Addresses:');
    console.log('Cosmetics:', cosmeticsAddress);
    console.log('MAW:', mawAddress);
    
    // Check Season Catalog
    console.log('\n🏪 Season Catalog (Store Display):');
    try {
      const catalogTypes = await cosmetics.getCurrentCosmeticTypes();
      
      if (catalogTypes.length === 0) {
        console.log('❌ No cosmetics in season catalog!');
        console.log('💡 Run: setCurrentCosmeticTypes([1,2,3,4,5])');
      } else {
        console.log(`✅ Active season: [${catalogTypes.map(n => Number(n)).join(', ')}]`);
        
        // Verify each cosmetic
        for (const typeId of catalogTypes) {
          try {
            const info = await cosmetics.getCosmeticInfo(typeId);
            const status = info.active ? '✅' : '⚠️';
            console.log(`   ${status} ID ${typeId}: ${info.name} (Active: ${info.active})`);
          } catch (e) {
            console.log(`   ❌ ID ${typeId}: Error getting info`);
          }
        }
      }
    } catch (e) {
      console.log('❌ Could not read season catalog:', e.message);
    }
    
    // Check Sacrifice Pool
    console.log('\n🎲 Sacrifice Pool (Lantern Fragment Rewards):');
    try {
      const poolData = await maw.getCosmeticPool();
      const poolIds = poolData[0].map(n => Number(n));
      const poolWeights = poolData[1].map(n => Number(n));
      const totalWeight = Number(poolData[2]);
      
      if (poolIds.length === 0) {
        console.log('❌ Empty sacrifice pool!');
        console.log('💡 Run: setCosmeticPool([1,2,3,4,5], [100,100,100,100,100])');
      } else {
        console.log(`✅ Pool IDs: [${poolIds.join(', ')}]`);
        console.log(`✅ Weights: [${poolWeights.join(', ')}]`);
        console.log(`✅ Total weight: ${totalWeight}`);
        
        // Calculate and show drop rates
        console.log('\n📊 Drop chances:');
        poolIds.forEach((id, i) => {
          const chance = ((poolWeights[i] / totalWeight) * 100).toFixed(1);
          let name;
          if (id === 1) {
            name = 'Glass Shards (fallback)';
          } else {
            name = `Cosmetic ${id}`;
          }
          console.log(`   ${name}: ${chance}%`);
        });
      }
    } catch (e) {
      console.log('❌ Could not read sacrifice pool:', e.message);
    }
    
    // Check Contract Health  
    console.log('\n🔗 Contract Integration:');
    try {
      const mawCosmeticsAddr = await maw.cosmetics();
      if (mawCosmeticsAddr.toLowerCase() === cosmeticsAddress.toLowerCase()) {
        console.log('✅ MAW points to correct Cosmetics contract');
      } else {
        console.log('⚠️ MAW points to wrong Cosmetics contract:');
        console.log(`   Expected: ${cosmeticsAddress}`);
        console.log(`   Actual: ${mawCosmeticsAddr}`);
        console.log('💡 Run: maw.setContracts(raccoons, newCosmetics)');
      }
    } catch (e) {
      console.log('❌ Could not verify MAW integration');
    }
    
    // Check permissions
    console.log('\n🔐 Permissions:');
    try {
      const [signer] = await hre.ethers.getSigners();
      const cosmeticsOwner = await cosmetics.owner();
      const mawOwner = await maw.owner();
      
      console.log('Your address:', signer.address);
      console.log('Cosmetics owner:', cosmeticsOwner);
      console.log('MAW owner:', mawOwner);
      
      const canUpdateCosmetics = signer.address.toLowerCase() === cosmeticsOwner.toLowerCase();
      const canUpdateMaw = signer.address.toLowerCase() === mawOwner.toLowerCase();
      
      if (canUpdateCosmetics && canUpdateMaw) {
        console.log('✅ You can update both contracts');
      } else {
        console.log('❌ Missing permissions:');
        if (!canUpdateCosmetics) console.log('   Cannot update Cosmetics contract');
        if (!canUpdateMaw) console.log('   Cannot update MAW contract');
      }
    } catch (e) {
      console.log('❌ Could not verify permissions');
    }
    
    // Summary
    console.log('\n📋 SYSTEM HEALTH SUMMARY:');
    console.log('=' * 40);
    console.log('🏪 Store: Reads CosmeticsV2.getCurrentCosmeticTypes()');
    console.log('🎲 Sacrifice: Reads MAW.getCosmeticPool()');
    console.log('📱 Frontend: Updates automatically when contracts change');
    
    console.log('\n🔧 To update seasonals:');
    console.log('1. Edit: scripts/update-seasonal-cosmetics.cjs');
    console.log('2. Run: PRIVATE_KEY=xxx npx hardhat run scripts/update-seasonal-cosmetics.cjs --network baseSepolia');
    console.log('3. Verify: PRIVATE_KEY=xxx npx hardhat run scripts/verify-system-health.cjs --network baseSepolia');
    
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
  }
}

main().catch((error) => {
  console.error('Script failed:', error);
  process.exitCode = 1;
});