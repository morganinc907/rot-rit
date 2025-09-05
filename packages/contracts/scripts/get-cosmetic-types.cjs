const hre = require("hardhat");

async function main() {
  console.log('🎭 Getting actual cosmetic types from cosmetics contract...');
  
  const [signer] = await hre.ethers.getSigners();
  const cosmeticsAddress = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
  
  try {
    const cosmetics = await hre.ethers.getContractAt("CosmeticsV2", cosmeticsAddress);
    
    console.log('\n🔍 Checking cosmetic types (IDs 0-50)...');
    
    const validCosmetics = [];
    
    for (let i = 0; i <= 50; i++) {
      try {
        // Check if this cosmetic type exists
        const exists = await cosmetics.typeExists(i);
        
        if (exists) {
          console.log(`\n✅ Cosmetic Type ${i} exists:`);
          
          // Get cosmetic info
          try {
            const info = await cosmetics.getCosmeticInfo(i);
            console.log(`   Name: ${info.name}`);
            console.log(`   Description: ${info.description}`);
            console.log(`   Image URI: ${info.imageURI}`);
            console.log(`   Slot: ${info.slot}`);
            console.log(`   Base Type: ${info.baseType}`);
            console.log(`   Max Supply: ${info.maxSupply.toString()}`);
            console.log(`   Current Supply: ${info.currentSupply.toString()}`);
            
            validCosmetics.push({
              id: i,
              name: info.name,
              slot: info.slot,
              maxSupply: info.maxSupply.toString(),
              currentSupply: info.currentSupply.toString()
            });
            
          } catch (infoError) {
            console.log(`   (Could not get detailed info: ${infoError.message})`);
            validCosmetics.push({ id: i });
          }
        }
      } catch (e) {
        // Type doesn't exist, continue
      }
    }
    
    console.log('\n📊 Summary of Valid Cosmetic Types:');
    console.log('='.repeat(50));
    
    if (validCosmetics.length === 0) {
      console.log('❌ No valid cosmetic types found!');
    } else {
      validCosmetics.forEach(cosmetic => {
        console.log(`ID ${cosmetic.id}: ${cosmetic.name || 'Unknown'} (Slot: ${cosmetic.slot || 'Unknown'})`);
      });
      
      console.log('\n🎯 For MAW Cosmetic Pool:');
      console.log('Valid cosmetic IDs:', validCosmetics.map(c => c.id));
      console.log('Plus Glass Shards (ID 1) as fallback');
      
      const cosmeticIds = [...validCosmetics.map(c => c.id), 1]; // Add Glass Shards
      console.log('\n🔧 Suggested cosmetic pool IDs:', cosmeticIds);
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

main().catch((error) => {
  console.error('Script failed:', error);
  process.exitCode = 1;
});