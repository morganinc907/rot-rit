const hre = require("hardhat");

async function main() {
  console.log('🎭 Testing getCurrentCosmeticTypes from MawSacrifice...');
  
  const [signer] = await hre.ethers.getSigners();
  const mawAddress = "0xB2e77ce03BC688C993Ee31F03000c56c211AD7db";
  
  try {
    const maw = await hre.ethers.getContractAt("MawSacrificeV5", mawAddress);
    
    // Check current cosmetic pool
    const currentPool = await maw.getCosmeticPool();
    console.log('\n📋 Current cosmetic pool:');
    console.log('  IDs:', currentPool[0].map(id => id.toString()));
    console.log('  Weights:', currentPool[1].map(w => w.toString()));
    console.log('  Total:', currentPool[2].toString());
    
    // Test getCurrentCosmeticTypes method
    try {
      const currentTypes = await maw.getCurrentCosmeticTypes();
      console.log('\n🎯 getCurrentCosmeticTypes() result:');
      console.log('  Types:', currentTypes.map(t => t.toString()));
      
      if (currentTypes.length === 0) {
        console.log('❌ No cosmetic types returned - this means store will be empty');
      } else {
        console.log('✅ Store will show these cosmetic type IDs');
      }
      
      // For each type, try to get info from cosmetics contract
      const cosmeticsAddress = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
      const cosmetics = await hre.ethers.getContractAt("CosmeticsV2", cosmeticsAddress);
      
      console.log('\n🔍 Checking each type in cosmetics contract:');
      for (const typeId of currentTypes) {
        const id = typeId.toString();
        console.log(`\n  Type ID ${id}:`);
        
        try {
          const exists = await cosmetics.typeExists(typeId);
          console.log(`    Type exists: ${exists}`);
          
          if (exists) {
            const info = await cosmetics.getCosmeticInfo(typeId);
            console.log(`    Name: ${info.name}`);
            console.log(`    Image URI: ${info.imageURI}`);
            console.log(`    Slot: ${info.slot}`);
            console.log(`    Active: ${info.active}`);
          }
        } catch (e) {
          console.log(`    Error getting info: ${e.message}`);
        }
      }
      
    } catch (error) {
      console.log('❌ Error calling getCurrentCosmeticTypes:', error.message);
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

main().catch((error) => {
  console.error('Script failed:', error);
  process.exitCode = 1;
});