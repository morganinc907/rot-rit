const hre = require("hardhat");

async function main() {
  console.log('🎭 Testing currentCosmeticTypes getter...');
  
  const [signer] = await hre.ethers.getSigners();
  const mawAddress = "0xB2e77ce03BC688C993Ee31F03000c56c211AD7db";
  
  try {
    const maw = await hre.ethers.getContractAt("MawSacrificeV5", mawAddress);
    
    // Check current cosmetic pool
    console.log('\n📋 Current cosmetic pool:');
    const currentPool = await maw.getCosmeticPool();
    console.log('  IDs:', currentPool[0].map(id => id.toString()));
    console.log('  Weights:', currentPool[1].map(w => w.toString()));
    
    // Try to get current cosmetic types (this might be an array we need to check length)
    console.log('\n🎭 Checking currentCosmeticTypes...');
    
    // Since currentCosmeticTypes(uint256) takes an index, let's try to get them
    const cosmeticTypes = [];
    try {
      for (let i = 0; i < 20; i++) {
        try {
          const typeId = await maw.currentCosmeticTypes(i);
          if (typeId.toString() !== '0') {
            cosmeticTypes.push(typeId.toString());
            console.log(`   Index ${i}: Type ID ${typeId.toString()}`);
          } else if (i === 0) {
            // If first is 0, check if that's a valid type or just empty
            console.log(`   Index ${i}: Type ID ${typeId.toString()} (could be valid or empty)`);
            cosmeticTypes.push(typeId.toString());
          }
        } catch (e) {
          // No more types at this index
          console.log(`   Index ${i}: No type (${e.message.slice(0, 50)}...)`);
          break;
        }
      }
    } catch (e) {
      console.log('❌ Error accessing currentCosmeticTypes:', e.message);
    }
    
    console.log('\n📊 Current cosmetic types array:', cosmeticTypes);
    
    if (cosmeticTypes.length === 0) {
      console.log('\n💡 Solution: Need to set up cosmetic types first!');
      console.log('1. Find actual cosmetic IDs from CosmeticsV2 contract');
      console.log('2. Call setCurrentCosmeticTypes() with those IDs');
      console.log('3. Then Store.jsx can use a getter method or read the array');
      
      // Let's check what actual cosmetics exist
      console.log('\n🔍 Checking CosmeticsV2 for existing cosmetics...');
      
      const cosmeticsAddress = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
      const cosmetics = await hre.ethers.getContractAt("CosmeticsV2", cosmeticsAddress);
      
      const existingCosmetics = [];
      for (let id = 0; id < 50; id++) {
        try {
          const exists = await cosmetics.typeExists(id);
          if (exists) {
            try {
              const info = await cosmetics.getCosmeticInfo(id);
              if (info.name && info.name !== '' && info.slot > 0) { // Actual cosmetics have names and slots > 0
                existingCosmetics.push({
                  id: id,
                  name: info.name,
                  slot: info.slot,
                  active: info.active
                });
                console.log(`   ✅ ID ${id}: ${info.name} (Slot ${info.slot}, Active: ${info.active})`);
              }
            } catch (e) {
              console.log(`   ⚠️ ID ${id}: exists but couldn't get info`);
            }
          }
        } catch (e) {
          // Doesn't exist
        }
      }
      
      if (existingCosmetics.length > 0) {
        const activeCosmetics = existingCosmetics.filter(c => c.active);
        console.log(`\n🎯 Found ${activeCosmetics.length} active cosmetics:`, activeCosmetics.map(c => `${c.id}:${c.name}`));
        console.log('\n🔧 Recommended actions:');
        console.log(`1. Set current cosmetic types: setCurrentCosmeticTypes([${activeCosmetics.map(c => c.id).join(', ')}])`);
        console.log(`2. Update cosmetic pool: setCosmeticPool([1, ${activeCosmetics.map(c => c.id).join(', ')}], [equal weights...])`);
        console.log('3. Update Store.jsx to read currentCosmeticTypes array or use getCosmeticPool()');
      } else {
        console.log('\n❌ No active cosmetics found in CosmeticsV2 contract');
        console.log('💡 Need to create cosmetics first, then set up the arrays');
      }
    } else {
      console.log('\n✅ Cosmetic types are set up. Store.jsx should be able to read them.');
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

main().catch((error) => {
  console.error('Script failed:', error);
  process.exitCode = 1;
});