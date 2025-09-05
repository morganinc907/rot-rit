const hre = require("hardhat");

async function main() {
  console.log('🗓️ Checking monthly cosmetic sets...');
  
  const [signer] = await hre.ethers.getSigners();
  const cosmeticsAddress = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
  
  try {
    const cosmetics = await hre.ethers.getContractAt("CosmeticsV2", cosmeticsAddress);
    
    // Check current monthly set
    try {
      const currentSet = await cosmetics.currentMonthlySetId();
      console.log(`\n📅 Current monthly set ID: ${currentSet.toString()}`);
      
      // Check what cosmetics are in this set
      console.log('\n🎭 Cosmetics in current monthly set:');
      
      for (let i = 0; i < 20; i++) {
        try {
          const cosmeticId = await cosmetics.monthlySetCosmetics(currentSet, i);
          if (cosmeticId.toString() !== '0') {
            console.log(`   Slot ${i}: Cosmetic ID ${cosmeticId.toString()}`);
            
            // Try to get info about this cosmetic
            try {
              const info = await cosmetics.getCosmeticInfo(cosmeticId);
              console.log(`     Name: ${info.name}`);
              console.log(`     Slot: ${info.slot}`);
            } catch (e) {
              console.log(`     (Could not get info)`);
            }
          }
        } catch (e) {
          // No more cosmetics in this slot
          break;
        }
      }
      
    } catch (e) {
      console.log('❌ Could not get monthly set info:', e.message);
    }
    
    // Check if any cosmetics exist by trying to get URIs
    console.log('\n🔍 Checking for existing cosmetics by URI...');
    
    const existingCosmetics = [];
    
    for (let id = 0; id < 100; id++) {
      try {
        const uri = await cosmetics.uri(id);
        if (uri && uri !== '') {
          console.log(`✅ ID ${id} has URI: ${uri}`);
          existingCosmetics.push(id);
          
          // Try to get more details
          try {
            const exists = await cosmetics.typeExists(id);
            console.log(`   Type exists: ${exists}`);
            
            if (exists) {
              const info = await cosmetics.getCosmeticInfo(id);
              console.log(`   Name: ${info.name}`);
              console.log(`   Slot: ${info.slot}`);
            }
          } catch (e) {
            console.log(`   (Could not verify type existence)`);
          }
        }
      } catch (e) {
        // No URI for this ID
      }
    }
    
    if (existingCosmetics.length > 0) {
      console.log('\n🎯 Found existing cosmetic IDs:', existingCosmetics);
      console.log('\n🔧 For MAW cosmetic pool, should include:');
      console.log('- Glass Shards (ID 1) as fallback');
      console.log('- Actual cosmetics:', existingCosmetics);
      
      const poolIds = [1, ...existingCosmetics]; // Glass Shards + actual cosmetics
      console.log('- Suggested pool:', poolIds);
    } else {
      console.log('\n❌ No existing cosmetics found');
      console.log('💡 The cosmetic system might not be set up yet');
      console.log('💡 For now, cosmetic pool should just be Glass Shards (ID 1)');
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

main().catch((error) => {
  console.error('Script failed:', error);
  process.exitCode = 1;
});